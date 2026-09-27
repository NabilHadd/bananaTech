import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

interface SelectProps {
  label?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Resalta el control, p. ej. cuando un filtro está aplicado. */
  highlighted?: boolean;
  minWidth?: string;
}

/** Desplegable con etiqueta y subtítulos por opción. */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  highlighted = false,
  minWidth = '180px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (next: string) => {
    onChange(next);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="select"
      style={{ minWidth, zIndex: isOpen ? 50 : 1 }}
    >
      <button
        type="button"
        className={`select-trigger${highlighted ? ' highlighted' : ''}${isOpen ? ' open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="select-trigger-text">
          {label && <span className="select-label">{label}:</span>}
          <span className="select-value">{selected?.label ?? value}</span>
        </span>
        <ChevronDown
          size={14}
          color={highlighted ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s var(--ease-spring)',
            flexShrink: 0,
          }}
        />
      </button>

      {isOpen && (
        <div className="select-menu dropdown-menu-enter">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`select-option${isSelected ? ' selected' : ''}`}
                onClick={() => handleSelect(opt.value)}
              >
                <span style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{opt.label}</span>
                  {opt.sublabel && <span className="select-sublabel">{opt.sublabel}</span>}
                </span>
                {isSelected && (
                  <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
