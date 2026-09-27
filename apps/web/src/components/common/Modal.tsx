import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  onClose: () => void;
  /** Contenido fijo bajo la cabecera (p. ej. pestañas), fuera del área con scroll. */
  header?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}

/**
 * Ventana modal montada en `document.body`, para que ningún `overflow` o
 * `z-index` de la página la recorte. Se cierra con la X o al pulsar el fondo.
 */
export const Modal: React.FC<ModalProps> = ({
  title,
  subtitle,
  icon,
  onClose,
  header,
  footer,
  maxWidth = '560px',
  tone = 'default',
  children,
}) =>
  createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal-window${tone === 'danger' ? ' modal-danger' : ''}`}
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0 }}>
            {icon}
            <div style={{ minWidth: 0 }}>
              <h2 className="modal-title">{title}</h2>
              {subtitle && <div className="modal-subtitle">{subtitle}</div>}
            </div>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        {header}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
