import React, { useState } from 'react';
import { Building2, MapPin, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { AgregarCentroModal } from './AgregarCentroModal';
import type { CentroItem } from './AgregarCentroModal';
import type { Cliente, ClienteInput } from './types';

interface ClienteFormModalProps {
  /** Cliente a editar; si se omite, el formulario registra uno nuevo. */
  cliente?: Cliente;
  onSubmit: (input: ClienteInput) => void;
  onClose: () => void;
}

interface ClienteFormState {
  razon: string;
  rut: string;
  direccion: string;
  mail: string;
  telefono: string;
}

function valoresIniciales(cliente: Cliente | undefined): ClienteFormState {
  return {
    razon: cliente?.razon ?? '',
    rut: cliente?.rut ?? '',
    direccion: cliente?.direccion ?? '',
    mail: cliente?.mail ?? '',
    telefono: cliente?.telefono ?? '',
  };
}

/**
 * Formulario de registro / edición de clientes (HU3.1).
 *
 * Permite registrar razón social, RUT, dirección matriz/contacto, y asociar
 * múltiples centros de distribución (relación N:N).
 */
export const ClienteFormModal: React.FC<ClienteFormModalProps> = ({
  cliente,
  onSubmit,
  onClose,
}) => {
  const esRegistro = cliente === undefined;
  const [form, setForm] = useState<ClienteFormState>(() => valoresIniciales(cliente));
  const [centros, setCentros] = useState<CentroItem[]>(() =>
    cliente?.centros
      ? cliente.centros.map((c) => ({
        id: c.id,
        direccion: c.direccion,
        distanciaKm: c.distanciaKm,
        distanciaMin: c.distanciaMin,
      }))
      : []
  );
  const [modalCentroAbierto, setModalCentroAbierto] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  const set = <K extends keyof ClienteFormState>(campo: K, valor: ClienteFormState[K]) => {
    setErrorLocal(null);
    setForm((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleAgregarCentro = (nuevoCentro: CentroItem) => {
    setErrorLocal(null);
    setCentros((prev) => [...prev, nuevoCentro]);
  };

  const handleQuitarCentro = (index: number) => {
    setCentros((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const razonLimpia = form.razon.trim();
    if (!razonLimpia) {
      setErrorLocal('La razón social es obligatoria');
      return;
    }

    const rutLimpio = form.rut.trim();
    if (!rutLimpio) {
      setErrorLocal('El RUT es obligatorio');
      return;
    }

    if (centros.length === 0) {
      setErrorLocal('Debe asociar al menos un centro de distribución o destino de entrega para el cliente');
      return;
    }

    const centrosIds = centros
      .filter((c) => c.id !== undefined)
      .map((c) => c.id as number);

    const centrosNuevos = centros
      .filter((c) => c.id === undefined)
      .map((c) => ({
        direccion: c.direccion,
        distanciaKm: c.distanciaKm,
        distanciaMin: c.distanciaMin,
      }));

    onSubmit({
      razon: razonLimpia,
      rut: rutLimpio,
      direccion: form.direccion.trim() || null,
      mail: form.mail.trim() || null,
      telefono: form.telefono.trim() || null,
      centrosIds: centrosIds.length > 0 ? centrosIds : null,
      centrosNuevos: centrosNuevos.length > 0 ? centrosNuevos : null,
    });
  };

  return (
    <>
      <Modal
        title={esRegistro ? 'Registrar nuevo cliente' : `Editar cliente ${cliente.razon}`}
        subtitle="Datos de la empresa y asociación de centros de distribución"
        icon={<Building2 color="var(--accent-primary)" size={22} />}
        onClose={onClose}
        maxWidth="680px"
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

          <div className="form-span-2">
            <Field label="Razón Social *">
              <input
                className="form-control"
                required
                placeholder="Ej. Distribuidora del Norte S.A."
                value={form.razon}
                onChange={(e) => set('razon', e.target.value)}
              />
            </Field>
          </div>

          <Field label="RUT de la Empresa *">
            <input
              className="form-control"
              required
              placeholder="Ej. 76.123.456-7"
              value={form.rut}
              onChange={(e) => set('rut', e.target.value.toUpperCase())}
            />
          </Field>

          <Field label="Teléfono de Contacto">
            <input
              className="form-control"
              placeholder="+56 9 1234 5678"
              value={form.telefono}
              onChange={(e) => set('telefono', e.target.value)}
            />
          </Field>

          <Field label="Correo Electrónico">
            <input
              className="form-control"
              type="email"
              placeholder="contacto@empresa.cl"
              value={form.mail}
              onChange={(e) => set('mail', e.target.value)}
            />
          </Field>

          <Field label="Dirección Casa Matriz (opcional)">
            <input
              className="form-control"
              placeholder="Ej. Panamericana Norte Km 460, Coquimbo"
              value={form.direccion}
              onChange={(e) => set('direccion', e.target.value)}
            />
          </Field>

          {/* Sección N:N Centros de Distribución */}
          <fieldset className="form-section form-span-2">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.85rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <legend
                  className="form-section-title"
                  style={{ marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <MapPin size={16} color="var(--accent-primary)" /> Centros de Distribución / Destinos de Entrega *
                </legend>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Puede asociar centros existentes o registrar nuevos para este cliente.
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={() => setModalCentroAbierto(true)}
              >
                Agregar Centro
              </Button>
            </div>

            {centros.length === 0 ? (
              <div
                style={{
                  padding: '1.5rem',
                  border: '1px dashed var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  No hay centros de distribución asociados aún.
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<Plus size={14} />}
                  onClick={() => setModalCentroAbierto(true)}
                >
                  Asociar o crear primer centro
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {centros.map((c, index) => (
                  <div
                    key={`${c.id ?? 'nuevo'}-${index}`}
                    style={{
                      padding: '0.65rem 0.85rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                      <MapPin size={15} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.direccion}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {c.distanciaKm} km · {c.distanciaMin} min de viaje
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                      {c.id === undefined && (
                        <span
                          className="doc-chip"
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: 'var(--status-success)',
                            borderColor: 'rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          Nuevo
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleQuitarCentro(index)}
                        title="Quitar centro de este cliente"
                        className="btn-icon"
                        style={{
                          color: 'var(--status-error)',
                          padding: '0.35rem',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>

          <div className="form-actions form-span-2">
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary">
              {esRegistro ? 'Registrar cliente' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sub-modal para asociar centro existente o crear uno nuevo */}
      {modalCentroAbierto && (
        <AgregarCentroModal
          centrosActuales={centros}
          onAgregar={handleAgregarCentro}
          onClose={() => setModalCentroAbierto(false)}
        />
      )}
    </>
  );
};

