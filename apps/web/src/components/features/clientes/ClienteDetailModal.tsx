import React from 'react';
import { Building2, Clock, Edit2, Mail, MapPin, Navigation, Phone } from 'lucide-react';
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

/**
 * Ficha del cliente (HU3.1).
 *
 * Muestra los datos de la empresa, dirección y centros de distribución asociados
 * con sus distancias, permitiendo editar su información.
 */
export const ClienteDetailModal: React.FC<ClienteDetailModalProps> = ({
  cliente,
  onClose,
  onEditar,
}) => {
  const centroPrincipal = cliente.centros?.[0];

  const kpis = [
    {
      label: 'Centros de distribución',
      icon: <MapPin size={14} color={accent} />,
      value: cliente.centros?.length ?? 0,
      unit: 'destinos',
    },
    {
      label: 'Distancia base',
      icon: <Navigation size={14} color={accent} />,
      value: centroPrincipal ? `${centroPrincipal.distanciaKm}` : '0',
      unit: 'km',
    },
    {
      label: 'Tiempo de viaje',
      icon: <Clock size={14} color={accent} />,
      value: centroPrincipal ? `${centroPrincipal.distanciaMin}` : '0',
      unit: 'minutos',
    },
  ];

  return (
    <Modal
      title={cliente.razon}
      subtitle={`RUT: ${cliente.rut}`}
      icon={<Building2 color={accent} size={22} />}
      onClose={onClose}
      maxWidth="640px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Button onClick={onClose}>Cerrar</Button>
          <Button variant="primary" icon={<Edit2 size={15} />} onClick={onEditar}>
            Editar cliente
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* KPI Tiles */}
        <div className="kpi-grid">
          {kpis.map((k, idx) => (
            <InfoTile
              key={idx}
              label={k.label}
              icon={k.icon}
              value={
                <span>
                  {k.value}{' '}
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {k.unit}
                  </span>
                </span>
              }
            />
          ))}
        </div>

        {/* Datos de contacto */}
        <div className="section-card">
          <h3 className="section-title">Datos de Contacto</h3>
          <div className="info-grid">
            <div className="info-row">
              <span className="info-label">Razón Social:</span>
              <span className="info-value">{cliente.razon}</span>
            </div>
            <div className="info-row">
              <span className="info-label">RUT:</span>
              <span className="info-value">{cliente.rut}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Teléfono:</span>
              <span className="info-value">
                {cliente.telefono ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={13} color={accent} /> {cliente.telefono}
                  </span>
                ) : (
                  'No registrado'
                )}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Correo:</span>
              <span className="info-value">
                {cliente.mail ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Mail size={13} color={accent} /> {cliente.mail}
                  </span>
                ) : (
                  'No registrado'
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Centros de Distribución y Direcciones */}
        <div className="section-card">
          <h3 className="section-title">Centros de Distribución / Destinos de Entrega</h3>
          {cliente.centros && cliente.centros.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {cliente.centros.map((c) => (
                <div
                  key={c.id}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <MapPin size={16} color={accent} style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {c.direccion}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Destino habilitado para pedidos
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', gap: '0.5rem' }}>
                    <span className="doc-chip" style={{ fontSize: '0.75rem' }}>
                      {c.distanciaKm} km
                    </span>
                    <span className="doc-chip" style={{ fontSize: '0.75rem' }}>
                      {c.distanciaMin} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
              No tiene centros de distribución vinculados.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
