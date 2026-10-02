import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { ClasesLicenciaField } from './ClasesLicenciaField';
import type { ClaseLicencia, Conductor, ConductorInput, LicenciaInput, RegistroConductorInput } from './types';

interface ConductorFormModalProps {
  /** Conductor a editar; si se omite, el formulario registra uno nuevo. */
  conductor?: Conductor;
  clases: ClaseLicencia[];
  /** Al registrar recibe `RegistroConductorInput` (con licencia); al editar, `ConductorInput`. */
  onSubmit: (input: ConductorInput | RegistroConductorInput) => void;
  onClose: () => void;
}

const LICENCIA_VACIA: LicenciaInput = { clases: [], fechaEmision: '', fechaVencimiento: '' };

function valoresIniciales(conductor: Conductor | undefined): ConductorInput {
  return {
    rut: conductor?.rut ?? '',
    nombres: conductor?.nombres ?? '',
    apellidos: conductor?.apellidos ?? '',
    telefono: conductor?.telefono ?? '',
    email: conductor?.email ?? '',
  };
}

/**
 * Formulario de registro / edición de conductor (HU2.2).
 *
 * Al registrar pide también su licencia; al editar no, porque las licencias se
 * renuevan desde la ficha.
 *
 * Sólo recoge los datos: el RUT (formato, dígito verificador y unicidad), el
 * email y las clases los valida el backend.
 */
export const ConductorFormModal: React.FC<ConductorFormModalProps> = ({ conductor, clases, onSubmit, onClose }) => {
  const esRegistro = conductor === undefined;
  const [form, setForm] = useState<ConductorInput>(() => valoresIniciales(conductor));
  const [licencia, setLicencia] = useState<LicenciaInput>(LICENCIA_VACIA);

  const set = <K extends keyof ConductorInput>(campo: K, valor: ConductorInput[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(esRegistro ? { ...form, licencia } : form);
  };

  return (
    <Modal
      title={esRegistro ? 'Registrar nuevo conductor' : `Editar conductor ${conductor.nombres} ${conductor.apellidos}`}
      icon={<UserPlus color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth={esRegistro ? '680px' : '560px'}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <Field label="RUT *">
          <input
            className="form-control"
            required
            placeholder="12.345.678-5"
            value={form.rut}
            onChange={(e) => set('rut', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Teléfono *">
          <input
            className="form-control"
            required
            placeholder="+569 1234 5678"
            value={form.telefono}
            onChange={(e) => set('telefono', e.target.value)}
          />
        </Field>

        <Field label="Nombres *">
          <input className="form-control" required value={form.nombres} onChange={(e) => set('nombres', e.target.value)} />
        </Field>
        <Field label="Apellidos *">
          <input
            className="form-control"
            required
            value={form.apellidos}
            onChange={(e) => set('apellidos', e.target.value)}
          />
        </Field>

        <div className="form-span-2">
          <Field label="Email *">
            <input
              className="form-control"
              type="email"
              required
              placeholder="conductor@tnc.cl"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </Field>
        </div>

        {esRegistro && (
          <fieldset className="form-section form-span-2">
            <legend className="form-section-title">Licencia de conducir *</legend>
            <div className="form-grid">
              <Field label="Fecha de emisión">
                <input
                  className="form-control"
                  type="date"
                  required
                  value={licencia.fechaEmision}
                  onChange={(e) => setLicencia({ ...licencia, fechaEmision: e.target.value })}
                />
              </Field>
              <Field label="Fecha de vencimiento">
                <input
                  className="form-control"
                  type="date"
                  required
                  value={licencia.fechaVencimiento}
                  onChange={(e) => setLicencia({ ...licencia, fechaVencimiento: e.target.value })}
                />
              </Field>
              <div className="form-span-2">
                <span className="form-label">Clases</span>
                <ClasesLicenciaField
                  catalogo={clases}
                  value={licencia.clases}
                  onChange={(c) => setLicencia({ ...licencia, clases: c })}
                />
              </div>
            </div>
          </fieldset>
        )}

        <div className="form-actions form-span-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">
            {esRegistro ? 'Registrar conductor' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
