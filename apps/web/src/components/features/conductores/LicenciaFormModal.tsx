import React, { useState } from 'react';
import { Check, CreditCard } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { ClasesLicenciaField } from './ClasesLicenciaField';
import type { ClaseLicencia, Conductor, LicenciaInput } from './types';

interface LicenciaFormModalProps {
  conductor: Conductor;
  clases: ClaseLicencia[];
  onSubmit: (input: LicenciaInput) => void;
  onClose: () => void;
}

/**
 * Renovación de la licencia del conductor (HU2.2).
 *
 * Registra una licencia nueva: la anterior queda en el historial. La vigencia y
 * el estado del conductor los recalcula el backend al guardar.
 */
export const LicenciaFormModal: React.FC<LicenciaFormModalProps> = ({ conductor, clases, onSubmit, onClose }) => {
  // Parte de las clases de la licencia actual: lo usual es renovar las mismas.
  const [form, setForm] = useState<LicenciaInput>({
    clases: conductor.licencias[0]?.clases ?? [],
    fechaEmision: '',
    fechaVencimiento: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      title={conductor.licencias.length ? 'Renovar licencia' : 'Registrar licencia'}
      subtitle={`${conductor.nombres} ${conductor.apellidos} · RUT ${conductor.rut}`}
      icon={<CreditCard color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="620px"
    >
      <div className="callout callout-info" style={{ marginBottom: '1.25rem' }}>
        Un conductor sólo puede asignarse con su <strong>licencia vigente</strong> y a camiones cuyo tipo habilite
        alguna de sus clases. La nueva licencia reemplaza a la actual, que queda en el historial.
      </div>

      <form onSubmit={handleSubmit} className="form-grid">
        <Field label="Fecha de emisión *">
          <input
            className="form-control"
            type="date"
            required
            value={form.fechaEmision}
            onChange={(e) => setForm({ ...form, fechaEmision: e.target.value })}
          />
        </Field>
        <Field label="Fecha de vencimiento *">
          <input
            className="form-control"
            type="date"
            required
            value={form.fechaVencimiento}
            onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value })}
          />
        </Field>

        <div className="form-span-2">
          <span className="form-label">Clases *</span>
          <ClasesLicenciaField catalogo={clases} value={form.clases} onChange={(c) => setForm({ ...form, clases: c })} />
        </div>

        <div className="form-actions form-span-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" icon={<Check size={16} />}>
            Guardar licencia
          </Button>
        </div>
      </form>
    </Modal>
  );
};
