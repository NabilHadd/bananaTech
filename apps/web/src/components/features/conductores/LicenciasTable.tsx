import React from 'react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { LicenciaBadge } from './ConductoresBadges';
import type { Licencia } from './types';

/** Historial de licencias del conductor, la actual primero. */
export const LicenciasTable: React.FC<{ licencias: Licencia[] }> = ({ licencias }) => {
  const actual = licencias[0]?.id;

  const columns: Column<Licencia>[] = [
    {
      key: 'clases',
      header: 'Clases',
      render: (l) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {l.clases.map((clase) => (
            <strong key={clase} className="doc-chip">{clase}</strong>
          ))}
        </div>
      ),
    },
    {
      key: 'habilita',
      header: 'Habilita',
      render: (l) => (l.tiposCamionHabilitados.length ? l.tiposCamionHabilitados.join(', ') : 'Ningún tipo de camión'),
    },
    { key: 'emision', header: 'Emisión', render: (l) => l.fechaEmision },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      render: (l) => (
        <span
          style={{
            fontWeight: l.vigente ? 500 : 700,
            color: !l.vigente && l.id === actual ? 'var(--status-error)' : undefined,
          }}
        >
          {l.fechaVencimiento}
        </span>
      ),
    },
    { key: 'estado', header: 'Estado', render: (l) => <LicenciaBadge vigente={l.vigente} actual={l.id === actual} /> },
  ];

  return <DataTable columns={columns} rows={licencias} rowKey={(l) => l.id} bordered />;
};
