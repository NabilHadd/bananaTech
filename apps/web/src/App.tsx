import React from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { DashboardStats } from './components/DashboardStats';
import { TruckList } from './components/TruckList';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <TopBar />
        <div className="page-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h1 style={{ color: 'var(--text-primary)' }}>Panel General</h1>
              <p className="text-muted">Resumen de operaciones y estado de la flota</p>
            </div>
            <button className="btn btn-primary">
              + Nueva Asignación
            </button>
          </div>
          
          <DashboardStats />
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <TruckList />
            
            {/* Quick alerts or upcoming trips could go here */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h2>Alertas</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--status-error-bg)', borderLeft: '4px solid var(--status-error)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Revisión Técnica próxima a vencer (T-03)</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--status-error)', marginTop: '0.25rem' }}>Vence en 2 días</p>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--status-warning-bg)', borderLeft: '4px solid var(--status-warning)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Viaje V-104 retrasado</p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--status-warning)', marginTop: '0.25rem' }}>Demora estimada: 45 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
