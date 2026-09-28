import React from 'react';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import { Select } from '../../ui/Select';
import type { SelectOption } from '../../ui/Select';
import { ESTADO_OPCIONES } from './conductores.constants';
import type { ClaseLicencia, ConductorFiltros, EstadoConductor, LicenciaClase } from './types';

interface ConductorFiltersProps {
  filtros: ConductorFiltros;
  onChange: (filtros: ConductorFiltros) => void;
  onReset: () => void;
  clases: ClaseLicencia[];
  visibles: number;
  total: number;
}

function contarFiltrosActivos(filtros: ConductorFiltros): number {
  return (
    (filtros.busqueda.trim() !== '' ? 1 : 0) +
    (filtros.clase !== null ? 1 : 0) +
    (filtros.estado !== null ? 1 : 0)
  );
}

export const ConductorFilters: React.FC<ConductorFiltersProps> = ({
  filtros,
  onChange,
  onReset,
  clases,
  visibles,
  total,
}) => {
  const activos = contarFiltrosActivos(filtros);

  const claseOpciones: SelectOption[] = [
    { value: '', label: 'Todas las clases' },
    ...clases.map((c) => ({
      value: c.clase,
      label: `Clase ${c.clase}`,
      sublabel: c.tiposCamion.length ? c.tiposCamion.join(', ') : c.descripcion ?? undefined,
    })),
  ];

  return (
    <div className="glass-panel filters-panel">
      <div className="filters-row">
        <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
          <SearchInput
            value={filtros.busqueda}
            onChange={(busqueda) => onChange({ ...filtros, busqueda })}
            placeholder="Buscar por nombre, RUT o email..."
          />
        </div>

        <div className="filters-controls">
          <Select
            label="Clase"
            value={filtros.clase ?? ''}
            options={claseOpciones}
            highlighted={filtros.clase !== null}
            onChange={(v) => onChange({ ...filtros, clase: v === '' ? null : (v as LicenciaClase) })}
            minWidth="170px"
          />
          <Select
            label="Estado"
            value={filtros.estado ?? ''}
            options={ESTADO_OPCIONES}
            highlighted={filtros.estado !== null}
            onChange={(v) => onChange({ ...filtros, estado: v === '' ? null : (v as EstadoConductor) })}
            minWidth="170px"
          />
        </div>
      </div>

      <div className="filters-summary">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{visibles}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> conductores
          </span>
          {activos > 0 && (
            <span className="filters-count">
              <SlidersHorizontal size={12} /> {activos} filtro{activos > 1 ? 's' : ''} activo{activos > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {activos > 0 && (
          <Button size="sm" icon={<FilterX size={13} />} onClick={onReset}>
            Limpiar filtros
          </Button>
        )}
      </div>
    </div>
  );
};
