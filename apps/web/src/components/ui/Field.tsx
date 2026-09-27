import React from 'react';

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

/** Etiqueta de formulario. El control va como hijo, con la clase `form-control`. */
export const Field: React.FC<FieldProps> = ({ label, children }) => (
  <label className="form-field">
    <span className="form-label">{label}</span>
    {children}
  </label>
);
