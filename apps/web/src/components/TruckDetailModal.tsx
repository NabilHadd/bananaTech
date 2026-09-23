import React, { useState } from 'react';
import type { Camion } from '../data/mockData';
import { getHistorialViajesCamion, validarDocumentosCamion } from '../data/mockData';
import {
  Truck,
  X,
  Gauge,
  Weight,
  Box,
  Fuel,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Navigation,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Edit2
} from 'lucide-react';
import { ModalPortal } from './ModalPortal';

interface TruckDetailModalProps {
  camion: Camion;
  onClose: () => void;
  onEdit: (camion: Camion) => void;
  onRenewDocs: (camion: Camion, docTipo?: 'RT' | 'PC' | 'SOAP' | 'PADRON' | 'CEC') => void;
}

export const TruckDetailModal: React.FC<TruckDetailModalProps> = ({
  camion,
  onClose,
  onEdit,
  onRenewDocs
}) => {
  const [activeTab, setActiveTab] = useState<'atributos' | 'documentos' | 'viajes'>('atributos');

  const viajes = getHistorialViajesCamion(camion.id, camion.patente);
  const docValidation = validarDocumentosCamion(camion);

  const totalKmViajes = viajes.reduce((acc, v) => acc + v.distanciaKm, 0);
  const totalCargaTransportadaKg = viajes.reduce((acc, v) => acc + v.pesoKg, 0);

  return (
    <ModalPortal>
      <div className="modal-backdrop" onClick={onClose}>
        <div className="glass-panel modal-window" onClick={(e) => e.stopPropagation()} style={{
        width: '100%',
        maxWidth: '820px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: !camion.activo
                ? 'rgba(255,255,255,0.05)'
                : camion.estado === 'Bloqueado'
                  ? 'var(--status-error-bg)'
                  : 'var(--accent-glow)',
              color: !camion.activo
                ? 'var(--text-tertiary)'
                : camion.estado === 'Bloqueado'
                  ? 'var(--status-error)'
                  : 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={26} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                  {camion.patente}
                </h2>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontWeight: 600
                }}>
                  {camion.codigo}
                </span>

                {!camion.activo ? (
                  <span className="badge badge-neutral">Dado de Baja (RNF-06)</span>
                ) : camion.estado === 'Disponible' ? (
                  <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                    <CheckCircle2 size={12} /> Disponible
                  </span>
                ) : (
                  <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                    <ShieldAlert size={12} /> Bloqueado
                  </span>
                )}
              </div>

              <div style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginTop: '0.2rem' }}>
                {camion.marca} {camion.modelo} ({camion.anio}) • Carrocería: {camion.tipo}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)'
            }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Quick KPI Strip */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Gauge size={14} color="var(--accent-primary)" /> ODÓMETRO ACTUAL
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {camion.kilometrajeActual.toLocaleString('es-CL')} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>km</span>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Weight size={14} color="var(--accent-primary)" /> CARGA MÁXIMA
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {camion.pesoMaxKg.toLocaleString('es-CL')} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>kg</span>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', borderRight: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Fuel size={14} color="var(--accent-primary)" /> RENDIMIENTO BASE
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {camion.rendimientoBaseKmL.toFixed(1)} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>km/L</span>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-tertiary)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
              <Navigation size={14} color="var(--accent-primary)" /> HISTORIAL VIAJES
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {viajes.length} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-tertiary)' }}>viajes ({totalKmViajes.toLocaleString('es-CL')} km)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          padding: '0.75rem 1.5rem 0',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('atributos')}
            style={{
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'atributos' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'atributos' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'atributos' ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Truck size={15} /> Atributos Técnicos
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documentos')}
            style={{
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'documentos' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'documentos' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'documentos' ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <FileText size={15} /> Documentos Vigentes ({camion.documentos.length})
            {!docValidation.habilitado && (
              <span style={{
                backgroundColor: 'var(--status-error)',
                color: 'white',
                fontSize: '0.65rem',
                borderRadius: '8px',
                padding: '0.1rem 0.35rem',
                fontWeight: 700
              }}>
                !
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('viajes')}
            style={{
              padding: '0.6rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'viajes' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              color: activeTab === 'viajes' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontWeight: activeTab === 'viajes' ? 600 : 400,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <Navigation size={15} /> Historial de Viajes ({viajes.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* TAB 1: ATRIBUTOS TECNICOS */}
          {activeTab === 'atributos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1rem'
              }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Marca / Fabricante</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{camion.marca}</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Modelo & Versión</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{camion.modelo}</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Año de Fabricación</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} color="var(--accent-primary)" /> {camion.anio}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Tipo de Carrocería / Chasis</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{camion.tipo}</div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Capacidad de Peso Máxima</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {camion.pesoMaxKg.toLocaleString('es-CL')} kg ({(camion.pesoMaxKg / 1000).toFixed(1)} ton)
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Volumen Útil de Carga</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Box size={14} color="var(--accent-primary)" /> {camion.volumenMaxM3} m³
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Rendimiento Base Declarado</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {camion.rendimientoBaseKmL.toFixed(1)} km / Litro Diesel
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Kilometraje Actual Acumulado</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Gauge size={14} color="var(--accent-primary)" /> {camion.kilometrajeActual.toLocaleString('es-CL')} km
                  </div>
                </div>
              </div>

              {/* Status and Bloqueo Alert */}
              {camion.estado === 'Bloqueado' && (
                <div style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--status-error-bg)',
                  borderLeft: '4px solid var(--status-error)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem'
                }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-error)' }}>
                    <ShieldAlert size={16} /> Vehículo Bloqueado para Operaciones
                  </strong>
                  <p style={{ margin: '0.35rem 0 0', color: 'var(--text-secondary)' }}>
                    {camion.motivoBloqueo || 'Este vehículo se encuentra inhabilitado para asignación a viajes debido a incumplimiento de requisitos técnicos o legales.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DOCUMENTOS VIGENTES */}
          {activeTab === 'documentos' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Compliance Banner */}
              <div style={{
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: docValidation.habilitado ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
                borderLeft: `4px solid ${docValidation.habilitado ? 'var(--status-success)' : 'var(--status-error)'}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {docValidation.habilitado ? (
                    <ShieldCheck size={26} color="var(--status-success)" />
                  ) : (
                    <ShieldAlert size={26} color="var(--status-error)" />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {docValidation.habilitado
                        ? 'Vehículo Habilitado para Circulación'
                        : 'Vehículo Excluido de Asignaciones (Restricción Legal RN-05)'}
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {docValidation.habilitado
                        ? 'Todos los documentos obligatorios (Revisión Técnica, Permiso de Circulación y SOAP) se encuentran vigentes.'
                        : docValidation.motivo}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onRenewDocs(camion)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '0.4rem 0.8rem' }}
                >
                  + Renovar Documentación
                </button>
              </div>

              {/* Documents Table */}
              <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Nombre del Documento</th>
                      <th>Fecha Emisión</th>
                      <th>Fecha Vencimiento</th>
                      <th>Semáforo Legal</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {camion.documentos.map((doc) => (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{doc.tipo}</td>
                        <td>{doc.nombre}</td>
                        <td>{doc.fechaEmision}</td>
                        <td style={{
                          fontWeight: doc.vencido ? 700 : 500,
                          color: doc.vencido ? 'var(--status-error)' : 'var(--text-primary)'
                        }}>
                          {doc.fechaVencimiento}
                        </td>
                        <td>
                          {doc.vencido ? (
                            <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                              <AlertTriangle size={12} /> Vencido
                            </span>
                          ) : (
                            <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.3rem' }}>
                              <ShieldCheck size={12} /> Vigente
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => onRenewDocs(camion, doc.tipo)}
                            className="btn btn-secondary"
                            style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                          >
                            {doc.vencido ? 'Renovar' : 'Actualizar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIAL DE VIAJES */}
          {activeTab === 'viajes' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Navigation size={18} color="var(--accent-primary)" />
                    Registro Histórico de Viajes ({viajes.length})
                  </h3>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
                    Total recorrido: <strong>{totalKmViajes.toLocaleString('es-CL')} km</strong> • Carga movilizada: <strong>{totalCargaTransportadaKg.toLocaleString('es-CL')} kg</strong>
                  </span>
                </div>
              </div>

              {viajes.length === 0 ? (
                <div style={{
                  padding: '2.5rem 1rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed var(--border-color)',
                  color: 'var(--text-tertiary)'
                }}>
                  <Navigation size={32} style={{ opacity: 0.4, marginBottom: '0.5rem' }} />
                  <div style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.95rem' }}>
                    Este camión aún no registra viajes asignados
                  </div>
                  <p style={{ fontSize: '0.8125rem', margin: '0.35rem 0 0' }}>
                    Al programar o despachar una asignación con este vehículo, aparecerá automáticamente en esta bitácora.
                  </p>
                </div>
              ) : (
                <div className="table-container" style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Código Viaje</th>
                        <th>Fecha Salida</th>
                        <th>Ruta (Origen & Destino)</th>
                        <th>Distancia</th>
                        <th>Conductor</th>
                        <th>Carga</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {viajes.map((viaje) => (
                        <tr key={viaje.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{viaje.codigoViaje}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{viaje.cargaCodigo}</div>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.85rem' }}>{viaje.fechaSalida}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Llegada: {viaje.fechaLlegada}</div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                              <MapPin size={13} color="var(--accent-primary)" />
                              <strong>{viaje.origen}</strong>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginLeft: '1.1rem' }}>
                              ➔ {viaje.destino}
                            </div>
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {viaje.distanciaKm} km
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}>
                              <User size={13} color="var(--text-tertiary)" />
                              <span>{viaje.conductorNombre}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>
                              {viaje.pesoKg.toLocaleString('es-CL')} kg
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                              Utilización: {Math.round((viaje.pesoKg / camion.pesoMaxKg) * 100)}%
                            </div>
                          </td>
                          <td>
                            {viaje.estado === 'COMPLETADO' ? (
                              <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                <CheckCircle2 size={11} /> Completado
                              </span>
                            ) : viaje.estado === 'EN_RUTA' ? (
                              <span className="badge badge-warning" style={{ display: 'inline-flex', gap: '0.25rem' }}>
                                <Clock size={11} /> En Ruta
                              </span>
                            ) : (
                              <span className="badge badge-neutral">{viaje.estado}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '1rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={() => onEdit(camion)}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          >
            <Edit2 size={14} /> Editar Atributos Técnicos
          </button>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem' }}
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
