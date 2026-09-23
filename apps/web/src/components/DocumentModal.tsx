import React, { useState } from 'react';
import type { Camion, DocumentoCamion } from '../data/mockData';
import { renovarDocumentoCamion } from '../data/mockData';
import { FileText, X, AlertTriangle, ShieldCheck, Check, Plus } from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface DocumentModalProps {
  camion: Camion;
  initialDocTipo?: 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC';
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const DocumentModal: React.FC<DocumentModalProps> = ({
  camion,
  initialDocTipo = 'RT',
  onClose,
  onSuccess
}) => {
  const [selectedTipo, setSelectedTipo] = useState<'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC'>(initialDocTipo);
  const [fechaEmision, setFechaEmision] = useState<string>('2026-01-01');
  const [fechaVencimiento, setFechaVencimiento] = useState<string>('2027-01-01');

  const handleSelectDocToRenew = (doc: DocumentoCamion) => {
    setSelectedTipo(doc.tipo);
    setFechaEmision(doc.fechaEmision);
    // Suggest a renewal date 1 year from now if expired
    setFechaVencimiento(doc.vencido ? '2027-06-01' : doc.fechaVencimiento);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const res = renovarDocumentoCamion(
      camion.id,
      selectedTipo,
      fechaEmision,
      fechaVencimiento
    );

    onSuccess(res.mensaje);
    onClose();
  };

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="glass-panel modal-window" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '640px',
        padding: '2rem',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText color="var(--accent-primary)" size={22} />
              Control de Documentos — {camion.patente}
            </h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              {camion.marca} {camion.modelo} ({camion.codigo}) • Estado actual: {camion.estado}
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

        {/* HU 1.2 Info Alert */}
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-primary)',
          borderLeft: '4px solid var(--accent-primary)',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          marginBottom: '1.5rem',
          lineHeight: 1.4
        }}>
          Todo camión debe tener su <strong>Revisión Técnica (RT)</strong>, <strong>Permiso de Circulación (PC)</strong> y <strong>SOAP</strong> vigentes. Si alguno está vencido, el sistema excluye automáticamente el camión de asignaciones a viajes.
        </div>

        {/* Existing Documents Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
            Documentos Registrados ({camion.documentos.length})
          </h3>
          <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Documento</th>
                  <th>Vencimiento</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {camion.documentos.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.tipo}</td>
                    <td>{doc.nombre}</td>
                    <td style={{ fontWeight: doc.vencido ? 700 : 400, color: doc.vencido ? 'var(--status-error)' : 'inherit' }}>
                      {doc.fechaVencimiento}
                    </td>
                    <td>
                      {doc.vencido ? (
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <AlertTriangle size={12} /> Vencido
                        </span>
                      ) : (
                        <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                          <ShieldCheck size={12} /> Vigente
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleSelectDocToRenew(doc)}
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {doc.vencido ? 'Renovar' : 'Editar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Renewal / Register Form */}
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} color="var(--accent-primary)" /> Registrar o Renovar Documento
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Tipo de Documento Legal *
              </label>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value as any)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.8rem',
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem'
                }}
              >
                <option value="RT">RT - Revisión Técnica (Obligatorio)</option>
                <option value="PC">PC - Permiso de Circulación (Obligatorio)</option>
                <option value="SOAP">SOAP - Seguro Obligatorio (Obligatorio)</option>
                <option value="PADRON">PADRON - Padrón del Vehículo</option>
                <option value="CEC">CEC - Certificado Emisión Contaminantes</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Fecha de Emisión *
                </label>
                <input
                  type="date"
                  required
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Fecha de Vencimiento *
                </label>
                <input
                  type="date"
                  required
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Check size={16} /> Guardar Documento
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
