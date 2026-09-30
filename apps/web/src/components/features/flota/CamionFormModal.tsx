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

interface CamionFormState {
  patente: string;
  marca: string;
  modelo: string;
  anio: string;
  idTipoCamion: number;
  pesoMaxKg: string;
  volumenMaxM3: string;
  rendimientoBaseKmL: string;
  kilometrajeActual: string;
}

function valoresIniciales(camion: Camion | undefined, tipos: TipoCamion[]): CamionFormState {
  if (camion) {
    return {
      patente: camion.patente,
      marca: camion.marca,
      modelo: camion.modelo,
      anio: String(camion.anio),
      idTipoCamion: camion.idTipoCamion,
      pesoMaxKg: String(camion.pesoMaxKg),
      volumenMaxM3: String(camion.volumenMaxM3),
      rendimientoBaseKmL: String(camion.rendimientoBaseKmL),
      kilometrajeActual: String(camion.kilometrajeActual),
    };
  }
  return {
    patente: '',
    marca: '',
    modelo: '',
    anio: '',
    idTipoCamion: tipos[0]?.id ?? 0,
    pesoMaxKg: '',
    volumenMaxM3: '',
    rendimientoBaseKmL: '',
    kilometrajeActual: '',
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
  const [form, setForm] = useState<CamionFormState>(() => valoresIniciales(camion, tipos));
  const [documentos, setDocumentos] = useState<DocumentoInput[]>(documentosVacios);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const set = <K extends keyof CamionFormState>(campo: K, valor: CamionFormState[K]) => {
    setErrorLocal(null);
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const setDocumento = (index: number, campo: 'fechaEmision' | 'fechaVencimiento', valor: string) =>
    setDocumentos((prev) => prev.map((d, i) => (i === index ? { ...d, [campo]: valor } : d)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const anio = Number(form.anio);
    const peso = Number(form.pesoMaxKg);
    const vol = Number(form.volumenMaxM3);
    const rend = Number(form.rendimientoBaseKmL);
    const km = Number(form.kilometrajeActual);

    const anioMax = new Date().getFullYear() + 1;
    if (form.anio.trim() === '' || isNaN(anio) || anio < 1990 || anio > anioMax) {
      setErrorLocal(`El año de fabricación debe ser un número entre 1990 y ${anioMax}`);
      return;
    }
    if (form.pesoMaxKg.trim() === '' || isNaN(peso) || peso <= 0) {
      setErrorLocal('La capacidad máxima (kg) debe ser mayor a 0');
      return;
    }
    if (form.volumenMaxM3.trim() === '' || isNaN(vol) || vol <= 0) {
      setErrorLocal('La capacidad de volumen (m³) debe ser mayor a 0');
      return;
    }
    if (form.rendimientoBaseKmL.trim() === '' || isNaN(rend) || rend <= 0) {
      setErrorLocal('El rendimiento base (km/L) debe ser mayor a 0');
      return;
    }
    if (form.kilometrajeActual.trim() === '' || isNaN(km) || km < 0) {
      setErrorLocal('El kilometraje actual no puede ser negativo');
      return;
    }

    const payload: CamionInput = {
      patente: form.patente.trim().toUpperCase(),
      marca: form.marca.trim(),
      modelo: form.modelo.trim(),
      anio,
      idTipoCamion: form.idTipoCamion,
      pesoMaxKg: peso,
      volumenMaxM3: vol,
      rendimientoBaseKmL: rend,
      kilometrajeActual: Math.round(km),
    };

    onSubmit(esRegistro ? { ...payload, documentos } : payload);
  };

  return (
    <Modal
      title={esRegistro ? 'Registrar nuevo camión' : `Editar camión ${camion.patente}`}
      icon={<Truck color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth={esRegistro ? '640px' : '560px'}
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
            }}
          >
            {errorLocal}
          </div>
        )}

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
            placeholder={String(new Date().getFullYear())}
            value={form.anio}
            onChange={(e) => set('anio', e.target.value)}
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
            step="any"
            required
            placeholder="Ej. 25000"
            value={form.pesoMaxKg}
            onChange={(e) => set('pesoMaxKg', e.target.value)}
          />
        </Field>
        <Field label="Capacidad de volumen (m³) *">
          <input
            className="form-control"
            type="number"
            step="any"
            required
            placeholder="Ej. 90"
            value={form.volumenMaxM3}
            onChange={(e) => set('volumenMaxM3', e.target.value)}
          />
        </Field>

        <Field label="Rendimiento base (km/L) *">
          <input
            className="form-control"
            type="number"
            step="any"
            required
            placeholder="Ej. 2.8"
            value={form.rendimientoBaseKmL}
            onChange={(e) => set('rendimientoBaseKmL', e.target.value)}
          />
        </Field>
        <Field label="Kilometraje actual (km) *">
          <input
            className="form-control"
            type="number"
            step="1"
            min="0"
            required
            placeholder="Ej. 0"
            value={form.kilometrajeActual}
            onChange={(e) => set('kilometrajeActual', e.target.value)}
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
