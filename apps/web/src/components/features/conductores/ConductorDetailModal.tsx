import React, { useState } from 'react';
import { CreditCard, Edit2, IdCard, Mail, Navigation, Phone, RefreshCw, ShieldAlert, Trash2, Truck, User } from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { InfoTile } from '../../ui/InfoTile';
import { Tabs } from '../../ui/Tabs';
import type { TabItem } from '../../ui/Tabs';
import { EstadoConductorBadge } from './ConductoresBadges';
import { LicenciasTable } from './LicenciasTable';
import { ViajesConductorTable } from './ViajesConductorTable';
import type { Conductor, EstadoConductor, HistorialConductor } from './types';

type FichaTab = 'datos' | 'licencias' | 'viajes';

interface ConductorDetailModalProps {
  conductor: Conductor;
  historial: HistorialConductor;
  onClose: () => void;
  onEditar: () => void;
  onRenovarLicencia: () => void;
  onDarDeBaja: () => void;
}

const accent = 'var(--accent-primary)';

const CALLOUT_CLASE: Record<EstadoConductor, string> = {
  DISPONIBLE: 'callout-success',
  EN_VIAJE: 'callout-neutral',
  EN_DESCANSO: 'callout-neutral',
  BLOQUEADO: 'callout-error',
  INACTIVO: 'callout-neutral',
};

/** Ficha del conductor (HU2.1 y HU2.2): datos, licencias e historial de viajes. */
export const ConductorDetailModal: React.FC<ConductorDetailModalProps> = ({
  conductor,
  historial,
  onClose,
  onEditar,
  onRenovarLicencia,
  onDarDeBaja,
}) => {
  const inactivo = conductor.estado === 'INACTIVO';
  const [tab, setTab] = useState<FichaTab>('datos');
  const licencia = conductor.licencias[0];

  const tabs: TabItem<FichaTab>[] = [
    { id: 'datos', label: 'Datos personales', icon: <User size={15} /> },
    {
      id: 'licencias',
      label: `Licencias (${conductor.licencias.length})`,
      icon: <CreditCard size={15} />,
      alert: !licencia?.vigente,
    },
    { id: 'viajes', label: `Historial de viajes (${historial.viajes.length})`, icon: <Navigation size={15} /> },
  ];

  const kpis = [
    {
      label: 'Licencia',
      icon: <CreditCard size={14} color={accent} />,
      value: licencia ? licencia.clases.join(', ') : '—',
      unit: licencia ? `vence ${licencia.fechaVencimiento}` : 'sin licencia',
    },
    {
      label: 'Camiones habilitados',
      icon: <Truck size={14} color={accent} />,
      value: licencia?.tiposCamionHabilitados.length ?? 0,
      unit: 'tipos',
    },
    {
      label: 'Viajes',
      icon: <Navigation size={14} color={accent} />,
      value: historial.viajes.length,
      unit: `(${historial.totalKm.toLocaleString('es-CL')} km)`,
    },
  ];

  return (
    <Modal
      maxWidth="860px"
      onClose={onClose}
      icon={
        <div className={`conductor-avatar conductor-avatar-lg estado-${conductor.estado.toLowerCase()}`}>
          {conductor.nombres.charAt(0)}
          {conductor.apellidos.charAt(0)}
        </div>
      }
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {conductor.nombres} {conductor.apellidos}
          <EstadoConductorBadge estado={conductor.estado} />
        </span>
      }
      subtitle={`RUT ${conductor.rut}`}
      header={
        <>
          <div className="kpi-strip">
            {kpis.map((k) => (
              <div key={k.label} className="kpi">
                <div className="kpi-label">{k.icon} {k.label}</div>
                <div className="kpi-value">
                  {k.value} <span className="kpi-unit">{k.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <Tabs items={tabs} active={tab} onChange={setTab} />
        </>
      }
      footer={
        <>
          <div style={{ display: 'flex', gap: '0.75rem', marginRight: 'auto' }}>
            {/* Un conductor dado de baja queda sólo como registro: no se edita. */}
            {!inactivo && (
              <>
                <Button icon={<Edit2 size={14} />} onClick={onEditar}>Editar</Button>
                <Button variant="danger" icon={<Trash2 size={14} />} onClick={onDarDeBaja}>Dar de baja</Button>
              </>
            )}
          </div>
          <Button variant="primary" onClick={onClose}>Cerrar ficha</Button>
        </>
      }
    >
      {tab === 'datos' && (
        <div className="stack">
          <div className="info-grid">
            <InfoTile label="Nombres" value={conductor.nombres} />
            <InfoTile label="Apellidos" value={conductor.apellidos} />
            <InfoTile label="RUT" value={conductor.rut} icon={<IdCard size={14} color={accent} />} />
            <InfoTile label="Teléfono" value={conductor.telefono} icon={<Phone size={14} color={accent} />} />
            <InfoTile label="Email" value={conductor.email} icon={<Mail size={14} color={accent} />} />
          </div>

          {conductor.motivoBloqueo && (
            <div className={`callout ${CALLOUT_CLASE[conductor.estado]}`}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} /> No disponible para asignación
              </strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>{conductor.motivoBloqueo}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'licencias' && (
        <div className="stack">
          <div >
            <div>
            </div>
            {!inactivo && (
              <Button variant="primary" size="sm" icon={<RefreshCw size={14} />} onClick={onRenovarLicencia}>
                {licencia ? 'Renovar licencia' : 'Registrar licencia'}
              </Button>
            )}
          </div>

          <LicenciasTable licencias={conductor.licencias} />
        </div>
      )}

      {tab === 'viajes' && (
        <div className="stack">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Total recorrido: <strong>{historial.totalKm.toLocaleString('es-CL')} km</strong>
          </div>
          <ViajesConductorTable viajes={historial.viajes} />
        </div>
      )}
    </Modal>
  );
};
