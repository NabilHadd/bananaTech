import React, { useCallback, useEffect, useState } from 'react';
import { Building2, FilterX, LoaderCircle, Plus, WifiOff } from 'lucide-react';
import {
  editarCliente,
  getCliente,
  getClientes,
  registrarCliente,
} from '../api/cliente.api';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { ClienteDetailModal } from '../components/features/clientes/ClienteDetailModal';
import { ClienteFilters } from '../components/features/clientes/ClienteFilters';
import { ClienteFormModal } from '../components/features/clientes/ClienteFormModal';
import { ClienteTable } from '../components/features/clientes/ClienteTable';
import { FILTROS_CLIENTES_VACIOS } from '../components/features/clientes/clientes.constants';
import type {
  Cliente,
  ClienteFiltros,
  ClienteInput,
} from '../components/features/clientes/types';

type Formulario = { modo: 'crear' } | { modo: 'editar'; cliente: Cliente };

const ESPERA_BUSQUEDA_MS = 250;

const esCancelacion = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : 'Error inesperado';

/**
 * Página "Clientes" (Épica 3: HU3.1): listado de clientes, ficha de detalle,
 * registro y edición con asociación de centro de distribución.
 */
export const ClientesPage: React.FC = () => {
  const [filtros, setFiltros] = useState<ClienteFiltros>(FILTROS_CLIENTES_VACIOS);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const { toast, showToast } = useToast();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Cliente | null>(null);

  // Cada acción que modifica datos incrementa `version` para refrescar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Total sin filtros, para el "Mostrando X de N clientes".
  useEffect(() => {
    const control = new AbortController();
    getClientes(FILTROS_CLIENTES_VACIOS, control.signal)
      .then((data) => setTotal(data.length))
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  // Consulta filtrada a la API
  useEffect(() => {
    const control = new AbortController();
    const timer = window.setTimeout(() => {
      setCargando(true);
      getClientes(filtros, control.signal)
        .then((data) => {
          setClientes(data);
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

  // Carga de la ficha si está seleccionada
  useEffect(() => {
    if (fichaId === null) {
      setFicha(null);
      return;
    }
    const control = new AbortController();
    getCliente(fichaId, control.signal)
      .then((data) => setFicha(data))
      .catch((e) => {
        if (!esCancelacion(e)) {
          showToast(mensajeDe(e), 'error');
          setFichaId(null);
        }
      });
    return () => control.abort();
  }, [fichaId, version, showToast]);

  const handleSubmit = async (input: ClienteInput) => {
    if (!formulario) return;
    try {
      if (formulario.modo === 'crear') {
        const creado = await registrarCliente(input);
        showToast(`Cliente ${creado.razon} registrado correctamente`, 'success');
      } else {
        const editado = await editarCliente(formulario.cliente.id, input);
        showToast(`Cliente ${editado.razon} actualizado`, 'success');
      }
      setFormulario(null);
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
    }
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar los clientes"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando clientes..." />
  ) : (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ningún cliente cumple con los filtros seleccionados"
      action={<Button onClick={() => setFiltros(FILTROS_CLIENTES_VACIOS)}>Limpiar filtros</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Building2 color="var(--accent-primary)" /> Clientes
          </h1>
          <p className="text-muted">
            Administración de clientes, direcciones y centros de distribución
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setFormulario({ modo: 'crear' })}
        >
          Registrar cliente
        </Button>
      </div>

      <ClienteFilters
        filtros={filtros}
        onChange={setFiltros}
        onReset={() => setFiltros(FILTROS_CLIENTES_VACIOS)}
        visibles={error ? 0 : clientes.length}
        total={total}
      />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <ClienteTable
          clientes={error ? [] : clientes}
          onSelect={(c) => setFichaId(c.id)}
          onEdit={(c) => setFormulario({ modo: 'editar', cliente: c })}
          empty={tablaVacia}
        />
      </div>

      {/* Ficha del cliente */}
      {ficha && (
        <ClienteDetailModal
          cliente={ficha}
          onClose={() => setFichaId(null)}
          onEditar={() => {
            const clienteAEditar = ficha;
            setFichaId(null);
            setFormulario({ modo: 'editar', cliente: clienteAEditar });
          }}
        />
      )}

      {/* Formulario de registro o edición */}
      {formulario && (
        <ClienteFormModal
          cliente={formulario.modo === 'editar' ? formulario.cliente : undefined}
          onSubmit={handleSubmit}
          onClose={() => setFormulario(null)}
        />
      )}
    </div>
  );
};
