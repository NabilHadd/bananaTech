import React from 'react';
import { Calendar, FilterX, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { SearchInput } from '../../ui/SearchInput';
import { Select } from '../../ui/Select';
import type { SelectOption } from '../../ui/Select';
import { ESTADO_PEDIDO_OPCIONES, MERCADERIA_OPCIONES } from './pedidos.constants';
import type { MercaderiaTipo, PedidoEstado, PedidoFiltros } from './types';

interface PedidoFiltersProps {
  filtros: PedidoFiltros;
  onChange: (filtros: PedidoFiltros) => void;
  onReset: () => void;
  visibles: number;
  total: number;
}

function contarFiltrosActivos(filtros: PedidoFiltros): number {
  return (
    (filtros.busqueda.trim() !== '' ? 1 : 0) +
    (filtros.estado !== '' ? 1 : 0) +
    (filtros.tipoMercaderia !== '' ? 1 : 0) +
    (filtros.fecha.trim() !== '' ? 1 : 0)
  );
}

export const PedidoFilters: React.FC<PedidoFiltersProps> = ({
  filtros,
  onChange,
  onReset,
  visibles,
  total,
}) => {
  const activos = contarFiltrosActivos(filtros);

  const estadoOpciones: SelectOption[] = [
    { value: '', label: 'Todos los estados' },
    ...ESTADO_PEDIDO_OPCIONES.map((e) => ({ value: e.valor, label: e.label })),
  ];

  const mercaderiaOpciones: SelectOption[] = [
    { value: '', label: 'Todas las cargas' },
    ...MERCADERIA_OPCIONES.map((m) => ({ value: m.valor, label: m.label })),
  ];

  return (
    <div className="glass-panel filters-panel">
      <div className="filters-row">
        <div style={{ flex: '1 1 280px', minWidth: '280px' }}>
          <SearchInput
            value={filtros.busqueda}
            onChange={(busqueda) => onChange({ ...filtros, busqueda })}
            placeholder="Buscar por cliente, RUT o destino..."
          />
        </div>

        <div className="filters-controls">
          <Select
            label="Estado"
            value={filtros.estado}
            options={estadoOpciones}
            highlighted={filtros.estado !== ''}
            onChange={(v) => onChange({ ...filtros, estado: v as PedidoEstado | '' })}
            minWidth="180px"
          />
          <Select
            label="Tipo de carga"
            value={filtros.tipoMercaderia}
            options={mercaderiaOpciones}
            highlighted={filtros.tipoMercaderia !== ''}
            onChange={(v) => onChange({ ...filtros, tipoMercaderia: v as MercaderiaTipo | '' })}
            minWidth="170px"
          />
          <div
            className={`date-filter-control${filtros.fecha ? ' highlighted' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.42rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: filtros.fecha ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255, 255, 255, 0.04)',
              border: filtros.fecha ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid var(--border-color)',
              color: filtros.fecha ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '0.8125rem',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.18s ease',
            }}
          >
            <Calendar
              size={14}
              color={filtros.fecha ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
              style={{ flexShrink: 0 }}
            />
            <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', fontWeight: 500 }}>
              Fecha:
            </span>
            <input
              type="date"
              aria-label="Filtrar por fecha de entrega"
              value={filtros.fecha}
              onChange={(e) => onChange({ ...filtros, fecha: e.target.value })}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8125rem',
                fontFamily: 'inherit',
                cursor: 'pointer',
                colorScheme: 'dark',
              }}
            />
            {filtros.fecha && (
              <button
                type="button"
                onClick={() => onChange({ ...filtros, fecha: '' })}
                title="Quitar filtro de fecha"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0 2px',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="filters-summary">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ color: 'var(--text-tertiary)' }}>
            Mostrando <strong style={{ color: 'var(--text-primary)' }}>{visibles}</strong> de{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> pedidos
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
