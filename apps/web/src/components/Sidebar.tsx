import React from 'react';
import { LayoutDashboard, Truck, Users, Map, Wrench, Settings } from 'lucide-react';

export const Sidebar: React.FC = () => {
  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', active: true },
    { icon: <Truck size={20} />, label: 'Flota' },
    { icon: <Users size={20} />, label: 'Conductores' },
    { icon: <Map size={20} />, label: 'Rutas & Viajes' },
    { icon: <Wrench size={20} />, label: 'Mantenimiento' },
  ];

  return (
    <aside style={{
      width: '260px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0'
    }}>
      <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Truck color="var(--accent-primary)" /> TNC Logística
        </h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Transportes Norte Chico SpA</span>
      </div>

      <nav style={{ flex: 1 }}>
        <ul style={{ listStyle: 'none', padding: '0 1rem' }}>
          {menuItems.map((item, idx) => (
            <li key={idx} style={{ marginBottom: '0.25rem' }}>
              <a href="#" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                color: item.active ? 'white' : 'var(--text-secondary)',
                backgroundColor: item.active ? 'var(--accent-glow)' : 'transparent',
                textDecoration: 'none',
                fontWeight: item.active ? 500 : 400,
                transition: 'var(--transition)'
              }}>
                {React.cloneElement(item.icon, { color: item.active ? 'var(--accent-primary)' : 'currentColor' })}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div style={{ padding: '0 1.5rem', marginTop: 'auto' }}>
        <a href="#" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          fontSize: '0.875rem'
        }}>
          <Settings size={18} />
          Configuración
        </a>
      </div>
    </aside>
  );
};
