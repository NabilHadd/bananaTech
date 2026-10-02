import React, { useState } from 'react';
import { Package, MapPin, Calendar, Clock, Boxes, XCircle } from 'lucide-react';
import { ConfirmDialog } from '../../common/ConfirmDialog';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { EstadoPedidoBadge, MercaderiaBadge } from './PedidoBadges';
import type { Pedido } from './types';

interface PedidoDetalleModalProps {
  pedido: Pedido;
  onClose: () => void;
  onCancelar: (id: number) => Promise<void>;
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
  onCancelar,
}) => {
  const [procesando, setProcesando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const codigo = `#PED-${String(pedido.id).padStart(4, '0')}`;

  const handleCancelar = async () => {
    setConfirmando(false);
    setProcesando(true);
    try {
      await onCancelar(pedido.id);
      onClose();
    } catch {
      // La página ya mostró el error en el toast.
      setProcesando(false);
    }
  };

  return (
    <>
      <Modal
        title={`Pedido ${codigo}`}
        icon={<Package color="var(--accent-primary)" size={22} />}
        onClose={onClose}
        maxWidth="600px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Carga</div>
              <div style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Boxes size={14} color="var(--accent-primary)" />
                {pedido.idCargaActiva !== null
                  ? `En la carga #CAR-${String(pedido.idCargaActiva).padStart(4, '0')}`
                  : 'Sin carga asignada'}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                El pedido pasa a En tránsito y a Entregado con el viaje de su carga.
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
            {pedido.estado === 'CREADA' && (
              <Button
                variant="danger"
                icon={<XCircle size={16} />}
                onClick={() => setConfirmando(true)}
                disabled={procesando || pedido.idCargaActiva !== null}
                title={pedido.idCargaActiva !== null ? 'Quite el pedido de su carga antes de cancelarlo' : undefined}
              >
                Cancelar Pedido
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {confirmando && (
        <ConfirmDialog
          title={`Cancelar el pedido ${codigo}`}
          icon={<XCircle color="var(--status-error)" size={22} />}
          confirmLabel="Cancelar pedido"
          tone="danger"
          onCancel={() => setConfirmando(false)}
          onConfirm={handleCancelar}
        >
          El pedido queda Cancelado: ya no podrá agregarse a una carga. Esta acción no se puede deshacer.
        </ConfirmDialog>
      )}
    </>
  );
};
