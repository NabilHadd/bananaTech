import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, Navigation, Package, Ruler, Scale, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { InfoTile } from '../../ui/InfoTile';
import { codigoCarga, codigoPedido, formatearNumero } from '../cargas/cargas.constants';
import { ViajeEstadoBadge } from '../flota/FlotaBadges';
import { MercaderiaBadge } from '../pedidos/PedidoBadges';
import { AsignacionResumen } from './AsignacionResumen';
import { FinalizarViajeModal } from './FinalizarViajeModal';
import type { LlegadaInput, Viaje } from './types';
import { codigoViaje, formatearCLP, formatearFecha } from './viajes.constants';

const accent = 'var(--accent-primary)';

interface ViajeDetalleModalProps {
  viaje: Viaje;
  onClose: () => void;
  /** Las acciones rechazan la promesa si la API las rechaza; la página muestra el error. */
  onFinalizar: (input: LlegadaInput) => Promise<void>;
  onCancelar: () => Promise<void>;
  onInvalido: (mensaje: string) => void;
}

/**
 * Ficha de un viaje: ruta, horario, camión, conductor y la carga que lleva.
 * Un viaje en ruta se finaliza registrando su llegada (HU5.2) o se cancela (HU5.3).
 */
export const ViajeDetalleModal: React.FC<ViajeDetalleModalProps> = ({
  viaje: v,
  onClose,
  onFinalizar,
  onCancelar,
  onInvalido,
}) => {
  const [finalizando, setFinalizando] = useState(false);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const enRuta = v.estado === 'EN_RUTA';

  const cancelar = async () => {
    setConfirmarCancelacion(false);
    setProcesando(true);
    try {
      await onCancelar();
    } catch {
      // La página ya mostró el error en el toast.
    } finally {
      setProcesando(false);
    }
  };

  const destino = v.carga.centro?.direccion ?? `centro #${v.carga.idCentro}`;
  const costoTotal = [v.costoDieselClp, v.costoPeajesClp, v.costoOperacionClp].every(
    (costo): costo is number => costo !== null,
  )
    ? v.costoDieselClp! + v.costoPeajesClp! + v.costoOperacionClp!
    : null;
  const kpis = [
    { label: 'Pedidos', icon: <Package size={14} />, value: v.carga.pedidos.length, unit: '' },
    { label: 'Peso', icon: <Scale size={14} />, value: formatearNumero(v.carga.pesoTotalKg), unit: 'kg' },
    { label: 'Volumen', icon: <Ruler size={14} />, value: formatearNumero(v.carga.volumenTotalM3), unit: 'm³' },
  ];

  return (
    <>
      <Modal
        icon={<Navigation color={accent} size={24} />}
        title={
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            Viaje {codigoViaje(v.id)}
            <ViajeEstadoBadge estado={v.estado} />
          </span>
        }
        subtitle={`${v.origen} ➔ ${destino} • carga ${codigoCarga(v.idCarga)}`}
        onClose={onClose}
        maxWidth="760px"
        footer={
          enRuta && (
            <>
              <Button
                variant="danger"
                icon={<XCircle size={16} />}
                disabled={procesando}
                onClick={() => setConfirmarCancelacion(true)}
                style={{ marginRight: 'auto' }}
              >
                Cancelar viaje
              </Button>
              <Button
                variant="primary"
                icon={<CheckCircle2 size={16} />}
                disabled={procesando}
                onClick={() => setFinalizando(true)}
              >
                Finalizar viaje
              </Button>
            </>
          )
        }
        header={
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
        }
      >
        <div className="stack">
          <div className="info-grid">
            <InfoTile label="Salida" value={formatearFecha(v.fechaInicio)} icon={<Calendar size={14} color={accent} />} />
            <InfoTile label="Llegada prevista" value={formatearFecha(v.fechaFin)} icon={<Clock size={14} color={accent} />} />
            <InfoTile
              label={v.fechaCancelacion ? 'Cancelado' : 'Llegada real'}
              value={
                v.fechaCancelacion
                  ? formatearFecha(v.fechaCancelacion)
                  : v.fechaLlegada
                    ? formatearFecha(v.fechaLlegada)
                    : 'En ruta'
              }
              icon={<MapPin size={14} color={accent} />}
            />
          </div>

          <AsignacionResumen camion={v.camion} conductor={v.conductor} />

          {costoTotal !== null && (
            <div className="info-grid">
              <InfoTile label="Ingreso por pedidos" value={formatearCLP(v.ingresoTotalClp)} />
              <InfoTile label="Diésel estimado" value={formatearCLP(v.costoDieselClp)} />
              <InfoTile label="Peajes estimados" value={formatearCLP(v.costoPeajesClp)} />
              <InfoTile label="Operación" value={formatearCLP(v.costoOperacionClp)} />
              <InfoTile label="Costo total estimado" value={formatearCLP(costoTotal)} />
              <InfoTile
                label={v.margenClp === null ? 'Margen' : `Margen (${v.margenPorcentaje}%)`}
                value={formatearCLP(v.margenClp)}
              />
            </div>
          )}

          {v.fechaLlegada && (
            <div className="callout callout-success">
              Recibido por <strong>{v.receptor ?? '—'}</strong>
              {v.observacion && <p style={{ margin: '0.35rem 0 0' }}>{v.observacion}</p>}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {v.carga.pedidos.map((p) => (
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
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                  {formatearNumero(p.pesoKg)} kg · {formatearNumero(p.volumenM3)} m³
                </span>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {finalizando && (
        <FinalizarViajeModal
          viaje={v}
          onInvalido={onInvalido}
          onClose={() => setFinalizando(false)}
          onSubmit={async (input) => {
            await onFinalizar(input);
            setFinalizando(false);
          }}
        />
      )}

      {confirmarCancelacion && (
        <ConfirmDialog
          title={`Cancelar el viaje ${codigoViaje(v.id)}`}
          icon={<XCircle color="var(--status-error)" size={22} />}
          confirmLabel="Cancelar viaje"
          tone="danger"
          onCancel={() => setConfirmarCancelacion(false)}
          onConfirm={cancelar}
        >
          El camión {v.camion.patente} y {v.conductor.nombres} {v.conductor.apellidos} quedan libres. La carga{' '}
          {codigoCarga(v.idCarga)} vuelve a Confirmada para salir en otro viaje, y sus pedidos dejan de estar en
          tránsito.
        </ConfirmDialog>
      )}
    </>
  );
};
