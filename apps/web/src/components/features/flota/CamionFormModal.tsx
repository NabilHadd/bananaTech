import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { DOCUMENTO_LABEL, DOCUMENTOS_OBLIGATORIOS } from './flota.constants';
import type { Camion, CamionInput, DocumentoInput, RegistroCamionInput, TipoCamion } from './types';

interface CamionFormModalProps {
  /** Camión a editar; si se omite, el formulario registra uno nuevo. */
  camion?: Camion;
  tipos: TipoCamion[];
  /** Al registrar recibe `RegistroCamionInput` (con documentos); al editar, `CamionInput`. */
  onSubmit: (input: CamionInput | RegistroCamionInput) => void;
  onClose: () => void;
}

const documentosVacios = (): DocumentoInput[] =>
  DOCUMENTOS_OBLIGATORIOS.map((tipo) => ({ tipo, fechaEmision: '', fechaVencimiento: '' }));

function valoresIniciales(camion: Camion | undefined, tipos: TipoCamion[]): CamionInput {
  if (camion) {
    return {
      patente: camion.patente,
      marca: camion.marca,
      modelo: camion.modelo,
      anio: camion.anio,
      idTipoCamion: camion.idTipoCamion,
      pesoMaxKg: camion.pesoMaxKg,
      volumenMaxM3: camion.volumenMaxM3,
      rendimientoBaseKmL: camion.rendimientoBaseKmL,
      kilometrajeActual: camion.kilometrajeActual,
    };
  }
  return {
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    idTipoCamion: tipos[0]?.id ?? 0,
    pesoMaxKg: 25000,
    volumenMaxM3: 90,
    rendimientoBaseKmL: 2.8,
    kilometrajeActual: 0,
  };
}

/**
 * Formulario de registro / edición de camión (HU1.1).
 *
 * Al registrar exige también los documentos obligatorios; al editar no, porque
 * los documentos se gestionan desde la ficha.
 *
 * Sólo recoge los datos: la unicidad de patente, los rangos válidos, las fechas
 * de los documentos y el estado inicial los valida y asigna el backend.
 */
export const CamionFormModal: React.FC<CamionFormModalProps> = ({ camion, tipos, onSubmit, onClose }) => {
  const esRegistro = camion === undefined;
  const [form, setForm] = useState<CamionInput>(() => valoresIniciales(camion, tipos));
  const [documentos, setDocumentos] = useState<DocumentoInput[]>(documentosVacios);

  const set = <K extends keyof CamionInput>(campo: K, valor: CamionInput[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }));

  const setDocumento = (index: number, campo: 'fechaEmision' | 'fechaVencimiento', valor: string) =>
    setDocumentos((prev) => prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(esRegistro ? { ...form, documentos } : form);
  };

  return (
    <Modal
      title={esRegistro ? 'Registrar nuevo camión' : `Editar camión ${camion.patente}`}
      icon={<Truck color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth={esRegistro ? '640px' : '560px'}
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <Field label="Patente *">
          <input
            className="form-control"
            required
            placeholder="ABCD-12"
            value={form.patente}
            onChange={(e) => set('patente', e.target.value.toUpperCase())}
          />
        </Field>
        <Field label="Año de fabricación *">
          <input
            className="form-control"
            type="number"
            required
            value={form.anio}
            onChange={(e) => set('anio', Number(e.target.value))}
          />
        </Field>

        <Field label="Marca *">
          <input
            className="form-control"
            required
            placeholder="Volvo, Scania, Mercedes-Benz..."
            value={form.marca}
            onChange={(e) => set('marca', e.target.value)}
          />
        </Field>
        <Field label="Modelo *">
          <input
            className="form-control"
            required
            placeholder="FH 500, R450, Atego 1018..."
            value={form.modelo}
            onChange={(e) => set('modelo', e.target.value)}
          />
        </Field>

        <div className="form-span-2">
          <Field label="Tipo de camión *">
            <select
              className="form-control"
              value={form.idTipoCamion}
              onChange={(e) => set('idTipoCamion', Number(e.target.value))}
            >
              {tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Capacidad máxima (kg) *">
          <input
            className="form-control"
            type="number"
            required
            value={form.pesoMaxKg}
            onChange={(e) => set('pesoMaxKg', Number(e.target.value))}
          />
        </Field>
        <Field label="Capacidad de volumen (m³) *">
          <input
            className="form-control"
            type="number"
            step="0.01"
            required
            value={form.volumenMaxM3}
            onChange={(e) => set('volumenMaxM3', Number(e.target.value))}
          />
        </Field>

        <Field label="Rendimiento base (km/L) *">
          <input
            className="form-control"
            type="number"
            step="0.1"
            required
            value={form.rendimientoBaseKmL}
            onChange={(e) => set('rendimientoBaseKmL', Number(e.target.value))}
          />
        </Field>
        <Field label="Kilometraje actual (km) *">
          <input
            className="form-control"
            type="number"
            required
            value={form.kilometrajeActual}
            onChange={(e) => set('kilometrajeActual', Number(e.target.value))}
          />
        </Field>

        {esRegistro && (
          <fieldset className="form-section form-span-2">
            <legend className="form-section-title">Documentos obligatorios *</legend>
            <div className="doc-grid">
              <span />
              <span className="form-label">Fecha de emisión</span>
              <span className="form-label">Fecha de vencimiento</span>
              {documentos.map((doc, i) => (
                <React.Fragment key={doc.tipo}>
                  <span className="doc-grid-name">
                    <strong>{doc.tipo}</strong>
                    <span>{DOCUMENTO_LABEL[doc.tipo]}</span>
                  </span>
                  <input
                    className="form-control"
                    type="date"
                    required
                    aria-label={`${DOCUMENTO_LABEL[doc.tipo]}: fecha de emisión`}
                    value={doc.fechaEmision}
                    onChange={(e) => setDocumento(i, 'fechaEmision', e.target.value)}
                  />
                  <input
                    className="form-control"
                    type="date"
                    required
                    aria-label={`${DOCUMENTO_LABEL[doc.tipo]}: fecha de vencimiento`}
                    value={doc.fechaVencimiento}
                    onChange={(e) => setDocumento(i, 'fechaVencimiento', e.target.value)}
                  />
                </React.Fragment>
              ))}
            </div>
          </fieldset>
        )}

        <div className="form-actions form-span-2">
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="primary">
            {esRegistro ? 'Registrar camión' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
