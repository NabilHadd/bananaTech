import React from 'react';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import { Select } from '../../ui/Select';
import type { SelectOption } from '../../ui/Select';
import { CAPACIDAD_OPCIONES, ESTADO_OPCIONES } from './flota.constants';
import type { CamionFiltros, EstadoCamion, TipoCamion } from './types';

interface CamionFiltersProps {
  filtros: CamionFiltros;
  onChange: (filtros: CamionFiltros) => void;
  onReset: () => void;
  tipos: TipoCamion[];
  visibles: number;
  total: number;
}

function contarFiltrosActivos(filtros: CamionFiltros): number {
  return (
    (filtros.busqueda.trim() !== '' ? 1 : 0) +
    (filtros.idTipoCamion !== null ? 1 : 0) +
    (filtros.estado !== null ? 1 : 0) +
    (filtros.capacidadMinKg !== null ? 1 : 0)
  );
}

export const CamionFilters: React.FC<CamionFiltersProps> = ({
  filtros,
  onChange,
  onReset,
  tipos,
  visibles,
  total,
}) => {
  const activos = contarFiltrosActivos(filtros);

  const tipoOpciones: SelectOption[] = [
    { value: '', label: 'Todos los tipos' },
    ...tipos.map((t) => ({ value: String(t.id), label: t.nombre })),
  ];

  return (
    <div className="glass-panel filters-panel">
      <div className="filters-row">
        <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
          <SearchInput
            value={filtros.busqueda}
            onChange={(busqueda) => onChange({ ...filtros, busqueda })}
            placeholder="Buscar por patente, marca, modelo o tipo..."
          />
        </div>

        <div className="filters-controls">
          <Select
            label="Tipo"
            value={filtros.idTipoCamion === null ? '' : String(filtros.idTipoCamion)}
            options={tipoOpciones}
            highlighted={filtros.idTipoCamion !== null}
            onChange={(v) => onChange({ ...filtros, idTipoCamion: v === '' ? null : Number(v) })}
            minWidth="175px"
          />
          <Select
            label="Estado"
            value={filtros.estado ?? ''}
            options={ESTADO_OPCIONES}
            highlighted={filtros.estado !== null}
            onChange={(v) => onChange({ ...filtros, estado: v === '' ? null : (v as EstadoCamion) })}
            minWidth="155px"
          />
          <Select
            label="Capacidad"
            value={filtros.capacidadMinKg === null ? '' : String(filtros.capacidadMinKg)}
            options={CAPACIDAD_OPCIONES}
            highlighted={filtros.capacidadMinKg !== null}
            onChange={(v) => onChange({ ...filtros, capacidadMinKg: v === '' ? null : Number(v) })}
            minWidth="180px"
          />
        </div>
      </div>

      <div className="filters-summary">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{visibles}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> vehículos
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
