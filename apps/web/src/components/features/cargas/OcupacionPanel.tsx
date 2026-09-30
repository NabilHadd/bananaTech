import React from 'react';
import { Badge } from '../../ui/Badge';
import { formatearNumero } from './cargas.constants';
import type { OcupacionCarga } from './types';

function colorPorcentaje(pct: number): string {
  if (pct > 100) return 'var(--status-error)';
  if (pct >= 85) return 'var(--status-warning)';
  return 'var(--status-success)';
}

const Barra: React.FC<{
  titulo: string;
  porcentaje: number;
  detalle: string;
  limitante: boolean;
}> = ({ titulo, porcentaje, detalle, limitante }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {titulo}
        {limitante && <Badge tone="warning">Factor limitante</Badge>}
      </span>
      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colorPorcentaje(porcentaje) }}>
        {formatearNumero(porcentaje)}%
      </span>
    </div>
    <div
      style={{
        height: '8px',
        borderRadius: '999px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${Math.min(porcentaje, 100)}%`,
          height: '100%',
          backgroundColor: colorPorcentaje(porcentaje),
          transition: 'width 0.3s ease',
        }}
      />
    </div>
    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{detalle}</div>
  </div>
);

/** Ocupación en peso y volumen de la carga en un camión y cuál limita (HU4.3). */
export const OcupacionPanel: React.FC<{ ocupacion: OcupacionCarga }> = ({ ocupacion: o }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
    <Barra
      titulo="Peso"
      porcentaje={o.porcentajePeso}
      detalle={`${formatearNumero(o.pesoTotalKg)} de ${formatearNumero(o.capacidadPesoKg)} kg`}
      limitante={o.factorLimitante === 'PESO'}
    />
    <Barra
      titulo="Volumen"
      porcentaje={o.porcentajeVolumen}
      detalle={`${formatearNumero(o.volumenTotalM3)} de ${formatearNumero(o.capacidadVolumenM3)} m³`}
      limitante={o.factorLimitante === 'VOLUMEN'}
    />
    {o.excede && (
      <div className="callout callout-error">
        La carga supera la capacidad del camión {o.patente}: no podrá asignársele en un viaje.
      </div>
    )}
  </div>
);
