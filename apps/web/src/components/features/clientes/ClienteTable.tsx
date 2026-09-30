import React from 'react';
import { Building2, Eye, Mail, MapPin, Pencil, Phone } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { Button } from '../../ui/Button';
import type { Cliente } from './types';

interface ClienteTableProps {
  clientes: Cliente[];
  onSelect: (cliente: Cliente) => void;
  onEdit: (cliente: Cliente) => void;
  empty: React.ReactNode;
}

const muted = { fontSize: '0.75rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' } as const;
const strong = { fontWeight: 600, color: 'var(--text-primary)' } as const;

export const ClienteTable: React.FC<ClienteTableProps> = ({
  clientes,
  onSelect,
  onEdit,
  empty,
}) => {
  const columns: Column<Cliente>[] = [
    {
      key: 'cliente',
      header: 'Cliente',
      render: (c) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            className="conductor-avatar"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(30, 64, 175, 0.4))',
              color: 'var(--accent-primary)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <Building2 size={16} />
          </div>
          <div>
            <div style={strong}>{c.razon}</div>
            <div style={muted}>RUT {c.rut}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'direccion',
      header: 'Dirección & Centro',
      render: (c) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
            <MapPin size={13} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
            <span>{c.direccion || 'Sin dirección registrada'}</span>
          </div>
          {c.centros && c.centros.length > 0 && (
            <div style={{ ...muted, marginTop: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {c.centros.map((centro) => (
                <span key={centro.id} className="doc-chip" style={{ fontSize: '0.7rem' }}>
                  {centro.distanciaKm} km · {centro.distanciaMin} min
                </span>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'contacto',
      header: 'Contacto',
      render: (c) => (
        <div>
          {c.telefono ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8125rem' }}>
              <Phone size={12} color="var(--text-tertiary)" /> {c.telefono}
            </div>
          ) : (
            <span style={muted}>Sin teléfono</span>
          )}
          {c.mail ? (
            <div style={{ ...muted, display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <Mail size={12} /> {c.mail}
            </div>
          ) : (
            <div style={muted}>Sin correo</div>
          )}
        </div>
      ),
    },
    {
      key: 'acciones',
      header: 'Acciones',
      render: (c) => (
        <div
          style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            size="sm"
            variant="secondary"
            icon={<Eye size={14} />}
            onClick={() => onSelect(c)}
            title="Ver ficha del cliente"
          >
            Ficha
          </Button>
          <Button
            size="sm"
            variant="secondary"
            icon={<Pencil size={14} />}
            onClick={() => onEdit(c)}
            title="Editar datos del cliente"
          >
            Editar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={clientes}
      rowKey={(c) => c.id}
      onRowClick={onSelect}
      empty={empty}
    />
  );
};
