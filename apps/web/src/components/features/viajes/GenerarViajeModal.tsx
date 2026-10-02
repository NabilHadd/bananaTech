import React, { useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, Boxes, Hand, LoaderCircle, Navigation, RotateCcw, Sparkles } from 'lucide-react';
import { getOcupacionCarga } from '../../../api/carga.api';
import { getCamionesParaViaje, getConductoresParaViaje, proponerViaje } from '../../../api/viaje.api';
import { EmptyState } from '../../common/EmptyState';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Tabs } from '../../ui/Tabs';
import type { TabItem } from '../../ui/Tabs';
import { OcupacionPanel } from '../cargas/OcupacionPanel';
import type { Carga, OcupacionCarga } from '../cargas/types';
import type { Conductor } from '../conductores/types';
import type { Camion } from '../flota/types';
import { AsignacionResumen } from './AsignacionResumen';
import type { PropuestaViaje, ViajeInput } from './types';
import { formatearDuracion, opcionCamion, opcionCarga, opcionConductor } from './viajes.constants';

type Modo = 'automatico' | 'manual';

interface GenerarViajeModalProps {
  /** Cargas Confirmadas: las únicas que pueden salir en un viaje. */
  cargas: Carga[];
  idCargaInicial: number | null;
  onSubmit: (input: ViajeInput) => Promise<void>;
  onClose: () => void;
}

const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';
const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : 'Error inesperado');

const etiqueta = { fontSize: '0.8125rem', color: 'var(--text-secondary)', minWidth: '80px' } as const;

/**
 * Genera un viaje para una carga Confirmada (HU5.1), con la propuesta del
 * motor o armándolo a mano. Qué camiones y conductores son compatibles lo
 * decide el backend: aquí sólo se muestran sus listas.
 */
