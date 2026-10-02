import React, { useEffect, useState } from 'react';
import { MapPin, Package } from 'lucide-react';
import { getClientes } from '../../../api/cliente.api';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import type { Cliente } from '../clientes/types';
import { MERCADERIA_OPCIONES } from './pedidos.constants';
import type { MercaderiaTipo, PedidoInput } from './types';

interface PedidoFormModalProps {
  /** Si la API rechaza el pedido, la página muestra el error y rechaza la promesa. */
  onSubmit: (input: PedidoInput) => Promise<void>;
  /** Muestra un dato inválido del formulario, con el mismo toast que el resto del sistema. */
  onInvalido: (mensaje: string) => void;
  onClose: () => void;
}

interface FormState {
  idCliente: number | '';
  idCentro: number | '';
  pesoKg: string;
  volumenM3: string;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: MercaderiaTipo;
}

export const PedidoFormModal: React.FC<PedidoFormModalProps> = ({
  onSubmit,
  onInvalido,
  onClose,
}) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState<FormState>({
    idCliente: '',
    idCentro: '',
    pesoKg: '',
    volumenM3: '',
    ventanaInicio: '',
    ventanaFin: '',
    tipoMercaderia: 'GENERAL',
  });

  // Cargar lista de clientes al abrir el modal
  useEffect(() => {
    const control = new AbortController();
    getClientes(undefined, control.signal)
      .then((data) => setClientes(data))
      .catch(() => undefined)
      .finally(() => setCargandoClientes(false));
    return () => control.abort();
  }, []);

  const clienteSeleccionado = clientes.find((c) => c.id === form.idCliente);
  const centrosDisponibles = clienteSeleccionado?.centros ?? [];

  const handleClienteChange = (nuevoIdCliente: number | '') => {
    setForm((prev) => ({
      ...prev,
      idCliente: nuevoIdCliente,
      idCentro: '', // Resetear centro al cambiar cliente
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.idCliente === '') {
      onInvalido('Debe seleccionar un cliente.');
      return;
    }

    if (form.idCentro === '') {
      onInvalido('Debe seleccionar el centro de distribución de destino.');
      return;
    }

    const peso = parseFloat(form.pesoKg);
    if (isNaN(peso) || peso <= 0) {
      onInvalido('El peso debe ser mayor a 0 kg.');
      return;
    }

    const volumen = parseFloat(form.volumenM3);
    if (isNaN(volumen) || volumen <= 0) {
      onInvalido('El volumen debe ser mayor a 0 m³.');
      return;
    }

    if (!form.ventanaInicio) {
      onInvalido('Debe indicar la fecha y hora de inicio de la ventana de entrega.');
      return;
    }

    if (!form.ventanaFin) {
      onInvalido('Debe indicar la fecha y hora de término de la ventana de entrega.');
      return;
    }

    const fechaInicio = new Date(form.ventanaInicio);
    const fechaFin = new Date(form.ventanaFin);

    // Criterio de aceptación HU3.2:
    // "Dado un pedido cuya ventana de entrega termina antes de comenzar, cuando intento guardarlo, entonces el sistema rechaza el registro."
    if (fechaFin <= fechaInicio) {
      onInvalido('La ventana de entrega termina antes de comenzar.');
      return;
    }

    setGuardando(true);
    try {
      await onSubmit({
        idCliente: form.idCliente,
        idCentro: form.idCentro,
        pesoKg: peso,
        volumenM3: volumen,
        ventanaInicio: form.ventanaInicio,
        ventanaFin: form.ventanaFin,
        tipoMercaderia: form.tipoMercaderia,
      });
    } catch {
      // La página ya mostró el error de la API; el formulario queda abierto para corregirlo.
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Nuevo Pedido"
      subtitle="Creación de pedido para planificación de transporte (HU3.2)"
      icon={<Package color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="680px"
    >
      {/* noValidate: sin las burbujas nativas del navegador; los errores van al toast. */}
      <form noValidate onSubmit={handleSubmit} className="form-grid">

        {/* Cliente titular */}
        <div className="form-span-2">
          <Field label="Cliente Titular *">
            <select
              className="form-control"
              value={form.idCliente}
              onChange={(e) => handleClienteChange(e.target.value ? Number(e.target.value) : '')}
              disabled={cargandoClientes || guardando}
              required
            >
              <option value="">
                {cargandoClientes ? 'Cargando clientes...' : 'Seleccione un cliente...'}
              </option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razon} (RUT: {c.rut})
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Origen (Fijo informativo) */}
        <Field label="Origen de la Carga">
          <div
            className="form-control"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              color: 'var(--text-secondary)',
              cursor: 'not-allowed',
            }}
          >
            <MapPin size={14} color="var(--accent-primary)" />
            <span>Base Central TNC (Coquimbo)</span>
          </div>
        </Field>

        {/* Destino (Centro de distribución del cliente) */}
        <Field label="Destino (Centro de Distribución) *">
          <select
            className="form-control"
            value={form.idCentro}
            onChange={(e) => {
              setForm((prev) => ({
                ...prev,
                idCentro: e.target.value ? Number(e.target.value) : '',
              }));
            }}
            disabled={form.idCliente === '' || centrosDisponibles.length === 0 || guardando}
            required
          >
            <option value="">
              {form.idCliente === ''
                ? 'Primero seleccione un cliente...'
                : centrosDisponibles.length === 0
                ? 'El cliente no tiene centros asociados'
                : 'Seleccione centro de destino...'}
            </option>
            {centrosDisponibles.map((centro) => (
              <option key={centro.id} value={centro.id}>
                {centro.direccion} ({centro.distanciaKm} km · {centro.distanciaMin} min)
              </option>
            ))}
          </select>
        </Field>

        {/* Tipo de Mercadería */}
        <div className="form-span-2">
          <Field label="Tipo de Carga *">
            <select
              className="form-control"
              value={form.tipoMercaderia}
              onChange={(e) => setForm((prev) => ({ ...prev, tipoMercaderia: e.target.value as MercaderiaTipo }))}
              disabled={guardando}
              required
            >
              {MERCADERIA_OPCIONES.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Peso (kg) */}
        <Field label="Peso (kg) *">
          <input
            type="number"
            className="form-control"
            placeholder="Ej: 1500"
            min="0.01"
            step="any"
            value={form.pesoKg}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, pesoKg: e.target.value }));
            }}
            disabled={guardando}
            required
          />
        </Field>

        {/* Volumen (m³) */}
        <Field label="Volumen (m³) *">
          <input
            type="number"
            className="form-control"
            placeholder="Ej: 8.5"
            min="0.01"
            step="any"
            value={form.volumenM3}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, volumenM3: e.target.value }));
            }}
            disabled={guardando}
            required
          />
        </Field>

        {/* Ventana Inicio */}
        <Field label="Ventana Entrega - Inicio *">
          <input
            type="datetime-local"
            className="form-control"
            value={form.ventanaInicio}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, ventanaInicio: e.target.value }));
            }}
            disabled={guardando}
            required
          />
        </Field>

        {/* Ventana Fin */}
        <Field label="Ventana Entrega - Término *">
          <input
            type="datetime-local"
            className="form-control"
            value={form.ventanaFin}
            onChange={(e) => {
              setForm((prev) => ({ ...prev, ventanaFin: e.target.value }));
            }}
            disabled={guardando}
            required
          />
        </Field>

        <div className="form-actions form-span-2">
          <Button variant="secondary" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={guardando || form.idCliente === '' || form.idCentro === ''}
          >
            {guardando ? 'Guardando pedido...' : 'Guardar pedido'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
