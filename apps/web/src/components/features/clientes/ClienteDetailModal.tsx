import React from 'react';
import { Building2, Clock, Edit2, FileText, Home, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { InfoTile } from '../../ui/InfoTile';
import type { Cliente } from './types';

interface ClienteDetailModalProps {
  cliente: Cliente;
  onClose: () => void;
  onEditar: () => void;
}

const accent = 'var(--accent-primary)';
const sinRegistro = <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>No registrado</span>;
const tituloSeccion = {
  margin: 0,
  fontSize: '0.8125rem',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
} as const;

/**
 * Ficha del cliente (HU3.1): datos de la empresa y sus destinos de entrega,
 * con la distancia y el tiempo de viaje desde la base.
 */
export const ClienteDetailModal: React.FC<ClienteDetailModalProps> = ({ cliente, onClose, onEditar }) => {
  const destinos = cliente.centros ?? [];
  const masCercano = destinos.length
    ? destinos.reduce((a, b) => (b.distanciaKm < a.distanciaKm ? b : a))
    : null;

  const kpis = [
    { label: 'Destinos de entrega', icon: <MapPin size={14} />, value: destinos.length, unit: '' },
    {
      label: 'Destino más cercano',
      icon: <Navigation size={14} />,
      value: masCercano ? masCercano.distanciaKm.toLocaleString('es-CL') : '—',
      unit: masCercano ? 'km' : '',
    },
    {
      label: 'Tiempo de viaje',
      icon: <Clock size={14} />,
      value: masCercano ? masCercano.distanciaMin.toLocaleString('es-CL') : '—',
      unit: masCercano ? 'min' : '',
    },
  ];

  return (
    <Modal
      title={cliente.razon}
      subtitle={`RUT ${cliente.rut}`}
      icon={<Building2 color={accent} size={22} />}
      onClose={onClose}
      maxWidth="680px"
      header={
        <div className="kpi-strip">
          {kpis.map((k) => (
            <div key={k.label} className="kpi">
              <div className="kpi-label">{k.icon} {k.label}</div>
              <div className="kpi-value">
                {k.value} {k.unit && <span className="kpi-unit">{k.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      }
      footer={
        <>
          <Button onClick={onClose} style={{ marginRight: 'auto' }}>Cerrar</Button>
          <Button variant="primary" icon={<Edit2 size={15} />} onClick={onEditar}>
            Editar cliente
          </Button>
        </>
      }
    >
      <div className="stack">
        <h3 style={tituloSeccion}>Datos de la empresa</h3>
        <div className="info-grid">
          <InfoTile label="Razón social" value={cliente.razon} icon={<Building2 size={14} color={accent} />} />
          <InfoTile label="RUT" value={cliente.rut} icon={<FileText size={14} color={accent} />} />
          <InfoTile
            label="Teléfono"
            value={cliente.telefono ?? sinRegistro}
            icon={<Phone size={14} color={accent} />}
          />
          <InfoTile label="Correo" value={cliente.mail ?? sinRegistro} icon={<Mail size={14} color={accent} />} />
          <InfoTile
            label="Casa matriz"
            value={cliente.direccion ?? sinRegistro}
            icon={<Home size={14} color={accent} />}
          />
        </div>

        <h3 style={{ ...tituloSeccion, marginTop: '0.5rem' }}>Destinos de entrega</h3>
        {destinos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {destinos.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <MapPin size={15} color={accent} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1, minWidth: 0, fontSize: '0.8125rem', fontWeight: 600 }}>{c.direccion}</span>
                <span className="doc-chip" style={{ fontSize: '0.75rem' }}>{c.distanciaKm} km</span>
                <span className="doc-chip" style={{ fontSize: '0.75rem' }}>{c.distanciaMin} min</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="callout">El cliente no tiene destinos de entrega asociados.</div>
        )}
      </div>
    </Modal>
  );
};
