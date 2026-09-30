import React, { useState } from 'react';
import { Package, MapPin, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { EstadoPedidoBadge, MercaderiaBadge } from './PedidoBadges';
import type { Pedido } from './types';

interface PedidoDetalleModalProps {
  pedido: Pedido;
  onClose: () => void;
  onMarcarTransito: (id: number) => Promise<void>;
  onCancelar: (id: number) => Promise<void>;
  onAbrirEntrega: () => void;
}

function formatearFecha(iso: string): string {
  if (!iso) return '-';
  const fecha = new Date(iso);
  if (isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}

export const PedidoDetalleModal: React.FC<PedidoDetalleModalProps> = ({
  pedido,
  onClose,
  onMarcarTransito,
  onCancelar,
  onAbrirEntrega,
}) => {
  const [procesando, setProcesando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const handleTransito = async () => {
    setErrorLocal(null);
    setProcesando(true);
    try {
      await onMarcarTransito(pedido.id);
      onClose();
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : 'Error al cambiar estado');
      setProcesando(false);
    }
  };

  const handleCancelar = async () => {
    if (!window.confirm('¿Está seguro de que desea cancelar este pedido?')) return;
    setErrorLocal(null);
    setProcesando(true);
    try {
      await onCancelar(pedido.id);
      onClose();
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : 'Error al cancelar');
      setProcesando(false);
    }
  };

  return (
    <Modal
      title={`Pedido #PED-${String(pedido.id).padStart(4, '0')}`}
      icon={<Package color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="600px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {errorLocal && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-error)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-error)',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorLocal}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Estado</div>
            <div style={{ marginTop: '0.25rem' }}><EstadoPedidoBadge estado={pedido.estado} /></div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Tipo de Carga</div>
            <div style={{ marginTop: '0.25rem' }}><MercaderiaBadge tipo={pedido.tipoMercaderia} /></div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Cliente</div>
            <div style={{ fontWeight: 500 }}>{pedido.cliente?.razon}</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>RUT: {pedido.cliente?.rut}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Destino</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 500 }}>
              <MapPin size={14} color="var(--accent-primary)" />
              <span>{pedido.centro?.direccion}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Peso y Volumen</div>
            <div style={{ fontWeight: 500 }}>{pedido.pesoKg} kg · {pedido.volumenM3} m³</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Ventana de Entrega</div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> {formatearFecha(pedido.ventanaInicio)}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <Clock size={13} /> {formatearFecha(pedido.ventanaFin)}
            </div>
          </div>

          {pedido.estado === 'ENTREGADO' && (
            <>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Entregado el</div>
                <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Calendar size={13} /> {formatearFecha(pedido.fechaEntrega || '')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Receptor</div>
                <div style={{ fontWeight: 500 }}>{pedido.receptor}</div>
              </div>
              {pedido.observaciones && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Observaciones</div>
                  <div style={{ fontSize: '0.875rem', marginTop: '0.25rem', padding: '0.5rem', backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)' }}>
                    {pedido.observaciones}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          {pedido.estado !== 'ENTREGADO' && pedido.estado !== 'CANCELADO' && (
            <Button variant="danger" onClick={handleCancelar} disabled={procesando}>
              Cancelar Pedido
            </Button>
          )}

          {pedido.estado === 'EN_ESPERA' && (
            <Button variant="primary" onClick={handleTransito} disabled={procesando}>
              Pasar a Tránsito
            </Button>
          )}

          {pedido.estado === 'TRANSITO' && (
            <Button variant="primary" onClick={onAbrirEntrega} disabled={procesando}>
              Registrar Entrega
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
