import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardStats } from './components/DashboardStats';
import { TruckList } from './components/TruckList';
import { FlotaView } from './components/FlotaView';
import { ConductoresView } from './components/ConductoresView';
import { RutasViajesView } from './components/RutasViajesView';
import { MantenimientoView } from './components/MantenimientoView';
import { ConfiguracionView } from './components/ConfiguracionView';
import { AlertCircle, AlertTriangle, ShieldAlert, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      <main className="main-content">
        <TopBar />
        <div className="page-content">
          {activeTab === 'dashboard' && (
            <div>
              {/* Top Banner / Welcome */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h1 style={{ color: 'var(--text-primary)' }}>Panel General de Operaciones</h1>
                  <p className="text-muted">
                    Visión consolidada de flota, conductores, cargas y alertas de cumplimiento de normas
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => setActiveTab('rutas')} className="btn btn-primary">
                    + Nueva Asignación
                  </button>
                </div>
              </div>

              {/* KPI Cards */}
              <DashboardStats />

              {/* Grid: Fleet Overview + Active Special Alerts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
                <TruckList onViewAll={() => setActiveTab('flota')} />

                {/* Alerts / Special Cases Panel */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, fontSize: '1.125rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={18} color="var(--status-error)" />
                      Alertas Activas (Casos Especiales)
                    </h2>
                    <span className="badge badge-error">3 Alertas</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {/* Alert 1: Camion con RT vencida */}
                    <div
                      onClick={() => setActiveTab('mantenimiento')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--status-error-bg)',
                        borderLeft: '4px solid var(--status-error)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ShieldAlert size={14} color="var(--status-error)" />
                          Camión con RT Vencida (EFGH-34)
                        </strong>
                        <ArrowRight size={14} color="var(--text-tertiary)" />
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)' }}>
                        Revisión técnica venció el 01/06/2025. Camión bloqueado automáticamente (RN-05).
                      </p>
                    </div>

                    {/* Alert 2: Conductor con carnet vencido */}
                    <div
                      onClick={() => setActiveTab('conductores')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--status-error-bg)',
                        borderLeft: '4px solid var(--status-error)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <ShieldAlert size={14} color="var(--status-error)" />
                          Conductor con Licencia Vencida
                        </strong>
                        <ArrowRight size={14} color="var(--text-tertiary)" />
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)' }}>
                        Carlos Gómez tiene licencia A4 vencida desde 10/05/2023. Asignación bloqueada (RF-203).
                      </p>
                    </div>

                    {/* Alert 3: Carga con incompatibilidad */}
                    <div
                      onClick={() => setActiveTab('rutas')}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--status-warning-bg)',
                        borderLeft: '4px solid var(--status-warning)',
                        borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <AlertTriangle size={14} color="var(--status-warning)" />
                          Incompatibilidad Carga CRG-03
                        </strong>
                        <ArrowRight size={14} color="var(--text-tertiary)" />
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-warning)' }}>
                        Se intentó mezclar mercadería Peligrosa con Refrigerada/Alimentos violando RN-07.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'flota' && <FlotaView />}
          {activeTab === 'conductores' && <ConductoresView />}
          {activeTab === 'rutas' && <RutasViajesView />}
          {activeTab === 'mantenimiento' && <MantenimientoView />}
          {activeTab === 'configuracion' && <ConfiguracionView />}
        </div>
      </main>
    </div>
  );
};

export default App;
