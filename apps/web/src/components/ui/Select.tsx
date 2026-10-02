import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

interface Posicion {
  top: number;
  left: number;
  width: number;
}

const SEPARACION = 5;
const ALTO_MAXIMO = 320;

/**
 * Desplegable con etiqueta y subtítulos por opción.
 *
 * El menú se monta en `document.body` con posición fija junto al botón: dentro
 * de un modal, el área con scroll lo recortaría y pasaría bajo su cabecera y
 * su pie. Si no cabe debajo, se abre hacia arriba.
 */
export const Select: React.FC<SelectProps> = ({
  label,
  value,
  options,
  onChange,
  highlighted = false,
  minWidth = '180px',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const selected = options.find((opt) => opt.value === value) ?? options[0];

  // Antes de pintar, para que el menú no aparezca un instante en otro lugar.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const ubicar = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const alto = Math.min(menuRef.current?.offsetHeight ?? ALTO_MAXIMO, ALTO_MAXIMO);
      const cabeAbajo = rect.bottom + SEPARACION + alto <= window.innerHeight;
      setPosicion({
        top: cabeAbajo ? rect.bottom + SEPARACION : Math.max(SEPARACION, rect.top - SEPARACION - alto),
        left: rect.left,
        width: rect.width,
      });
    };
    ubicar();
    // `true`: también el scroll del cuerpo de un modal, no sólo el de la página.
    window.addEventListener('scroll', ubicar, true);
    window.addEventListener('resize', ubicar);
    return () => {
      window.removeEventListener('scroll', ubicar, true);
      window.removeEventListener('resize', ubicar);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const objetivo = e.target as Node;
      if (containerRef.current?.contains(objetivo) || menuRef.current?.contains(objetivo)) return;
      setIsOpen(false);
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
    <div ref={containerRef} className="select" style={{ minWidth }}>
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

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="select-menu dropdown-menu-enter"
            style={
              posicion
                ? { top: posicion.top, left: posicion.left, minWidth: Math.max(posicion.width, 220) }
                : { visibility: 'hidden' }
            }
          >
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
          </div>,
          document.body,
        )}
    </div>
  );
};
