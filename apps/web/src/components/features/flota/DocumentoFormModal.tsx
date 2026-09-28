import React, { useState } from 'react';
import { Check, FileText } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { DOCUMENTO_LABEL, DOCUMENTO_TIPOS } from './flota.constants';
import type { Camion, DocumentoCamion, DocumentoInput, DocumentoTipo } from './types';

interface DocumentoFormModalProps {
  camion: Camion;
  /** Documento a renovar; si se omite, se registra uno nuevo. */
  documento?: DocumentoCamion;
  onSubmit: (input: DocumentoInput) => void;
  onClose: () => void;
}

/**
 * Registro o renovación de un documento del camión (HU1.2).
 *
 * La vigencia y el bloqueo del camión los recalcula el backend al guardar.
 */
export const DocumentoFormModal: React.FC<DocumentoFormModalProps> = ({
  camion,
  documento,
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState<DocumentoInput>({
    tipo: documento?.tipo ?? 'RT',
    fechaEmision: documento?.fechaEmision ?? '',
    fechaVencimiento: documento?.fechaVencimiento ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Modal
      title={documento ? `Renovar ${DOCUMENTO_LABEL[documento.tipo]}` : 'Registrar documento'}
      subtitle={`${camion.patente} · ${camion.marca} ${camion.modelo}`}
      icon={<FileText color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="520px"
    >

      <form onSubmit={handleSubmit} className="form-grid">
        <div className="form-span-2">
          <Field label="Tipo de documento *">
            <select
              className="form-control"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value as DocumentoTipo })}
            >
              {DOCUMENTO_TIPOS.map((tipo) => (
                <option key={tipo} value={tipo}>{tipo} — {DOCUMENTO_LABEL[tipo]}</option>
              ))}
            </select>
          </Field>
        </div>

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

        <div className="form-actions form-span-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary" icon={<Check size={16} />}>
            Guardar documento
          </Button>
        </div>
      </form>
    </Modal>
  );
};
