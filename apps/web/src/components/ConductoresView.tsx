import React, { useState } from 'react';
import { CONDUCTORES } from '../data/mockData';
import type { Conductor } from '../data/mockData';
import { Users, Search, AlertCircle, CheckCircle2, UserX, Phone, Mail, ShieldAlert } from 'lucide-react';

export const ConductoresView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('todos');
  const [filterState, setFilterState] = useState<string>('todos');

  const filteredConductores = CONDUCTORES.filter((conductor) => {
    const fullName = `${conductor.nombres} ${conductor.apellidos}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      conductor.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = filterClass === 'todos' || conductor.claseLicencia === filterClass;
    const matchesState = filterState === 'todos' || conductor.estado === filterState;

    return matchesSearch && matchesClass && matchesState;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="var(--accent-primary)" /> Gestión de Conductores
          </h1>
          <p className="text-muted">
            Control de personal, habilitación por clases de licencia (A1-A5, B) y vencimientos
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">+ Registrar Conductor</button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '260px' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por RUT o nombre..."
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
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Clase:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
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
              <option value="todos">Todas las clases</option>
              <option value="A5">Clase A5</option>
              <option value="A4">Clase A4</option>
              <option value="B">Clase B</option>
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
                <th>Conductor</th>
                <th>Contacto</th>
                <th>Licencia & Clase</th>
                <th>Vencimiento</th>
                <th>Vehículos Habilitados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredConductores.map((conductor: Conductor) => (
                <tr key={conductor.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: conductor.licenciaVencida ? 'var(--status-error-bg)' : 'var(--accent-glow)',
                        color: conductor.licenciaVencida ? 'var(--status-error)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        {conductor.nombres.charAt(0)}{conductor.apellidos.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {conductor.nombres} {conductor.apellidos}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          RUT: {conductor.rut}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {conductor.telefono}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                        <Mail size={12} /> {conductor.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      backgroundColor: conductor.claseLicencia === 'A5' ? 'rgba(59, 130, 246, 0.2)' : conductor.claseLicencia === 'A4' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                      color: conductor.claseLicencia === 'A5' ? 'var(--accent-secondary)' : conductor.claseLicencia === 'A4' ? 'var(--status-warning)' : 'var(--text-secondary)',
                      border: '1px solid currentColor'
                    }}>
                      Clase {conductor.claseLicencia}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {conductor.fechaVencimientoLicencia}
                    </div>
                    {conductor.licenciaVencida ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-error)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ShieldAlert size={12} /> ¡VENCIDA!
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>
                        Vigente
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '220px' }}>
                      {conductor.tiposHabilitados.map((tipo, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {tipo}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {conductor.estado === 'Disponible' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : (
                      <div>
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <UserX size={12} /> Bloqueado
                        </span>
                        {conductor.motivoBloqueo && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)', maxWidth: '200px', lineHeight: 1.2 }}>
                            {conductor.motivoBloqueo}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Ver Perfil
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
        backgroundColor: 'var(--status-error-bg)',
        borderLeft: '4px solid var(--status-error)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        <AlertCircle size={20} color="var(--status-error)" />
        <div>
          <strong>Regla de negocio RN-04 / RF-203:</strong> Se impide asignar a un viaje cualquier conductor cuya licencia de conducir esté vencida (caso de <code>Carlos Gómez</code>) o cuya clase no habilite el tipo de camión del viaje (ej: <code>Luis Silva</code> con Clase B no puede tomar Semirremolques).
        </div>
      </div>
    </div>
  );
};
