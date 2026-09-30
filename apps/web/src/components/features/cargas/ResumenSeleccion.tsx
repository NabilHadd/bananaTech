import React from 'react';
import type { Pedido } from '../pedidos/types';
import { formatearNumero } from './cargas.constants';

interface ResumenSeleccionProps {
  seleccionados: Pedido[];
  /** Peso y volumen que la carga ya tiene, para mostrar cómo quedaría. */
  base?: { pesoKg: number; volumenM3: number };
}

/** Totales de los pedidos elegidos, para el pie de los modales de selección. */
export const ResumenSeleccion: React.FC<ResumenSeleccionProps> = ({ seleccionados, base }) => {
  const peso = seleccionados.reduce((s, p) => s + p.pesoKg, 0) + (base?.pesoKg ?? 0);
  const volumen = seleccionados.reduce((s, p) => s + p.volumenM3, 0) + (base?.volumenM3 ?? 0);
  const n = seleccionados.length;

  return (
    <span style={{ marginRight: 'auto', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
      {n === 0 ? (
        'Ningún pedido seleccionado'
      ) : (
        <>
          {n} seleccionado{n === 1 ? '' : 's'} · {base ? 'la carga quedaría en ' : ''}
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(peso)}</strong> kg ·{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{formatearNumero(volumen)}</strong> m³
        </>
      )}
    </span>
  );
};
