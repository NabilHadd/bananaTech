import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import type { LlegadaInput, Viaje } from './types';
import { codigoViaje, formatearFecha } from './viajes.constants';

interface FinalizarViajeModalProps {
  viaje: Viaje;
  /** Si la API rechaza la llegada, la página muestra el error y rechaza la promesa. */
  onSubmit: (input: LlegadaInput) => Promise<void>;
  /** Muestra un dato inválido del formulario con el toast del sistema. */
  onInvalido: (mensaje: string) => void;
  onClose: () => void;
}

/** `datetime-local` de ahora en la hora del navegador (`2026-10-01T18:30`). */
function ahoraLocal(): string {
  const ahora = new Date();
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset());
  return ahora.toISOString().slice(0, 16);
}

/** Registra la llegada de un viaje en ruta (HU5.2): hora real, receptor y observación. */
export const FinalizarViajeModal: React.FC<FinalizarViajeModalProps> = ({ viaje, onSubmit, onInvalido, onClose }) => {
  const [fechaLlegada, setFechaLlegada] = useState(ahoraLocal);
  const [receptor, setReceptor] = useState('');
  const [observacion, setObservacion] = useState('');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaLlegada) {
      onInvalido('Indique la fecha y hora de llegada.');
      return;
    }
    if (!receptor.trim()) {
      onInvalido('Indique quién recibió la carga.');
      return;
    }
    // La API valida además que la llegada sea posterior a la salida y no futura.
    setGuardando(true);
    try {
      await onSubmit({ fechaLlegada, receptor: receptor.trim(), observacion: observacion.trim() || null });
    } catch {
      // La página ya mostró el error de la API; el formulario queda abierto para corregirlo.
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={`Finalizar viaje ${codigoViaje(viaje.id)}`}
      subtitle={`Salió el ${formatearFecha(viaje.fechaInicio)} • llegada prevista ${formatearFecha(viaje.fechaFin)}`}
      icon={<CheckCircle2 color="var(--status-success)" size={22} />}
      onClose={onClose}
      maxWidth="560px"
      zIndex={100050}
      preventCloseOnBackdrop={guardando}
    >
      <form noValidate onSubmit={handleSubmit} className="form-grid">
        <div className="form-span-2 callout">
          Al finalizar, la carga queda Finalizada, sus pedidos Entregado y el camión {viaje.camion.patente} suma{' '}
          {viaje.carga.centro?.distanciaKm ?? 0} km a su kilometraje. El descanso del conductor corre desde la llegada.
        </div>

        <Field label="Llegada real *">
          <input
            type="datetime-local"
            className="form-control"
            value={fechaLlegada}
            max={ahoraLocal()}
            onChange={(e) => setFechaLlegada(e.target.value)}
            disabled={guardando}
          />
        </Field>

        <Field label="Recibido por *">
          <input
            className="form-control"
            placeholder="Nombre de quien recibe"
            value={receptor}
            onChange={(e) => setReceptor(e.target.value)}
            disabled={guardando}
          />
        </Field>

        <div className="form-span-2">
          <Field label="Observación">
            <textarea
              className="form-control"
              rows={3}
              placeholder="Estado de la carga, incidencias en la entrega... (opcional)"
              value={observacion}
              onChange={(e) => setObservacion(e.target.value)}
              disabled={guardando}
              style={{ resize: 'vertical' }}
            />
          </Field>
        </div>

        <div className="form-actions form-span-2">
          <Button onClick={onClose} disabled={guardando}>
            Volver
          </Button>
          <Button variant="primary" type="submit" icon={<CheckCircle2 size={16} />} disabled={guardando}>
            {guardando ? 'Finalizando...' : 'Finalizar viaje'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
