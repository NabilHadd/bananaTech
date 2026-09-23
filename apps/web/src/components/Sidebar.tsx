import React from 'react';
import { LayoutDashboard, Truck, Users, Map, Wrench, Settings, PanelLeftClose } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, isOpen, onToggle }) => {
  const menuItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'flota', icon: <Truck size={20} />, label: 'Flota', alertCount: 1 },
    { id: 'conductores', icon: <Users size={20} />, label: 'Conductores', alertCount: 1 },
    { id: 'rutas', icon: <Map size={20} />, label: 'Rutas & Viajes', alertCount: 1 },
    { id: 'mantenimiento', icon: <Wrench size={20} />, label: 'Mantenimiento', alertCount: 1 },
  ];

  return (
    <aside style={{
      width: isOpen ? '260px' : '0px',
      minWidth: isOpen ? '260px' : '0px',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: isOpen ? '1px solid var(--border-color)' : 'none',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1), min-width 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-right 0.2s ease',
      userSelect: 'none',
      position: 'relative',
      zIndex: 20
    }}>
      <div style={{
        width: '260px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        boxSizing: 'border-box'
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '0 1.25rem 0 1.5rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div
            onClick={() => onSelectTab('dashboard')}
            style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
          >
            <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-glow)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Truck color="var(--accent-primary)" size={18} />
              </div>
              TNC Logística
            </h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginLeft: '2.5rem', display: 'block', marginTop: '0.15rem', whiteSpace: 'nowrap' }}>
              Transportes Norte Chico
            </span>
          </div>


        </div>

        {/* Navigation Menu */}
        <nav style={{ flex: 1 }}>
          <ul style={{ listStyle: 'none', padding: '0 0.75rem' }}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <li key={item.id} style={{ marginBottom: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? 'white' : 'var(--text-secondary)',
                      backgroundColor: isActive ? 'var(--accent-glow)' : 'transparent',
                      border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                      cursor: 'pointer',
                      fontWeight: isActive ? 600 : 400,
                      fontSize: '0.875rem',
                      transition: 'var(--transition)',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {React.cloneElement(item.icon, {
                        color: isActive ? 'var(--accent-primary)' : 'currentColor',
                        size: 20
                      })}
                      <span>{item.label}</span>
                    </div>

                    {item.alertCount && item.alertCount > 0 ? (
                      <span style={{
                        fontSize: '0.7rem',
                        padding: '0.1rem 0.45rem',
                        borderRadius: '9999px',
                        backgroundColor: 'var(--status-error-bg)',
                        color: 'var(--status-error)',
                        fontWeight: 600,
                        border: '1px solid rgba(239, 68, 68, 0.3)'
                      }}>
                        {item.alertCount}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* System Settings at bottom */}
        <div style={{ padding: '0 0.75rem', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => onSelectTab('configuracion')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: activeTab === 'configuracion' ? 'white' : 'var(--text-secondary)',
              backgroundColor: activeTab === 'configuracion' ? 'var(--accent-glow)' : 'transparent',
              border: activeTab === 'configuracion' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'var(--transition)'
            }}
          >
            <Settings size={18} color={activeTab === 'configuracion' ? 'var(--accent-primary)' : 'currentColor'} />
            Configuración
          </button>
        </div>
      </div>
    </aside>
  );
};
