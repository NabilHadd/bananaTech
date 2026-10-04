import React, { useCallback, useEffect, useState } from 'react';
import { FilterX, LoaderCircle, Package, Plus, WifiOff } from 'lucide-react';
import {
  cancelarPedido,
  crearPedido,
  getPedidos,
} from '../api/pedido.api';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { PedidoDetalleModal } from '../components/features/pedidos/PedidoDetalleModal';
import { PedidoFilters } from '../components/features/pedidos/PedidoFilters';
import { PedidoFormModal } from '../components/features/pedidos/PedidoFormModal';
import { PedidoTable } from '../components/features/pedidos/PedidoTable';
import { FILTROS_INICIALES_PEDIDOS, FILTROS_PEDIDOS_VACIOS } from '../components/features/pedidos/pedidos.constants';
import type {
  Pedido,
  PedidoFiltros,
  PedidoInput,
} from '../components/features/pedidos/types';

const ESPERA_BUSQUEDA_MS = 250;

const esCancelacion = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : 'Error inesperado';

/**
 * Página "Pedidos" (Épica 3: HU3.2, HU3.3 y HU3.4): listado priorizado y filtros para planificación.
 */
export const PedidosPage: React.FC = () => {
  const [filtros, setFiltros] = useState<PedidoFiltros>(FILTROS_INICIALES_PEDIDOS);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);
  const { toast, showToast } = useToast();

  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cada acción que modifica datos incrementa `version` para refrescar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Total sin filtros, para el "Mostrando X de N pedidos".
  useEffect(() => {
    const control = new AbortController();
    getPedidos(FILTROS_PEDIDOS_VACIOS, control.signal)
      .then((data) => setTotal(data.length))
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  // Consulta filtrada a la API
  useEffect(() => {
    const control = new AbortController();
    const timer = window.setTimeout(() => {
      setCargando(true);
      getPedidos(filtros, control.signal)
        .then((data) => {
          setPedidos(data);
          setError(null);
        })
        .catch((e) => !esCancelacion(e) && setError(mensajeDe(e)))
        .finally(() => !control.signal.aborted && setCargando(false));
    }, ESPERA_BUSQUEDA_MS);

    return () => {
      window.clearTimeout(timer);
      control.abort();
    };
  }, [filtros, version]);

  const handleCrearPedido = async (input: PedidoInput) => {
    try {
      const nuevo = await crearPedido(input);
      showToast(`Pedido #PED-${String(nuevo.id).padStart(4, '0')} registrado en estado Creada`, 'success');
      setModalAbierto(false);
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
      throw e;
    }
  };

  const handleCancelarPedido = async (id: number) => {
    try {
      await cancelarPedido(id);
      showToast(`Pedido #PED-${String(id).padStart(4, '0')} cancelado correctamente`, 'success');
      setPedidoSeleccionado(null);
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
      throw e;
    }
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar los pedidos"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando pedidos..." />
  ) : (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ningún pedido cumple con los filtros seleccionados"
      action={<Button onClick={() => setFiltros(FILTROS_PEDIDOS_VACIOS)}>Limpiar filtros</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <PageHeader
        title="Pedidos"
        icon={<Package size={22} />}
        description="Listado y priorización de pedidos para planificación de transporte"
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setModalAbierto(true)}>Crear pedido</Button>}
      />

      <PedidoFilters
        filtros={filtros}
        onChange={setFiltros}
        onReset={() => setFiltros(FILTROS_PEDIDOS_VACIOS)}
        visibles={error ? 0 : pedidos.length}
        total={total}
      />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <PedidoTable
          pedidos={error ? [] : pedidos}
          onSelect={(p) => setPedidoSeleccionado(p)}
          empty={tablaVacia}
        />
      </div>

      {modalAbierto && (
        <PedidoFormModal
          onSubmit={handleCrearPedido}
          onInvalido={(mensaje) => showToast(mensaje, 'error')}
          onClose={() => setModalAbierto(false)}
        />
      )}

      {pedidoSeleccionado && (
        <PedidoDetalleModal
          pedido={pedidoSeleccionado}
          onClose={() => setPedidoSeleccionado(null)}
          onCancelar={handleCancelarPedido}
        />
      )}
    </div>
  );
};

