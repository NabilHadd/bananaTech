import React from 'react';
import { Eye, Mail, Phone } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { Button } from '../../ui/Button';
import { EstadoConductorBadge } from './ConductoresBadges';
import type { Conductor } from './types';

interface ConductorTableProps {
  conductores: Conductor[];
  onSelect: (conductor: Conductor) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;

export const ConductorTable: React.FC<ConductorTableProps> = ({ conductores, onSelect, empty }) => {
  const columns: Column<Conductor>[] = [
    {
      key: 'conductor',
      header: 'Conductor',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className={`conductor-avatar estado-${c.estado.toLowerCase()}`}>
            {c.nombres.charAt(0)}
            {c.apellidos.charAt(0)}
          </div>
          <div>
            <div style={strong}>{c.nombres} {c.apellidos}</div>
            <div style={muted}>RUT {c.rut}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (c) => (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <Phone size={12} color="var(--text-tertiary)" /> {c.telefono}
          </div>
          <div style={{ ...muted, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={12} /> {c.email}
          </div>
        </>
      ),
    },
    {
      key: 'licencia',
      header: 'Licencia',
      render: (c) => {
        const licencia = c.licencias[0];
        if (!licencia) return <span style={muted}>Sin licencia</span>;
        return (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
              {licencia.clases.map((clase) => (
                <span key={clase} className={`doc-chip${licencia.vigente ? '' : ' vencido'}`}>
                  {clase}
                </span>
              ))}
            </div>
            <div style={{ ...muted, color: licencia.vigente ? undefined : 'var(--status-error)' }}>
              {licencia.vigente ? 'Vence' : 'Venció'} {licencia.fechaVencimiento}
            </div>
          </>
        );
      },
    },
    {
      key: 'habilitados',
      header: 'Camiones habilitados',
      render: (c) => {
        const tipos = c.licencias[0]?.tiposCamionHabilitados ?? [];
        return tipos.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '220px' }}>
            {tipos.map((tipo) => (
              <span key={tipo} className="chip">{tipo}</span>
            ))}
          </div>
        ) : (
          <span style={muted}>Ninguno</span>
        );
      },
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (c) => (
        <>
          <EstadoConductorBadge estado={c.estado} />
          {c.motivoBloqueo && (
            <div style={{ ...muted, whiteSpace: 'normal', maxWidth: '220px', marginTop: '0.3rem' }}>
              {c.motivoBloqueo}
            </div>
          )}
        </>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (c) => (
        <Button
          size="sm"
          icon={<Eye size={13} />}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(c);
          }}
          title="Ver datos, licencias e historial de viajes"
        >
          Ficha
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={conductores}
      rowKey={(c) => c.id}
      onRowClick={onSelect}
      isRowMuted={(c) => c.estado === 'INACTIVO'}
      empty={empty}
    />
  );
};
