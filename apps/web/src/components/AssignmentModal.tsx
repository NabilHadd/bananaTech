import React, { useState } from 'react';
import { CARGAS, CONDUCTORES, useCamionesState, validarDocumentosCamion, registrarNuevoViaje } from '../data/mockData';
import { Navigation, X, AlertTriangle, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface AssignmentModalProps {
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({ onClose, onSuccess }) => {
  const [camiones] = useCamionesState();
  const [selectedCargaId, setSelectedCargaId] = useState<number>(CARGAS[0]?.id || 1);
  const [selectedCamionId, setSelectedCamionId] = useState<number>(camiones[0]?.id || 1);
  const [selectedConductorId, setSelectedConductorId] = useState<number>(CONDUCTORES[0]?.id || 1);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  const selectedCarga = CARGAS.find((c) => c.id === selectedCargaId);
  const selectedCamion = camiones.find((c) => c.id === selectedCamionId);
  const selectedConductor = CONDUCTORES.find((c) => c.id === selectedConductorId);

  // Validate truck documents under HU 1.2
  const docValidation = selectedCamion ? validarDocumentosCamion(selectedCamion) : { habilitado: true, motivo: undefined };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCamion) return;

    // HU 1.2 Acceptance Criterion enforcement:
    if (!docValidation.habilitado) {
      setAssignmentError(
        `Asignación rechazada: El camión ${selectedCamion.patente} tiene documentación legal vencida (${docValidation.motivo}). El sistema lo excluye de la asignación.`
      );
      return;
    }

    if (!selectedCamion.activo) {
      setAssignmentError(`El camión ${selectedCamion.patente} está dado de baja (inactivo) y no puede operar.`);
      return;
    }

    // Registrar en el historial de viajes (HU 1.3)
    const tripCode = `VIAJE-2026-0${Math.floor(100 + Math.random() * 900)}`;
    registrarNuevoViaje({
      codigoViaje: tripCode,
      camionId: selectedCamion.id,
      camionPatente: selectedCamion.patente,
      conductorId: selectedConductor?.id || 1,
      conductorNombre: `${selectedConductor?.nombres || 'Conductor'} ${selectedConductor?.apellidos || ''}`.trim(),
      origen: 'Coquimbo (Base Principal)',
      destino: selectedCarga?.centroDestino || 'Santiago (Pudahuel)',
      distanciaKm: selectedCarga?.centroDestino?.includes('Antofagasta') ? 890.0 : 460.5,
      cargaCodigo: selectedCarga?.codigo || 'CRG-XX',
      pesoKg: selectedCarga?.pesoTotalKg || 10000,
      volumenM3: selectedCarga?.volumenTotalM3,
      fechaSalida: new Date().toISOString().replace('T', ' ').slice(0, 16),
      fechaLlegada: 'En progreso',
      estado: 'EN_RUTA',
      consumoRealLitros: undefined
    });

    onSuccess(
      `¡Asignación completada! Carga ${selectedCarga?.codigo} asignada a camión ${selectedCamion.patente} con conductor ${selectedConductor?.nombres} ${selectedConductor?.apellidos}. Registrado en historial (${tripCode}).`
    );
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="glass-panel modal-window" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '600px',
        padding: '2rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Navigation color="var(--accent-primary)" size={22} />
              Nueva Asignación de Viaje (Motor de Reglas)
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              Validación automática de documentos vigentes y restricciones duras (RN-05)
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. Selección de Carga */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              1. Seleccionar Carga a Transportar *
            </label>
            <select
              value={selectedCargaId}
              onChange={(e) => {
                setSelectedCargaId(Number(e.target.value));
                setAssignmentError(null);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              {CARGAS.map((carga) => (
                <option key={carga.id} value={carga.id}>
                  {carga.codigo} — {carga.centroDestino} ({carga.pesoTotalKg.toLocaleString('es-CL')} kg / {carga.volumenTotalM3} m³)
                </option>
              ))}
            </select>
          </div>

          {/* 2. Selección de Camión (HU 1.2) */}
          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              <span>2. Seleccionar Camión de Flota*</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)' }}>Regla RN-05</span>
            </label>
            <select
              value={selectedCamionId}
              onChange={(e) => {
                setSelectedCamionId(Number(e.target.value));
                setAssignmentError(null);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-primary)',
                border: `1px solid ${!docValidation.habilitado ? 'var(--status-error)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              {camiones.map((camion) => {
                const val = validarDocumentosCamion(camion);
                return (
                  <option key={camion.id} value={camion.id}>
                    {camion.patente} ({camion.marca} {camion.modelo} - {camion.tipo}){' '}
                    {!val.habilitado
                      ? '❌ [EXCLUIDO: RT/Doc Vencido]'
                      : !camion.activo
                        ? '⚪ [INACTIVO: Dado de Baja]'
                        : '✓ [HABILITADO: Documentos al día]'}
                  </option>
                );
              })}
            </select>

            {/* Document Status Feedback Box for Selected Truck */}
            {selectedCamion && (
              <div style={{ marginTop: '0.5rem' }}>
                {!docValidation.habilitado ? (
                  <div style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--status-error-bg)',
                    borderLeft: '4px solid var(--status-error)',
                    color: 'var(--status-error)',
                    fontSize: '0.8125rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem'
                  }}>
                    <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <div>
                      <strong>Exclusión Automática:</strong>
                      <div style={{ marginTop: '0.2rem' }}>{docValidation.motivo}</div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', opacity: 0.9 }}>
                        El sistema prohíbe la asignación de este camión hasta que el planificador renueve el documento en el módulo de Flota o Mantenimiento.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--status-success-bg)',
                    color: 'var(--status-success)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <ShieldCheck size={16} />
                    <span>Camión habilitado legalmente: Revisión Técnica, SOAP y Permiso de Circulación al día.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. Selección de Conductor */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              3. Seleccionar Conductor *
            </label>
            <select
              value={selectedConductorId}
              onChange={(e) => {
                setSelectedConductorId(Number(e.target.value));
                setAssignmentError(null);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            >
              {CONDUCTORES.map((conductor) => (
                <option key={conductor.id} value={conductor.id}>
                  {conductor.nombres} {conductor.apellidos} (RUT: {conductor.rut}, Clase {conductor.claseLicencia}){' '}
                  {conductor.licenciaVencida ? '❌ [Licencia Vencida]' : '✓ [Vigente]'}
                </option>
              ))}
            </select>
          </div>

          {/* Rejection Alert if attempted */}
          {assignmentError && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--status-error-bg)',
              border: '1px solid var(--status-error)',
              color: 'var(--status-error)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertTriangle size={16} />
              <span>{assignmentError}</span>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!docValidation.habilitado}
              className="btn btn-primary"
              style={{
                backgroundColor: !docValidation.habilitado ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                cursor: !docValidation.habilitado ? 'not-allowed' : 'pointer',
                opacity: !docValidation.habilitado ? 0.6 : 1
              }}
            >
              Confirmar Asignación
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
