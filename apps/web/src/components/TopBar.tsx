import React from 'react';
import { Bell, Search, User } from 'lucide-react';

export const TopBar: React.FC = () => {
  return (
    <header style={{
      height: '70px',
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '300px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          backgroundColor: 'var(--bg-secondary)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          width: '100%'
        }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input 
            type="text" 
            placeholder="Buscar viajes, patentes..." 
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
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          position: 'relative'
        }}>
          <Bell size={20} />
          <span style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '8px',
            height: '8px',
            backgroundColor: 'var(--status-error)',
            borderRadius: '50%'
          }}></span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Planificador</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Coquimbo</div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)'
          }}>
            <User size={18} />
          </div>
        </div>
      </div>
    </header>
  );
};
