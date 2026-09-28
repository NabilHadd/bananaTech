import React, { useState } from 'react';
import {
  Box,
  Calendar,
  Edit2,
  FileText,
  Fuel,
  Gauge,
  Navigation,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Truck,
  Weight,
} from 'lucide-react';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { InfoTile } from '../../ui/InfoTile';
import { Tabs } from '../../ui/Tabs';
import type { TabItem } from '../../ui/Tabs';
import { DocumentosTable } from './DocumentosTable';
import { EstadoCamionBadge } from './FlotaBadges';
import { ViajesTable } from './ViajesTable';
import type { Camion, DocumentoCamion, EstadoCamion, HistorialCamion } from './types';

type FichaTab = 'atributos' | 'documentos' | 'viajes';

interface CamionDetailModalProps {
  camion: Camion;
  historial: HistorialCamion;
  onClose: () => void;
  onEditar: () => void;
  /** Abre el formulario de documento; con `documento`, para renovarlo. */
  onDocumento: (documento?: DocumentoCamion) => void;
  onDarDeBaja: () => void;
}

const accent = 'var(--accent-primary)';

const ESTADO_CALLOUT: Record<EstadoCamion, { className: string; title: string; icon: React.ReactNode }> = {
  DISPONIBLE: {
    className: 'callout-success',
    title: 'Documentación obligatoria al día',
    icon: <ShieldCheck size={26} color="var(--status-success)" />,
  },
  BLOQUEADO: {
    className: 'callout-error',
    title: 'Camión excluido de asignaciones',
    icon: <ShieldAlert size={26} color="var(--status-error)" />,
  },
  INACTIVO: {
    className: 'callout-neutral',
    title: 'Camión dado de baja',
    icon: <ShieldAlert size={26} color="var(--text-tertiary)" />,
  },
};

/** Ficha del camión (HU1.3): atributos, documentos e historial de viajes. */
export const CamionDetailModal: React.FC<CamionDetailModalProps> = ({
  camion,
  historial,
  onClose,
  onEditar,
  onDocumento,
  onDarDeBaja,
}) => {
  const [tab, setTab] = useState<FichaTab>('atributos');
  const inactivo = camion.estado === 'INACTIVO';

  const tabs: TabItem<FichaTab>[] = [
    { id: 'atributos', label: 'Atributos técnicos', icon: <Truck size={15} /> },
    {
      id: 'documentos',
      label: `Documentos (${camion.documentos.length})`,
      icon: <FileText size={15} />,
      alert: camion.documentos.some((d) => !d.vigente),
    },
    { id: 'viajes', label: `Historial de viajes (${historial.viajes.length})`, icon: <Navigation size={15} /> },
  ];

  const kpis = [
    { label: 'Odómetro actual', icon: <Gauge size={14} color={accent} />, value: camion.kilometrajeActual.toLocaleString('es-CL'), unit: 'km' },
    { label: 'Carga máxima', icon: <Weight size={14} color={accent} />, value: camion.pesoMaxKg.toLocaleString('es-CL'), unit: 'kg' },
    { label: 'Rendimiento base', icon: <Fuel size={14} color={accent} />, value: camion.rendimientoBaseKmL.toFixed(1), unit: 'km/L' },
    { label: 'Viajes', icon: <Navigation size={14} color={accent} />, value: historial.viajes.length, unit: `(${historial.totalKm.toLocaleString('es-CL')} km)` },
  ];

  return (
    <Modal
      maxWidth="860px"
      onClose={onClose}
      icon={
        <div className={`camion-avatar camion-avatar-lg estado-${camion.estado.toLowerCase()}`}>
          <Truck size={26} />
        </div>
      }
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span style={{ letterSpacing: '0.04em' }}>{camion.patente}</span>
          <EstadoCamionBadge estado={camion.estado} />
        </span>
      }
      subtitle={`${camion.marca} ${camion.modelo} (${camion.anio}) • ${camion.tipo}`}
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
            {/* Un camión dado de baja queda sólo como registro: no se edita. */}
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
      {tab === 'atributos' && (
        <div className="stack">
          <div className="info-grid">
            <InfoTile label="Marca" value={camion.marca} />
            <InfoTile label="Modelo" value={camion.modelo} />
            <InfoTile label="Año de fabricación" value={camion.anio} icon={<Calendar size={14} color={accent} />} />
            <InfoTile label="Tipo de camión" value={camion.tipo} />
            <InfoTile
              label="Capacidad de peso máxima"
              value={`${camion.pesoMaxKg.toLocaleString('es-CL')} kg (${(camion.pesoMaxKg / 1000).toFixed(1)} ton)`}
            />
            <InfoTile label="Volumen útil de carga" value={`${camion.volumenMaxM3} m³`} icon={<Box size={14} color={accent} />} />
            <InfoTile label="Rendimiento base" value={`${camion.rendimientoBaseKmL.toFixed(1)} km/L`} />
            <InfoTile
              label="Kilometraje actual"
              value={`${camion.kilometrajeActual.toLocaleString('es-CL')} km`}
              icon={<Gauge size={14} color={accent} />}
            />
          </div>

          {camion.motivoBloqueo && (
            <div className={`callout ${camion.estado === 'BLOQUEADO' ? 'callout-error' : 'callout-neutral'}`}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldAlert size={16} /> No disponible para asignación
              </strong>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>{camion.motivoBloqueo}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'documentos' && (
        <div className="stack">
          <div className={`callout ${ESTADO_CALLOUT[camion.estado].className} callout-row`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {ESTADO_CALLOUT[camion.estado].icon}
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ESTADO_CALLOUT[camion.estado].title}
                </div>
                {camion.motivoBloqueo && (
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{camion.motivoBloqueo}</div>
                )}
              </div>
            </div>
            {!inactivo && (
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => onDocumento()}>
                Registrar documento
              </Button>
            )}
          </div>

          <DocumentosTable documentos={camion.documentos} onRenovar={inactivo ? undefined : onDocumento} />
        </div>
      )}

      {tab === 'viajes' && (
        <div className="stack">
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
            Total recorrido: <strong>{historial.totalKm.toLocaleString('es-CL')} km</strong> • Carga movilizada:{' '}
            <strong>{historial.totalKg.toLocaleString('es-CL')} kg</strong>
          </div>
          <ViajesTable viajes={historial.viajes} />
        </div>
      )}
    </Modal>
  );
};
