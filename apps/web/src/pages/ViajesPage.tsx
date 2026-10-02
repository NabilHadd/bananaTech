import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { FilterX, LoaderCircle, Navigation, Plus, WifiOff } from 'lucide-react';
import { getCargas } from '../api/carga.api';
import { agregarViaje, cancelarViaje, finalizarViaje, getViajes } from '../api/viaje.api';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import type { Carga } from '../components/features/cargas/types';
import type { ViajeEstado } from '../components/features/flota/types';
import { GenerarViajeModal } from '../components/features/viajes/GenerarViajeModal';
import { ViajeDetalleModal } from '../components/features/viajes/ViajeDetalleModal';
import { ViajeTable } from '../components/features/viajes/ViajeTable';
import type { LlegadaInput, Viaje, ViajeInput } from '../components/features/viajes/types';
import { codigoViaje, ESTADO_VIAJE_OPCIONES } from '../components/features/viajes/viajes.constants';

const esCancelacion = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) =>
  error instanceof Error ? error.message : 'Error inesperado';

/**
 * Página "Viajes" (Épica 5: HU5.1): listado de viajes y generación de uno
 * nuevo para una carga Confirmada, propuesto por el motor o armado a mano.
 *
 * `/viajes?carga=ID` abre el modal con esa carga elegida (lo usa la ficha de
 * la carga).
 */
export const ViajesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const cargaParam = Number(searchParams.get('carga'));
  const idCargaInicial = Number.isInteger(cargaParam) && cargaParam > 0 ? cargaParam : null;

  const [estado, setEstado] = useState<ViajeEstado | ''>('');
  const [seleccionado, setSeleccionado] = useState<Viaje | null>(null);
  const [generando, setGenerando] = useState(idCargaInicial !== null);
  const { toast, showToast } = useToast();

  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmadas, setConfirmadas] = useState<Carga[] | null>(null);

  // Cada acción que modifica datos incrementa `version` para refrescar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  // Total sin filtros, para el "Mostrando X de N viajes".
  useEffect(() => {
    const control = new AbortController();
    getViajes('', control.signal)
      .then((data) => setTotal(data.length))
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  useEffect(() => {
    const control = new AbortController();
    setCargando(true);
    getViajes(estado, control.signal)
      .then((data) => {
        setViajes(data);
        setError(null);
      })
      .catch((e) => !esCancelacion(e) && setError(mensajeDe(e)))
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, [estado, version]);

  // Las cargas que pueden salir: se piden al abrir el modal, para que estén al día.
  useEffect(() => {
    if (!generando) return;
    const control = new AbortController();
    setConfirmadas(null);
    getCargas('CONFIRMADA', control.signal)
      .then(setConfirmadas)
      .catch((e) => {
        if (esCancelacion(e)) return;
        showToast(mensajeDe(e), 'error');
        setGenerando(false);
      });
    return () => control.abort();
  }, [generando, showToast]);

  const cerrarGenerar = () => {
    setGenerando(false);
    if (searchParams.has('carga')) setSearchParams({}, { replace: true });
  };

  const handleGenerar = async (input: ViajeInput) => {
    const viaje = await agregarViaje(input);
    showToast(
      `Viaje ${codigoViaje(viaje.id)} en ruta: ${viaje.camion.patente} con ${viaje.conductor.nombres} ${viaje.conductor.apellidos}`,
      'success',
    );
    cerrarGenerar();
    setSeleccionado(viaje);
    recargar();
  };

  /** Ejecuta una acción sobre el viaje abierto y deja la ficha con el resultado. */
  const actualizar = async (accion: () => Promise<Viaje>, mensaje: (v: Viaje) => string) => {
    try {
      const viaje = await accion();
      setSeleccionado(viaje);
      showToast(mensaje(viaje), 'success');
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
      throw e;
    }
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar los viajes"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando viajes..." />
  ) : estado ? (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ningún viaje está en ese estado"
      action={<Button onClick={() => setEstado('')}>Ver todos</Button>}
    />
  ) : (
    <EmptyState
      icon={<Navigation size={36} />}
      title="Aún no hay viajes"
      description="Genere un viaje para una carga Confirmada: el sistema propone camión y conductor, o puede elegirlos usted."
      action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setGenerando(true)}>Generar viaje</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Navigation color="var(--accent-primary)" /> Viajes
          </h1>
          <p className="text-muted">
            Asignación de camión y conductor a las cargas Confirmadas y seguimiento de los viajes
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setGenerando(true)}>
          Generar viaje
        </Button>
      </div>

      <div className="glass-panel filters-panel">
        <div className="filters-row">
          <div className="filters-controls">
            <Select
              label="Estado"
              value={estado}
              options={ESTADO_VIAJE_OPCIONES}
              highlighted={estado !== ''}
              onChange={(v) => setEstado(v as ViajeEstado | '')}
              minWidth="200px"
            />
          </div>
        </div>
        <div className="filters-summary">
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{error ? 0 : viajes.length}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> viajes
          </span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <ViajeTable viajes={error ? [] : viajes} onSelect={setSeleccionado} empty={tablaVacia} />
      </div>

      {generando && confirmadas && (
        <GenerarViajeModal
          cargas={confirmadas}
          idCargaInicial={idCargaInicial}
          onSubmit={handleGenerar}
          onClose={cerrarGenerar}
        />
      )}

      {seleccionado && (
        <ViajeDetalleModal
          viaje={seleccionado}
          onClose={() => setSeleccionado(null)}
          onInvalido={(mensaje) => showToast(mensaje, 'error')}
          onFinalizar={(input: LlegadaInput) =>
            actualizar(
              () => finalizarViaje(seleccionado.id, input),
              (v) => `Viaje ${codigoViaje(v.id)} finalizado: carga entregada a ${v.receptor}`,
            )
          }
          onCancelar={() =>
            actualizar(
              () => cancelarViaje(seleccionado.id),
              (v) => `Viaje ${codigoViaje(v.id)} cancelado: la carga vuelve a Confirmada`,
            )
          }
        />
      )}
    </div>
  );
};
