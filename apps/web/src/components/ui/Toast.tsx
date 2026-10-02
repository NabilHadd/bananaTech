import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Info } from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  text: string;
  tone: ToastTone;
}

const ICONS: Record<ToastTone, React.ReactNode> = {
  success: <Check size={18} color="var(--status-success)" />,
  error: <AlertCircle size={18} color="var(--status-error)" />,
  info: <Info size={18} color="var(--accent-primary)" />,
};

/**
 * Se monta en `document.body`: dentro de la página quedaría atrapado en su
 * contexto de apilamiento (la animación de entrada le da un `transform`) y
 * un modal abierto lo taparía.
 */
export const Toast: React.FC<{ message: ToastMessage | null }> = ({ message }) => {
  if (!message) return null;
  return createPortal(
    <div className="toast toast-enter" role="status">
      {ICONS[message.tone]}
      {message.text}
    </div>,
    document.body,
  );
};
