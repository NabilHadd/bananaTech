import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Navigation, Plus } from 'lucide-react';
import { getCargas } from '../api/carga.api';
import { agregarViaje, cancelarViaje, finalizarViaje, getViajes } from '../api/viaje.api';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import type { Carga } from '../components/features/cargas/types';
import type { ViajeEstado } from '../components/features/flota/types';
import { GenerarViajeModal } from '../components/features/viajes/GenerarViajeModal';
import { ViajeDetalleModal } from '../components/features/viajes/ViajeDetalleModal';
import { ViajesEmptyState } from '../components/features/viajes/ViajesEmptyState';
import { ViajesFilterBar } from '../components/features/viajes/ViajesFilterBar';
import { ViajeTable } from '../components/features/viajes/ViajeTable';
import type { LlegadaInput, Viaje, ViajeInput } from '../components/features/viajes/types';
import { codigoViaje } from '../components/features/viajes/viajes.constants';

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
  const [versionGeneracion, setVersionGeneracion] = useState(0);
  const [resultadoConfirmadas, setResultadoConfirmadas] = useState<{
    version: number;
    cargas: Carga[];
  } | null>(null);
  const confirmadas = resultadoConfirmadas?.version === versionGeneracion
    ? resultadoConfirmadas.cargas
    : null;

  // Cada acción que modifica datos incrementa `version` para refrescar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => {
    setCargando(true);
    setVersion((v) => v + 1);
  }, []);
  const cambiarEstado = (nuevoEstado: ViajeEstado | '') => {
    setCargando(true);
    setEstado(nuevoEstado);
  };

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
    const version = versionGeneracion;
    const control = new AbortController();
    getCargas('CONFIRMADA', control.signal)
      .then((cargas) => setResultadoConfirmadas({ version, cargas }))
      .catch((e) => {
        if (esCancelacion(e)) return;
        showToast(mensajeDe(e), 'error');
        setGenerando(false);
      });
    return () => control.abort();
  }, [generando, versionGeneracion, showToast]);

  const abrirGenerar = () => {
    setVersionGeneracion((version) => version + 1);
    setGenerando(true);
  };

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

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <PageHeader
        title="Viajes"
        icon={<Navigation size={22} />}
        description="Asignación de camión y conductor a las cargas Confirmadas y seguimiento de los viajes"
        actions={<Button variant="primary" icon={<Plus size={16} />} onClick={abrirGenerar}>Generar viaje</Button>}
      />

      <ViajesFilterBar estado={estado} visibles={error ? 0 : viajes.length} total={total} onEstadoChange={cambiarEstado} />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <ViajeTable viajes={error ? [] : viajes} onSelect={setSeleccionado} empty={
          <ViajesEmptyState
            error={error}
            loading={cargando}
            estado={estado}
            onRetry={recargar}
            onClearFilter={() => cambiarEstado('')}
            onCreate={abrirGenerar}
          />
        } />
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
