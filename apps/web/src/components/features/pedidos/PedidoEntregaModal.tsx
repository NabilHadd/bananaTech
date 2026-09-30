import React, { useState } from 'react';
import { PackageCheck, AlertCircle } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import type { EntregaPedidoInput, Pedido } from './types';

interface PedidoEntregaModalProps {
  pedido: Pedido;
  onSubmit: (input: EntregaPedidoInput) => Promise<void>;
  onClose: () => void;
}

export const PedidoEntregaModal: React.FC<PedidoEntregaModalProps> = ({
  pedido,
  onSubmit,
  onClose,
}) => {
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const [form, setForm] = useState({
    fechaEntrega: '',
    receptor: '',
    observaciones: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    if (!form.fechaEntrega) {
      setErrorLocal('Debe indicar la fecha y hora de entrega.');
      return;
    }

    if (!form.receptor.trim()) {
      setErrorLocal('Debe indicar el nombre del receptor.');
      return;
    }

    setGuardando(true);
    try {
      await onSubmit({
        idPedido: pedido.id,
        fechaEntrega: form.fechaEntrega,
        receptor: form.receptor,
        observaciones: form.observaciones.trim() || null,
      });
    } catch (err) {
      setErrorLocal(err instanceof Error ? err.message : 'Error al registrar la entrega');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Registrar Entrega"
      subtitle={`Pedido #PED-${String(pedido.id).padStart(4, '0')}`}
      icon={<PackageCheck color="var(--status-success)" size={22} />}
      onClose={onClose}
      maxWidth="500px"
      preventCloseOnBackdrop={true}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        {errorLocal && (
          <div
            className="form-span-2"
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

        <div className="form-span-2">
          <Field label="Fecha y Hora de Entrega *">
            <input
              type="datetime-local"
              className="form-control"
              value={form.fechaEntrega}
              onChange={(e) => {
                setErrorLocal(null);
                setForm((prev) => ({ ...prev, fechaEntrega: e.target.value }));
              }}
              disabled={guardando}
              required
            />
          </Field>
        </div>

        <div className="form-span-2">
          <Field label="Receptor (Nombre / Cargo) *">
            <input
              type="text"
              className="form-control"
              placeholder="Ej. Juan Pérez - Encargado de Bodega"
              value={form.receptor}
              onChange={(e) => {
                setErrorLocal(null);
                setForm((prev) => ({ ...prev, receptor: e.target.value }));
              }}
              disabled={guardando}
              required
            />
          </Field>
        </div>

        <div className="form-span-2">
          <Field label="Observaciones">
            <textarea
              className="form-control"
              placeholder="Ej. Se entregó una caja con abolladuras menores..."
              style={{ minHeight: '80px', resize: 'vertical' }}
              value={form.observaciones}
              onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
              disabled={guardando}
            />
          </Field>
        </div>

        <div className="form-actions form-span-2">
          <Button variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Confirmar Entrega'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
