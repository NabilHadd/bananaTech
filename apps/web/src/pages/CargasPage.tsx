import React, { useCallback, useEffect, useState } from 'react';
import { Boxes, FilterX, LoaderCircle, Plus, WifiOff } from 'lucide-react';
import {
  agregarPedidosACarga,
  cancelarCarga,
  confirmarCarga,
  crearCarga,
  getCargas,
  quitarPedidoDeCarga,
} from '../api/carga.api';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { CargaDetalleModal } from '../components/features/cargas/CargaDetalleModal';
import { CargaFormModal } from '../components/features/cargas/CargaFormModal';
import { CargaTable } from '../components/features/cargas/CargaTable';
import { codigoCarga, ESTADO_CARGA_OPCIONES } from '../components/features/cargas/cargas.constants';
import type { Carga, CargaEstado } from '../components/features/cargas/types';

const esCancelacion = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : 'Error inesperado';

/**
 * Página "Cargas" (Épica 4: HU4.1, HU4.2 y HU4.3): agrupar pedidos, confirmar
 * cargas y ver su ocupación. El viaje (E05) las lleva de Confirmada a En ruta.
 */
export const CargasPage: React.FC = () => {
  const [estado, setEstado] = useState<CargaEstado | ''>('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [seleccionada, setSeleccionada] = useState<Carga | null>(null);
  const { toast, showToast } = useToast();

  const [cargas, setCargas] = useState<Carga[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cada acción que modifica datos incrementa `version` para refrescar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);
  const cambiarEstado = (nuevoEstado: CargaEstado | '') => {
    setCargando(true);
    setEstado(nuevoEstado);
  };

  // Total sin filtros, para el "Mostrando X de N cargas".
  useEffect(() => {
    const control = new AbortController();
    getCargas('', control.signal)
      .then((data) => setTotal(data.length))
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  useEffect(() => {
    const control = new AbortController();
    getCargas(estado, control.signal)
      .then((data) => {
        setCargas(data);
        setError(null);
      })
      .catch((e) => !esCancelacion(e) && setError(mensajeDe(e)))
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, [estado, version]);

  const handleCrear = async (idPedidos: number[]) => {
    const nueva = await crearCarga(idPedidos);
    showToast(`Carga ${codigoCarga(nueva.id)} creada con ${nueva.pedidos.length} pedido(s)`, 'success');
    setModalAbierto(false);
    setSeleccionada(nueva);
    recargar();
  };

  /** Ejecuta una acción sobre la carga abierta y deja la ficha con el resultado. */
  const actualizar = async (accion: () => Promise<Carga>, mensaje: string) => {
    const carga = await accion();
    setSeleccionada(carga);
    showToast(mensaje, 'success');
    recargar();
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar las cargas"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando cargas..." />
  ) : estado ? (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ninguna carga está en ese estado"
      action={<Button onClick={() => cambiarEstado('')}>Ver todas</Button>}
    />
  ) : (
    <EmptyState
      icon={<Boxes size={36} />}
      title="Aún no hay cargas"
      description="Agrupe pedidos Creada que van al mismo destino para moverlos en un mismo camión."
      action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModalAbierto(true)}>Crear carga</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <PageHeader
        title="Cargas"
        icon={<Boxes size={22} />}
        description="Agrupación de pedidos, validación de compatibilidad y ocupación por camión"
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModalAbierto(true)}>Crear carga</Button>}
      />

      <div className="glass-panel filters-panel">
        <div className="filters-row">
          <div className="filters-controls">
            <Select
              label="Estado"
              value={estado}
              options={[
                { value: '', label: 'Todos los estados' },
                ...ESTADO_CARGA_OPCIONES.map((e) => ({ value: e.valor, label: e.label })),
              ]}
              highlighted={estado !== ''}
              onChange={(v) => cambiarEstado(v as CargaEstado | '')}
              minWidth="200px"
            />
          </div>
        </div>
        <div className="filters-summary">
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{error ? 0 : cargas.length}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> cargas
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <CargaTable cargas={error ? [] : cargas} onSelect={setSeleccionada} empty={tablaVacia} />
      </div>

      {modalAbierto && <CargaFormModal onSubmit={handleCrear} onClose={() => setModalAbierto(false)} />}

      {seleccionada && (
        <CargaDetalleModal
          carga={seleccionada}
          onClose={() => setSeleccionada(null)}
          onAgregarPedidos={(idPedidos) =>
            actualizar(
              () => agregarPedidosACarga(seleccionada.id, idPedidos),
              idPedidos.length === 1 ? 'Pedido agregado a la carga' : `${idPedidos.length} pedidos agregados a la carga`,
            )
          }
          onQuitarPedido={(idPedido) =>
            actualizar(() => quitarPedidoDeCarga(seleccionada.id, idPedido), 'Pedido quitado de la carga')
          }
          onConfirmar={() =>
            actualizar(() => confirmarCarga(seleccionada.id), `Carga ${codigoCarga(seleccionada.id)} confirmada`)
          }
          onCancelar={() =>
            actualizar(() => cancelarCarga(seleccionada.id), `Carga ${codigoCarga(seleccionada.id)} cancelada`)
          }
        />
      )}
    </div>
  );
};
