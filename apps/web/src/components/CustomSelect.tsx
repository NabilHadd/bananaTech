import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string | number;
  label: string;
  sublabel?: string;
  badge?: string;
}

interface CustomSelectProps {
  label?: string;
  value: string | number;
  options: SelectOption[];
  onChange: (value: any) => void;
  icon?: React.ReactNode;
  minWidth?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  options,
  onChange,
  icon,
  minWidth = '180px'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || options[0];
  const isFiltered = String(value) !== 'todos' && String(value) !== '0' && String(value) !== '';

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', minWidth, zIndex: isOpen ? 50 : 1 }}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem',
          padding: '0.45rem 0.75rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: isFiltered ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)',
          border: isFiltered ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid var(--border-color)',
          color: isFiltered ? 'var(--text-primary)' : 'var(--text-secondary)',
          fontSize: '0.8125rem',
          fontWeight: isFiltered ? 500 : 400,
          cursor: 'pointer',
          transition: 'all 0.18s ease',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(59, 130, 246, 0.25)' : '0 1px 2px rgba(0, 0, 0, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
          {icon && <span style={{ color: isFiltered ? 'var(--accent-primary)' : 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>{icon}</span>}
          {label && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 500 }}>{label}:</span>}
          <span style={{
            color: 'var(--text-primary)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {selectedOption?.label || String(value)}
          </span>
        </div>

        <ChevronDown
          size={14}
          color={isFiltered ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            flexShrink: 0
          }}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          className="dropdown-menu-enter"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            zIndex: 1050,
            minWidth: '220px',
            backgroundColor: '#161922',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            padding: '0.35rem',
            backdropFilter: 'blur(16px)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-xs)',
                    backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                    border: 'none',
                    color: isSelected ? 'white' : 'var(--text-secondary)',
                    fontSize: '0.8125rem',
                    fontWeight: isSelected ? 600 : 400,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.12s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{opt.label}</span>
                    {opt.sublabel && (
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>
                        {opt.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
