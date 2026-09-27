import React from 'react';
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

export const Toast: React.FC<{ message: ToastMessage | null }> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="toast toast-enter" role="status">
      {ICONS[message.tone]}
      {message.text}
    </div>
  );
};