export const GenerarViajeModal: React.FC<GenerarViajeModalProps> = ({ cargas, idCargaInicial, onSubmit, onClose }) => {
  const [idCarga, setIdCarga] = useState(() => {
    if (idCargaInicial !== null && cargas.some((c) => c.id === idCargaInicial)) return String(idCargaInicial);
    return cargas.length === 1 ? String(cargas[0].id) : '';
  });
  const [modo, setModo] = useState<Modo>('automatico');
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  // Se incrementa tras un rechazo para volver a consultar: otro viaje pudo
  // tomar el camión o el conductor mientras el modal estaba abierto.
  const [intento, setIntento] = useState(0);

  const [propuesta, setPropuesta] = useState<PropuestaViaje | null>(null);
  const [sinPropuesta, setSinPropuesta] = useState<string | null>(null);
  const [proponiendo, setProponiendo] = useState(false);

  const [idCamion, setIdCamion] = useState('');
  const [idConductor, setIdConductor] = useState('');
  // null mientras no llega la lista, para no mostrar "ninguno" antes de tiempo.
  const [camiones, setCamiones] = useState<Camion[] | null>(null);
  const [conductores, setConductores] = useState<Conductor[] | null>(null);
  const [ocupacion, setOcupacion] = useState<OcupacionCarga | null>(null);

  const carga = cargas.find((c) => String(c.id) === idCarga) ?? null;

  // Automático: el motor propone camión y conductor, o explica por qué no puede.
  useEffect(() => {
    setPropuesta(null);
    setSinPropuesta(null);
    if (!idCarga || modo !== 'automatico') return;
    const control = new AbortController();
    setProponiendo(true);
    proponerViaje(Number(idCarga), control.signal)
      .then(setPropuesta)
      .catch((e) => !esCancelacion(e) && setSinPropuesta(mensajeDe(e)))
      .finally(() => !control.signal.aborted && setProponiendo(false));
    return () => control.abort();
  }, [idCarga, modo, intento]);

  // Manual: cada lista se filtra por lo elegido en la otra. Si lo elegido deja
  // de estar en su lista (p. ej. tras un rechazo), se deselecciona.
  useEffect(() => {
    if (!idCarga || modo !== 'manual') return;
    const control = new AbortController();
    getCamionesParaViaje(Number(idCarga), idConductor ? Number(idConductor) : null, control.signal)
      .then((lista) => {
        setCamiones(lista);
        setIdCamion((actual) => (lista.some((c) => String(c.id) === actual) ? actual : ''));
      })
      .catch((e) => !esCancelacion(e) && setErrorLocal(mensajeDe(e)));
    return () => control.abort();
  }, [idCarga, idConductor, modo, intento]);

  useEffect(() => {
    if (!idCarga || modo !== 'manual') return;
    const control = new AbortController();
    getConductoresParaViaje(Number(idCarga), idCamion ? Number(idCamion) : null, control.signal)
      .then((lista) => {
        setConductores(lista);
        setIdConductor((actual) => (lista.some((c) => String(c.id) === actual) ? actual : ''));
      })
      .catch((e) => !esCancelacion(e) && setErrorLocal(mensajeDe(e)));
    return () => control.abort();
  }, [idCarga, idCamion, modo, intento]);

  useEffect(() => {
    setOcupacion(null);
    if (!idCarga || !idCamion || modo !== 'manual') return;
    const control = new AbortController();
    getOcupacionCarga(Number(idCarga), Number(idCamion), control.signal)
      .then(setOcupacion)
      .catch(() => undefined);
    return () => control.abort();
  }, [idCarga, idCamion, modo]);

  const cambiarCarga = (valor: string) => {
    setIdCarga(valor);
    setCamiones(null);
    setConductores(null);
    setIdCamion('');
    setIdConductor('');
    setErrorLocal(null);
  };

  const limpiarManual = () => {
    setIdCamion('');
    setIdConductor('');
    setErrorLocal(null);
  };

  const eleccion: ViajeInput | null =
    modo === 'automatico'
      ? propuesta && {
          idCarga: Number(idCarga),
          idCamion: propuesta.camion.id,
          idConductor: propuesta.conductor.id,
        }
      : idCarga && idCamion && idConductor
        ? { idCarga: Number(idCarga), idCamion: Number(idCamion), idConductor: Number(idConductor) }
        : null;

  const generar = async () => {
    if (!eleccion) return;
    setErrorLocal(null);
    setProcesando(true);
    try {
      await onSubmit(eleccion);
    } catch (e) {
      setErrorLocal(mensajeDe(e));
      setIntento((i) => i + 1);
    } finally {
      setProcesando(false);
    }
  };

  const pestanas: TabItem<Modo>[] = [
    { id: 'automatico', label: 'Asignación automática', icon: <Sparkles size={15} /> },
    { id: 'manual', label: 'Armar a mano', icon: <Hand size={15} /> },
  ];

  const camionElegido = camiones?.find((c) => String(c.id) === idCamion);
  const conductorElegido = conductores?.find((c) => String(c.id) === idConductor);

  return (
    <Modal
      icon={<Navigation color="var(--accent-primary)" size={24} />}
      title="Generar viaje"
      subtitle="El viaje sale al generarlo: la carga queda En ruta y sus pedidos En tránsito."
      onClose={onClose}
      maxWidth="760px"
      preventCloseOnBackdrop={procesando}
      header={cargas.length > 0 && <Tabs items={pestanas} active={modo} onChange={setModo} />}
      footer={
        cargas.length > 0 && (
          <>
            <Button onClick={onClose} disabled={procesando}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              icon={<Navigation size={16} />}
              disabled={!eleccion || procesando}
              onClick={generar}
            >
              {procesando ? 'Generando...' : 'Generar viaje'}
            </Button>
          </>
        )
      }
    >
      {cargas.length === 0 ? (
        <EmptyState
          icon={<Boxes size={36} />}
          title="No hay cargas Confirmadas"
          description="Confirme una carga en la pestaña Cargas para poder generarle un viaje."
        />
      ) : (
        <div className="stack">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={etiqueta}>Carga</span>
            <Select
              value={idCarga}
              options={[{ value: '', label: 'Elegir carga Confirmada' }, ...cargas.map(opcionCarga)]}
              onChange={cambiarCarga}
              minWidth="420px"
            />
          </div>
          {carga?.centro && (
            <div className="callout">
              Destino <strong>{carga.centro.direccion}</strong> · {carga.centro.distanciaKm} km · llegada prevista{' '}
              {formatearDuracion(carga.centro.distanciaMin)} después de la salida.
            </div>
          )}

          {errorLocal && (
            <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorLocal}</span>
            </div>
          )}

          {!idCarga ? (
            <div className="callout">Elija la carga que va a salir.</div>
          ) : modo === 'automatico' ? (
            proponiendo ? (
              <EmptyState icon={<LoaderCircle size={32} />} title="Buscando camión y conductor..." />
            ) : sinPropuesta ? (
              <div className="callout callout-error">
                <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={16} /> No hay una asignación posible
                </strong>
                <p style={{ margin: '0.35rem 0 0.75rem' }}>{sinPropuesta}</p>
                <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => setIntento((i) => i + 1)}>
                  Volver a intentar
                </Button>
              </div>
            ) : (
              propuesta && (
                <>
                  <div className="callout callout-success">
                    Propuesta del motor: el camión disponible que mejor se llena con esta carga y un conductor con
                    licencia para él, descansado y sin otro viaje.
                  </div>
                  <AsignacionResumen camion={propuesta.camion} conductor={propuesta.conductor} />
                  <OcupacionPanel ocupacion={propuesta.ocupacion} />
                </>
              )
            )
          ) : (
            <>
              <div className="callout">
                Las listas sólo muestran opciones compatibles: elegir un camión deja los conductores con licencia
                para él, y elegir un conductor deja los camiones que puede llevar.
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={etiqueta}>Camión</span>
                <Select
                  value={idCamion}
                  options={[
                    { value: '', label: `Elegir camión (${camiones?.length ?? '…'})` },
                    ...(camiones ?? []).map(opcionCamion),
                  ]}
                  highlighted={idCamion !== ''}
                  onChange={setIdCamion}
                  minWidth="320px"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={etiqueta}>Conductor</span>
                <Select
                  value={idConductor}
                  options={[
                    { value: '', label: `Elegir conductor (${conductores?.length ?? '…'})` },
                    ...(conductores ?? []).map(opcionConductor),
                  ]}
                  highlighted={idConductor !== ''}
                  onChange={setIdConductor}
                  minWidth="320px"
                />
                {(idCamion || idConductor) && (
                  <Button size="sm" icon={<RotateCcw size={13} />} onClick={limpiarManual}>
                    Limpiar
                  </Button>
                )}
              </div>

              {camiones?.length === 0 && (
                <div className="callout callout-error">
                  Ningún camión disponible puede llevar esta carga{idConductor ? ' con ese conductor' : ''}.
                </div>
              )}
              {conductores?.length === 0 && (
                <div className="callout callout-error">
                  Ningún conductor disponible puede hacer este viaje{idCamion ? ' con ese camión' : ''}.
                </div>
              )}

              {camionElegido && conductorElegido && (
                <AsignacionResumen camion={camionElegido} conductor={conductorElegido} />
              )}
              {ocupacion && <OcupacionPanel ocupacion={ocupacion} />}
            </>
          )}
        </div>
      )}
    </Modal>
  );
};
