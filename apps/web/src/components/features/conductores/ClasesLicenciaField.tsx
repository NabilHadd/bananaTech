import React from 'react';
import type { ClaseLicencia, LicenciaClase } from './types';

interface ClasesLicenciaFieldProps {
  catalogo: ClaseLicencia[];
  value: LicenciaClase[];
  onChange: (clases: LicenciaClase[]) => void;
}

/**
 * Selección de las clases de una licencia. Muestra qué tipos de camión habilita
 * cada una; que sean válidas y sin repetir lo valida el backend.
 */
export const ClasesLicenciaField: React.FC<ClasesLicenciaFieldProps> = ({ catalogo, value, onChange }) => {
  const alternar = (clase: LicenciaClase) =>
    onChange(value.includes(clase) ? value.filter((c) => c !== clase) : [...value, clase]);

  return (
    <div className="clase-grid">
      {catalogo.map((c) => {
        const seleccionada = value.includes(c.clase);
        return (
          <label key={c.clase} className={`clase-option${seleccionada ? ' selected' : ''}`}>
            <input type="checkbox" checked={seleccionada} onChange={() => alternar(c.clase)} />
            <span>
              <strong>Clase {c.clase}</strong>
              <span className="clase-option-detalle">
                {c.tiposCamion.length ? c.tiposCamion.join(', ') : 'No habilita camiones'}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  );
};
