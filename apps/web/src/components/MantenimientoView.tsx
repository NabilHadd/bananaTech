import React from 'react';
import { CAMIONES } from '../data/mockData';
import { Wrench, AlertTriangle, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';

export const MantenimientoView: React.FC = () => {
  // Extract all documents across trucks
  const allDocs = CAMIONES.flatMap((camion) =>
    camion.documentos.map((doc) => ({
      ...doc,
      camionPatente: camion.patente,
      camionCodigo: camion.codigo,
      camionTipo: camion.tipo
    }))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench color="var(--accent-primary)" /> Mantenimiento & Documentación
          </h1>
          <p className="text-muted">
            Auditoría de vencimientos legales (RT, SOAP, Permiso de Circulación) y control de mantenciones de la flota
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">+ Programar Mantención</button>
        </div>
      </div>

      {/* Critical Document Alerts Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{
          padding: '1.25rem',
          borderLeft: '4px solid var(--status-error)',
          backgroundColor: 'var(--status-error-bg)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <ShieldAlert size={28} color="var(--status-error)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              1 Documento Expirado (Alerta Crítica)
            </div>
            <p style={{ margin: '0.35rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Camión <strong>EFGH-34</strong> (Semirremolque) tiene su Revisión Técnica vencida desde <strong>01/06/2025</strong>. El camión se encuentra bloqueado para asignación.
            </p>
            <button className="btn btn-secondary" style={{ marginTop: '0.5rem', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
              Subir Renovación
            </button>
          </div>
        </div>

        <div className="glass-panel" style={{
          padding: '1.25rem',
          borderLeft: '4px solid var(--status-success)',
          backgroundColor: 'var(--status-success-bg)',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start'
        }}>
          <ShieldCheck size={28} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
              8 Documentos al Día
            </div>
            <p style={{ margin: '0.35rem 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Camiones <strong>ABCD-12</strong> y <strong>IJKL-56</strong> cumplen con todos los requisitos de circulación vigentes (RT, PC y SOAP válidos hasta 2027).
            </p>
          </div>
        </div>
      </div>

      {/* Document Status Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-primary)" /> Estado de Documentación Obligatoria (RF-103)
        </h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Camión</th>
                <th>Tipo de Documento</th>
                <th>Fecha Emisión</th>
                <th>Fecha Vencimiento</th>
                <th>Semáforo Legal</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {allDocs.map((doc, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.camionPatente}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{doc.camionTipo} ({doc.camionCodigo})</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{doc.nombre}</div>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)'
                    }}>
                      Código: {doc.tipo}
                    </span>
                  </td>
                  <td>{doc.fechaEmision}</td>
                  <td style={{ fontWeight: doc.vencido ? 700 : 400, color: doc.vencido ? 'var(--status-error)' : 'inherit' }}>
                    {doc.fechaVencimiento}
                  </td>
                  <td>
                    {doc.vencido ? (
                      <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <AlertTriangle size={12} /> Expirado
                      </span>
                    ) : (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                        <ShieldCheck size={12} /> Vigente
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                      Actualizar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Mantenciones / Órdenes de Trabajo (RF-104) */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={18} color="var(--accent-primary)" /> Registro de Mantenciones (RF-104)
        </h2>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>OT #</th>
                <th>Camión</th>
                <th>Tipo Mantención</th>
                <th>Detalle</th>
                <th>Fecha Ingreso</th>
                <th>Salida Estimada</th>
                <th>Costo Estimado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>OT-2026-041</td>
                <td>
                  <div style={{ fontWeight: 600 }}>EFGH-34</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Semirremolque</div>
                </td>
                <td>
                  <span className="badge badge-error">Correctiva</span>
                </td>
                <td>Puesta a punto para Revisión Técnica & cambio de pastillas de frenos</td>
                <td>2026-09-18</td>
                <td>2026-09-22</td>
                <td style={{ fontWeight: 500 }}>$450.000 CLP</td>
                <td>
                  <span className="badge badge-warning">En Taller</span>
                </td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>OT-2026-038</td>
                <td>
                  <div style={{ fontWeight: 600 }}>ABCD-12</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Rampla plana</div>
                </td>
                <td>
                  <span className="badge badge-neutral">Preventiva</span>
                </td>
                <td>Cambio de aceite y filtros (140.000 km)</td>
                <td>2026-08-15</td>
                <td>2026-08-16</td>
                <td style={{ fontWeight: 500 }}>$185.000 CLP</td>
                <td>
                  <span className="badge badge-success">Completada</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
