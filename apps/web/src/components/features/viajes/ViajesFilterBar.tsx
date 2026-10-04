import { Select } from '../../ui/Select';
import type { ViajeEstado } from '../flota/types';
import { ESTADO_VIAJE_OPCIONES } from './viajes.constants';

interface ViajesFilterBarProps {
  estado: ViajeEstado | '';
  visibles: number;
  total: number;
  onEstadoChange: (estado: ViajeEstado | '') => void;
}

export function ViajesFilterBar({ estado, visibles, total, onEstadoChange }: ViajesFilterBarProps) {
  return (
    <div className="glass-panel filters-panel">
      <div className="filters-row"><div className="filters-controls">
        <Select
          label="Estado"
          value={estado}
          options={ESTADO_VIAJE_OPCIONES}
          highlighted={estado !== ''}
          onChange={(value) => onEstadoChange(value as ViajeEstado | '')}
          minWidth="200px"
        />
      </div></div>
      <div className="filters-summary"><span style={{ color: 'var(--text-tertiary)' }}>
        Mostrando <strong style={{ color: 'var(--text-primary)' }}>{visibles}</strong> de{' '}
        <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> viajes
      </span></div>
    </div>
  );
}