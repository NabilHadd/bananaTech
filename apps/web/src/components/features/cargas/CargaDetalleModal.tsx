import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  AlertCircle,
  AlertTriangle,
  Boxes,
  Gauge,
  Navigation,
  Package,
  PackageCheck,
  PackagePlus,
  Ruler,
  Scale,
  X,
  XCircle,
} from 'lucide-react';
import { getCamiones } from '../../../api/camion.api';
import { getOcupacionCarga } from '../../../api/carga.api';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Tabs } from '../../ui/Tabs';
import type { TabItem } from '../../ui/Tabs';
import type { Camion } from '../flota/types';
import { MercaderiaBadge } from '../pedidos/PedidoBadges';
import { AgregarPedidosModal } from './AgregarPedidosModal';
import { EstadoCargaBadge } from './CargaBadges';
import { codigoCarga, codigoPedido, formatearNumero } from './cargas.constants';
import { OcupacionPanel } from './OcupacionPanel';
import type { Carga, OcupacionCarga } from './types';

type Pestana = 'pedidos' | 'ocupacion';

interface CargaDetalleModalProps {
  carga: Carga;
  onClose: () => void;
  onAgregarPedidos: (idPedidos: number[]) => Promise<void>;
  onQuitarPedido: (idPedido: number) => Promise<void>;
  onConfirmar: () => Promise<void>;
  onCancelar: () => Promise<void>;
}

