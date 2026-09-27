import React from 'react';
import { Modal } from './Modal';
import { Button } from '../ui/Button';

interface ConfirmDialogProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'default' | 'danger';
  children: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  subtitle,
  icon,
  confirmLabel,
  onConfirm,
  onCancel,
  tone = 'default',
  children,
}) => (
  <Modal
    title={title}
    subtitle={subtitle}
    icon={icon}
    onClose={onCancel}
    maxWidth="460px"
    tone={tone}
    footer={
      <>
        <Button onClick={onCancel}>Cancelar</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
      {children}
    </div>
  </Modal>
);
