import React from 'react';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import type { ClienteFiltros } from './types';

interface ClienteFiltersProps {
  filtros: ClienteFiltros;
  onChange: (filtros: ClienteFiltros) => void;
  onReset: () => void;
  visibles: number;
  total: number;
}

export const ClienteFilters: React.FC<ClienteFiltersProps> = ({
  filtros,
  onChange,
  onReset,
  visibles,
  total,
}) => {
  const tieneFiltros = Boolean(filtros.busqueda.trim());

  return (
    <div className="glass-panel filters-panel">
      <div className="filters-row">
        <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
          <SearchInput
            placeholder="Buscar por razón social, RUT, dirección o correo..."
            value={filtros.busqueda}
            onChange={(busqueda) => onChange({ ...filtros, busqueda })}
          />
        </div>
      </div>

      <div className="filters-summary">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{visibles}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> clientes
          </span>
          {tieneFiltros && (
            <span className="filters-count">
              <SlidersHorizontal size={12} /> 1 filtro activo
            </span>
          )}
        </div>

        {tieneFiltros && (
          <Button size="sm" icon={<FilterX size={13} />} onClick={onReset}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
