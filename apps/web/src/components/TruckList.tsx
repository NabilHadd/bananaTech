import React from 'react';
import { CAMIONES } from '../data/mockData';
import type { Camion } from '../data/mockData';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

interface TruckListProps {
  onViewAll?: () => void;
}

export const TruckList: React.FC<TruckListProps> = ({ onViewAll }) => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Estado Resumido de Flota</h2>
        {onViewAll && (
          <button onClick={onViewAll} className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}>
            Ver tabla completa
          </button>
        )}
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Patente</th>
              <th>Tipo</th>
              <th>Capacidad</th>
              <th>Documentos</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {CAMIONES.map((truck: Camion) => {

              return (
                <tr key={truck.id}>
                  <td style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                    {truck.patente}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 400 }}>
                      {truck.codigo}
                    </div>
                  </td>
                  <td className="text-muted">{truck.tipo}</td>
                  <td>
                    <div>{truck.pesoMaxKg.toLocaleString('es-CL')} kg</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{truck.volumenMaxM3} m³</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      {truck.documentos.map((doc) => (
                        <span
                          key={doc.id}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.35rem',
                            borderRadius: '3px',
                            backgroundColor: doc.vencido ? 'var(--status-error-bg)' : 'rgba(255,255,255,0.05)',
                            color: doc.vencido ? 'var(--status-error)' : 'var(--text-secondary)',
                            border: doc.vencido ? '1px solid var(--status-error)' : '1px solid var(--border-color)',
                            fontWeight: 600
                          }}
                        >
                          {doc.tipo} {doc.vencido ? '!' : '✓'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {truck.estado === 'Disponible' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : (
                      <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <ShieldAlert size={12} /> {truck.estado}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
