import React, { useState } from 'react';
import { CAMIONES } from '../data/mockData';
import type { Camion } from '../data/mockData';
import { Truck, Search, AlertCircle, CheckCircle2, ShieldAlert, Weight } from 'lucide-react';

export const FlotaView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterState, setFilterState] = useState<string>('todos');

  const filteredCamiones = CAMIONES.filter((camion) => {
    const matchesSearch =
      camion.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.tipo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'todos' || camion.tipo === filterType;
    const matchesState = filterState === 'todos' || camion.estado === filterState;

    return matchesSearch && matchesType && matchesState;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck color="var(--accent-primary)" /> Gestión de Flota
          </h1>
          <p className="text-muted">
            Monitoreo técnico, capacidades y habilitación legal de camiones (datos de demostración)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">+ Registrar Camión</button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '260px' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por patente o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Tipo:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todos los tipos</option>
              <option value="Rampla plana">Rampla plana</option>
              <option value="Semirremolque">Semirremolque</option>
              <option value="3/4">3/4</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Estado:</span>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código / Patente</th>
                <th>Tipo de Camión</th>
                <th>Capacidad Carga</th>
                <th>Rendimiento & Km</th>
                <th>Documentación Legal</th>
                <th>Estado Operativo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCamiones.map((camion: Camion) => (
                <tr key={camion.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: camion.estado === 'Bloqueado' ? 'var(--status-error-bg)' : 'var(--accent-glow)',
                        color: camion.estado === 'Bloqueado' ? 'var(--status-error)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        {camion.codigo.split('-')[1]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                          {camion.patente}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {camion.codigo}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8125rem'
                    }}>
                      {camion.tipo}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Weight size={14} color="var(--text-secondary)" />
                        {camion.pesoMaxKg.toLocaleString('es-CL')} kg
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Volumen: {camion.volumenMaxM3} m³
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>{camion.rendimientoKmLEstimado} km/L</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {camion.kilometraje.toLocaleString('es-CL')} km
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {camion.documentos.map((doc) => (
                        <span
                          key={doc.id}
                          title={`${doc.nombre} - Vence: ${doc.fechaVencimiento}`}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor: doc.vencido ? 'var(--status-error-bg)' : 'rgba(255,255,255,0.05)',
                            color: doc.vencido ? 'var(--status-error)' : 'var(--text-secondary)',
                            border: doc.vencido ? '1px solid var(--status-error)' : '1px solid var(--border-color)'
                          }}
                        >
                          {doc.tipo} {doc.vencido ? '⚠ Vencido' : '✓'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {camion.estado === 'Disponible' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : (
                      <div>
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <ShieldAlert size={12} /> Bloqueado
                        </span>
                        {camion.motivoBloqueo && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)', maxWidth: '200px', lineHeight: 1.2 }}>
                            {camion.motivoBloqueo}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Rule Banner */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--status-warning-bg)',
        borderLeft: '4px solid var(--status-warning)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        <AlertCircle size={20} color="var(--status-warning)" />
        <div>
          <strong>Regla de negocio RN-05 / RF-103:</strong> El sistema bloquea de forma automática la asignación a viajes de cualquier camión que posea al menos un documento legal vencido (como el camión <code>EFGH-34</code> con su Revisión Técnica expirada).
        </div>
      </div>
    </div>
  );
};
