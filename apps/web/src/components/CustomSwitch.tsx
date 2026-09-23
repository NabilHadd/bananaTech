import React from 'react';

interface CustomSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}

export const CustomSwitch: React.FC<CustomSwitchProps> = ({ checked, onChange, label }) => {
  return (
    <label style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.6rem',
      cursor: 'pointer',
      userSelect: 'none',
      fontSize: '0.8125rem',
      color: checked ? 'var(--text-primary)' : 'var(--text-secondary)'
    }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: '36px',
          height: '20px',
          borderRadius: '12px',
          backgroundColor: checked ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          transition: 'background-color 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)'
        }}
      >
        <div style={{
          width: '14px',
          height: '14px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          position: 'absolute',
          top: '2px',
          left: '2px',
          transform: checked ? 'translateX(16px)' : 'translateX(0px)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
        }} />
      </div>
      {label && <span>{label}</span>}
    </label>
  );
};
