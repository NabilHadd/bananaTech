import React, { useState } from 'react';
import { CARGAS, PEDIDOS, CENTROS_DISTRIBUCION } from '../data/mockData';
import type { Carga, Pedido } from '../data/mockData';
import { Map, Package, AlertTriangle, XCircle, CheckCircle, Navigation, Building2, Weight, Box } from 'lucide-react';

export const RutasViajesView: React.FC = () => {
  const [subTab, setSubTab] = useState<'cargas' | 'pedidos' | 'rutas'>('cargas');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Map color="var(--accent-primary)" /> Rutas, Cargas & Pedidos
          </h1>
          <p className="text-muted">
            Planificación logística, consolidación de pedidos en cargas y control de restricciones de compatibilidad
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary">+ Consolidar Carga</button>
        </div>
      </div>

      {/* Subtabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setSubTab('cargas')}
          className="btn"
          style={{
            backgroundColor: subTab === 'cargas' ? 'var(--accent-glow)' : 'transparent',
            color: subTab === 'cargas' ? 'white' : 'var(--text-secondary)',
            border: subTab === 'cargas' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            fontWeight: subTab === 'cargas' ? 600 : 400
          }}
        >
          <Package size={16} /> Cargas Consolidadas ({CARGAS.length})
        </button>

        <button
          onClick={() => setSubTab('pedidos')}
          className="btn"
          style={{
            backgroundColor: subTab === 'pedidos' ? 'var(--accent-glow)' : 'transparent',
            color: subTab === 'pedidos' ? 'white' : 'var(--text-secondary)',
            border: subTab === 'pedidos' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            fontWeight: subTab === 'pedidos' ? 600 : 400
          }}
        >
          <Box size={16} /> Pedidos Individuales ({PEDIDOS.length})
        </button>

        <button
          onClick={() => setSubTab('rutas')}
          className="btn"
          style={{
            backgroundColor: subTab === 'rutas' ? 'var(--accent-glow)' : 'transparent',
            color: subTab === 'rutas' ? 'white' : 'var(--text-secondary)',
            border: subTab === 'rutas' ? '1px solid var(--accent-primary)' : '1px solid transparent',
            fontWeight: subTab === 'rutas' ? 600 : 400
          }}
        >
          <Navigation size={16} /> Centros de Distribución ({CENTROS_DISTRIBUCION.length})
        </button>
      </div>

      {/* Cargas Table */}
      {subTab === 'cargas' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código Carga</th>
                  <th>Destino (Centro)</th>
                  <th>Pedidos Incluidos</th>
                  <th>Peso Total</th>
                  <th>Volumen</th>
                  <th>Estado</th>
                  <th>Validación / Restricción</th>
                </tr>
              </thead>
              <tbody>
                {CARGAS.map((carga: Carga) => (
                  <tr key={carga.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} color="var(--accent-secondary)" />
                        {carga.codigo}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ID: {carga.id}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{carga.centroDestino}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Origen: Coquimbo (Base)</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {carga.pedidos.map((ped) => (
                          <span
                            key={ped.id}
                            style={{
                              fontSize: '0.75rem',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-tertiary)',
                              color: 'var(--text-primary)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '0.5rem'
                            }}
                          >
                            <span><strong>{ped.codigo}</strong> ({ped.clienteNombre})</span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: ped.tipoMercaderia === 'PELIGROSA' ? 'var(--status-error)' : ped.tipoMercaderia === 'REFRIGERADA' ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                            }}>
                              {ped.tipoMercaderia}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Weight size={14} color="var(--text-secondary)" />
                        {carga.pesoTotalKg.toLocaleString('es-CL')} kg
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Box size={14} color="var(--text-secondary)" />
                        {carga.volumenTotalM3} m³
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${carga.estado === 'CREADO' ? 'badge-warning' : 'badge-error'}`}>
                        {carga.estado}
                      </span>
                    </td>
                    <td>
                      {carga.alertaEspecial ? (
                        <div style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: carga.alertaEspecial.tipo === 'error' ? 'var(--status-error-bg)' : 'var(--status-warning-bg)',
                          borderLeft: `3px solid ${carga.alertaEspecial.tipo === 'error' ? 'var(--status-error)' : 'var(--status-warning)'}`,
                          maxWidth: '280px'
                        }}>
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: carga.alertaEspecial.tipo === 'error' ? 'var(--status-error)' : 'var(--status-warning)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            {carga.alertaEspecial.tipo === 'error' ? <XCircle size={14} /> : <AlertTriangle size={14} />}
                            {carga.alertaEspecial.titulo}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.2 }}>
                            {carga.alertaEspecial.mensaje}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--status-success)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          <CheckCircle size={14} /> Lista para asignar
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pedidos Table */}
      {subTab === 'pedidos' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th>Tipo Mercadería</th>
                  <th>Peso (kg)</th>
                  <th>Volumen (m³)</th>
                  <th>Ventana de Entrega</th>
                  <th>Destino</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {PEDIDOS.map((pedido: Pedido) => (
                  <tr key={pedido.id}>
                    <td style={{ fontWeight: 600 }}>{pedido.codigo}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{pedido.clienteNombre}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ID: {pedido.clienteId}</div>
                    </td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        backgroundColor:
                          pedido.tipoMercaderia === 'PELIGROSA' ? 'var(--status-error-bg)' :
                          pedido.tipoMercaderia === 'REFRIGERADA' ? 'rgba(59, 130, 246, 0.2)' :
                          'var(--bg-tertiary)',
                        color:
                          pedido.tipoMercaderia === 'PELIGROSA' ? 'var(--status-error)' :
                          pedido.tipoMercaderia === 'REFRIGERADA' ? 'var(--accent-secondary)' :
                          'var(--text-primary)'
                      }}>
                        {pedido.tipoMercaderia}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{pedido.pesoKg.toLocaleString('es-CL')} kg</td>
                    <td>{pedido.volumenM3} m³</td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{pedido.ventanaInicio}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>hasta {pedido.ventanaFin}</div>
                    </td>
                    <td>{pedido.destino}</td>
                    <td>
                      <span className="badge badge-warning">{pedido.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rutas y Centros */}
      {subTab === 'rutas' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Centro de Distribución</th>
                  <th>Dirección</th>
                  <th>Distancia desde Base (Coquimbo)</th>
                  <th>Tiempo Estimado</th>
                  <th>Tipo de Ruta</th>
                </tr>
              </thead>
              <tbody>
                {CENTROS_DISTRIBUCION.map((centro) => (
                  <tr key={centro.id}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--accent-primary)" />
                        {centro.nombre}
                      </div>
                    </td>
                    <td className="text-muted">{centro.direccion}</td>
                    <td style={{ fontWeight: 500 }}>{centro.distanciaKm} km</td>
                    <td>{centro.tiempoEstimadoMin === 0 ? 'Base central' : `${Math.floor(centro.tiempoEstimadoMin / 60)}h ${centro.tiempoEstimadoMin % 60}m`}</td>
                    <td>
                      <span className="badge badge-neutral">
                        {centro.distanciaKm > 500 ? 'Larga Distancia (Norte)' : centro.distanciaKm > 0 ? 'Interregional Central' : 'Patio Matriz'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Notice */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        fontSize: '0.875rem'
      }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Reglas de Validación aplicadas a las Cargas:</div>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <li>
            <strong>RN-03:</strong> El peso y volumen total de la carga consolidada debe ser menor o igual a la capacidad máxima del camión asignado (<code>peso_total ≤ capacidad_kg_camión</code>).
          </li>
          <li>
            <strong>RN-07:</strong> Una carga no puede mezclar tipos de mercadería incompatibles (no mezclar carga peligrosa con alimentos/refrigerados).
          </li>
        </ul>
      </div>
    </div>
  );
};