/** Ficha de una carga: sus pedidos, su ocupación y las acciones según su estado (HU4.1–4.3). */
export const CargaDetalleModal: React.FC<CargaDetalleModalProps> = ({
  carga,
  onClose,
  onAgregarPedidos,
  onQuitarPedido,
  onConfirmar,
  onCancelar,
}) => {
  const navigate = useNavigate();
  const editable = carga.estado === 'CREADA';
  const cancelable = carga.estado === 'CREADA' || carga.estado === 'CONFIRMADA';
  // La ocupación sólo sirve para decidir el camión: después de salir no aplica.
  const conOcupacion = cancelable;

  const [pestana, setPestana] = useState<Pestana>('pedidos');
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [agregando, setAgregando] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);

  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [idCamion, setIdCamion] = useState('');
  const [ocupacion, setOcupacion] = useState<OcupacionCarga | null>(null);

  useEffect(() => {
    if (!conOcupacion) return;
    const control = new AbortController();
    getCamiones({ busqueda: '', idTipoCamion: null, estado: null, capacidadMinKg: null }, control.signal)
      .then((data) => setCamiones(data.filter((c) => c.estado !== 'INACTIVO')))
      .catch(() => undefined);
    return () => control.abort();
  }, [conOcupacion]);

  // Se recalcula al cambiar de camión o cuando la carga gana o pierde pedidos (HU4.3).
  useEffect(() => {
      if (!idCamion) return;
    const control = new AbortController();
    getOcupacionCarga(carga.id, Number(idCamion), control.signal)
      .then(setOcupacion)
      .catch(() => undefined);
    return () => control.abort();
  }, [idCamion, carga]);

    const ocupacionActual = ocupacion?.idCamion === Number(idCamion) ? ocupacion : null;
    const cambiarCamion = (nuevoId: string) => {
      setOcupacion(null);
      setIdCamion(nuevoId);
    };

  const ejecutar = async (accion: () => Promise<void>) => {
    setErrorLocal(null);
    setProcesando(true);
    try {
      await accion();
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : 'Error inesperado');
    } finally {
      setProcesando(false);
    }
  };

  const kpis = [
    { label: 'Pedidos', icon: <Package size={14} />, value: carga.pedidos.length, unit: '' },
    { label: 'Peso total', icon: <Scale size={14} />, value: formatearNumero(carga.pesoTotalKg), unit: 'kg' },
    { label: 'Volumen total', icon: <Ruler size={14} />, value: formatearNumero(carga.volumenTotalM3), unit: 'm³' },
  ];

  const pestanas: TabItem<Pestana>[] = [
    {
      id: 'pedidos',
      label: `Pedidos (${carga.pedidos.length})`,
      icon: <Package size={15} />,
      alert: carga.incompatibilidad !== null,
    },
    ...(conOcupacion ? [{ id: 'ocupacion' as const, label: 'Ocupación', icon: <Gauge size={15} /> }] : []),
  ];

  const unico = carga.pedidos.length === 1;
  // Si la carga deja de admitir ocupación con la ficha abierta (p. ej. se cancela), vuelve a pedidos.
  const pestanaVisible: Pestana = conOcupacion ? pestana : 'pedidos';

  return (
    <>
      <Modal
        icon={<Boxes color="var(--accent-primary)" size={24} />}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            Carga {codigoCarga(carga.id)}
            <EstadoCargaBadge estado={carga.estado} />
          </span>
        }
        subtitle={
          carga.centro
            ? `Destino: ${carga.centro.direccion} • ${carga.centro.distanciaKm} km`
            : `Destino: centro #${carga.idCentro}`
        }
        onClose={onClose}
        maxWidth="760px"
        header={
          <>
            <div className="kpi-strip">
              {kpis.map((k) => (
                <div key={k.label} className="kpi">
                  <div className="kpi-label">{k.icon} {k.label}</div>
                  <div className="kpi-value">
                    {k.value} {k.unit && <span className="kpi-unit">{k.unit}</span>}
                  </div>
                </div>
              ))}
            </div>
            <Tabs items={pestanas} active={pestanaVisible} onChange={setPestana} />
          </>
        }
        footer={
          (cancelable || editable) && (
            <>
              {cancelable && (
                <Button
                  variant="danger"
                  icon={<XCircle size={16} />}
                  disabled={procesando}
                  onClick={() => setConfirmarCancelacion(true)}
                  style={{ marginRight: 'auto' }}
                >
                  Cancelar carga
                </Button>
              )}
              {carga.estado === 'CONFIRMADA' && (
                <Button
                  variant="primary"
                  icon={<Navigation size={16} />}
                  disabled={procesando}
                  onClick={() => navigate(`/viajes?carga=${carga.id}`)}
                >
                  Generar viaje
                </Button>
              )}
              {editable && (
                <Button
                  variant="primary"
                  icon={<PackageCheck size={16} />}
                  disabled={procesando || carga.incompatibilidad !== null}
                  title={carga.incompatibilidad ?? 'Valida compatibilidad y capacidad, y deja la carga lista para su viaje'}
                  onClick={() => ejecutar(onConfirmar)}
                >
                  Confirmar carga
                </Button>
              )}
            </>
          )
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {errorLocal && (
            <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{errorLocal}</span>
            </div>
          )}

          {pestanaVisible === 'pedidos' && (
            <>
              {carga.incompatibilidad && (
                <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                  <span>{carga.incompatibilidad} Quite uno de los pedidos para poder confirmarla.</span>
                </div>
              )}
              {carga.estado === 'CONFIRMADA' && (
                <div className="callout">
                  Carga lista para salir: se le asigna camión y conductor al generar su viaje.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {carga.pedidos.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.65rem 0.8rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-primary)',
                    }}
                  >
                    <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem' }}>
                      <strong>{codigoPedido(p.id)}</strong>
                      <span style={{ color: 'var(--text-secondary)' }}> · {p.cliente?.razon ?? `Cliente #${p.idCliente}`}</span>
                    </span>
                    <MercaderiaBadge tipo={p.tipoMercaderia} />
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', minWidth: '130px', textAlign: 'right' }}>
                      {formatearNumero(p.pesoKg)} kg · {formatearNumero(p.volumenM3)} m³
                    </span>
                    {editable && (
                      <Button
                        size="sm"
                        icon={<X size={13} />}
                        disabled={procesando || unico}
                        title={unico ? 'Es el único pedido: para deshacer la carga, cancélela' : 'Quitar de la carga'}
                        onClick={() => ejecutar(() => onQuitarPedido(p.id))}
                      >
                        Quitar
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              {editable && (
                <Button
                  icon={<PackagePlus size={16} />}
                  onClick={() => setAgregando(true)}
                  disabled={procesando}
                  style={{ width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}
                >
                  Agregar pedidos
                </Button>
              )}
            </>
          )}

          {pestanaVisible === 'ocupacion' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Si la llevara el camión</span>
                <Select
                  value={idCamion}
                  options={[
                    { value: '', label: 'Elegir camión' },
                    ...camiones.map((c) => ({
                      value: String(c.id),
                      label: c.patente,
                      sublabel: `${c.tipo} · ${formatearNumero(c.pesoMaxKg)} kg · ${formatearNumero(c.volumenMaxM3)} m³`,
                    })),
                  ]}
                  onChange={cambiarCamion}
                  minWidth="240px"
                />
              </div>
              {ocupacionActual && <OcupacionPanel ocupacion={ocupacionActual} />}
            </>
          )}
        </div>
      </Modal>

      {agregando && (
        <AgregarPedidosModal
          carga={carga}
          onClose={() => setAgregando(false)}
          onSubmit={async (ids) => {
            await onAgregarPedidos(ids);
            setAgregando(false);
          }}
        />
      )}

      {confirmarCancelacion && (
        <ConfirmDialog
          title={`Cancelar la carga ${codigoCarga(carga.id)}`}
          icon={<XCircle color="var(--status-error)" size={22} />}
          confirmLabel="Cancelar carga"
          tone="danger"
          onCancel={() => setConfirmarCancelacion(false)}
          onConfirm={() => {
            setConfirmarCancelacion(false);
            ejecutar(onCancelar);
          }}
        >
          Sus pedidos quedan libres para asignarlos a otra carga. La carga queda en el historial como Cancelada.
        </ConfirmDialog>
      )}
    </>
  );
};
