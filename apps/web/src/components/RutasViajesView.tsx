import React, { useEffect, useState } from 'react';
import { Map, Package, PackagePlus, Navigation, Building2, Weight, Box, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  clearDeliveredHistory,
  closeTrip,
  consolidateLoads,
  createDistributionCenter,
  createOrder,
  createTrip,
  deleteDistributionCenter,
  deleteOrder,
  getClients,
  getDistributionCenters,
  getLoads,
  getOrders,
  getTripPlanning,
  updateOrder,
} from '../lib/fleetApi';
import type {
  CargaApi,
  CentroDistribucionApi,
  ClienteApi,
  CrearViajeInput,
  MercaderiaTipoApi,
  PedidoApi,
  PedidoInputApi,
  ViajeApi,
  ViajeEstado,
} from '../lib/fleetApi';

interface TripForm {
  idConductor: string;
  idCamion: string;
  idCarga: string;
  fechaInicio: string;
  fechaFin: string;
}

const EMPTY_TRIP_FORM: TripForm = {
  idConductor: '',
  idCamion: '',
  idCarga: '',
  fechaInicio: new Date().toISOString().slice(0, 16),
  fechaFin: '',
};

interface PedidoForm {
  idCliente: string;
  pesoKg: string;
  volumenM3: string;
  ventanaInicio: string;
  ventanaFin: string;
  tipoMercaderia: MercaderiaTipoApi;
}

const EMPTY_ORDER_FORM: PedidoForm = {
  idCliente: '',
  pesoKg: '',
  volumenM3: '',
  ventanaInicio: '',
  ventanaFin: '',
  tipoMercaderia: 'GENERAL',
};

interface CentroForm {
  direccion: string;
  distanciaKm: string;
  distanciaMin: string;
}

const EMPTY_CENTER_FORM: CentroForm = {
  direccion: '',
  distanciaKm: '0',
  distanciaMin: '0',
};

export const RutasViajesView: React.FC = () => {
  const [subTab, setSubTab] = useState<'cargas' | 'pedidos' | 'rutas' | 'viajes'>('viajes');
  const [planning, setPlanning] = useState<Awaited<ReturnType<typeof getTripPlanning>> | null>(null);
  const [loads, setLoads] = useState<CargaApi[]>([]);
  const [orders, setOrders] = useState<PedidoApi[]>([]);
  const [clients, setClients] = useState<ClienteApi[]>([]);
  const [centers, setCenters] = useState<CentroDistribucionApi[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [savingTrip, setSavingTrip] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingCenter, setSavingCenter] = useState(false);
  const [consolidating, setConsolidating] = useState(false);
  const [cleaningHistory, setCleaningHistory] = useState(false);
  const [consolidationMessage, setConsolidationMessage] = useState<string | null>(null);
  const [cleanupMessage, setCleanupMessage] = useState<string | null>(null);
  const [tripError, setTripError] = useState<string | null>(null);
  const [showTripForm, setShowTripForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);
  const [orderForm, setOrderForm] = useState<PedidoForm>(EMPTY_ORDER_FORM);
  const [showCenterForm, setShowCenterForm] = useState(false);
  const [centerForm, setCenterForm] = useState<CentroForm>(EMPTY_CENTER_FORM);
  const [tripForm, setTripForm] = useState<TripForm>(EMPTY_TRIP_FORM);

  const refreshPlanning = async () => {
    setTripError(null);
    try {
      const [nextPlanning, nextLoads, nextOrders, nextClients, nextCenters] = await Promise.all([
        getTripPlanning(),
        getLoads(),
        getOrders(),
        getClients(),
        getDistributionCenters(),
      ]);
      setPlanning(nextPlanning);
      setLoads(nextLoads);
      setOrders(nextOrders);
      setClients(nextClients);
      setCenters(nextCenters);
    } catch (loadError) {
      setTripError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la planificación');
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    let active = true;
    void Promise.all([
      getTripPlanning(),
      getLoads(),
      getOrders(),
      getClients(),
      getDistributionCenters(),
    ])
      .then(([data, currentLoads, currentOrders, currentClients, currentCenters]) => {
        if (active) {
          setPlanning(data);
          setLoads(currentLoads);
          setOrders(currentOrders);
          setClients(currentClients);
          setCenters(currentCenters);
        }
      })
      .catch((loadError: unknown) => {
        if (active) setTripError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la planificación');
      })
      .finally(() => { if (active) setLoadingTrips(false); });
    return () => { active = false; };
  }, []);

  const handleCreateTrip = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingTrip(true);
    setTripError(null);
    const input: CrearViajeInput = {
      idConductor: Number(tripForm.idConductor),
      idCamion: Number(tripForm.idCamion),
      idCarga: Number(tripForm.idCarga),
      fechaInicio: `${tripForm.fechaInicio}:00`,
      fechaFin: `${tripForm.fechaFin}:00`,
    };
    try {
      await createTrip(input);
      setTripForm(EMPTY_TRIP_FORM);
      setShowTripForm(false);
      await refreshPlanning();
    } catch (createError) {
      setTripError(createError instanceof Error ? createError.message : 'No se pudo registrar el viaje');
    } finally {
      setSavingTrip(false);
    }
  };

  const handleCloseTrip = async (viaje: ViajeApi, estado: ViajeEstado) => {
    setTripError(null);
    try {
      await closeTrip(viaje.id, estado);
      await refreshPlanning();
    } catch (closeError) {
      setTripError(closeError instanceof Error ? closeError.message : 'No se pudo cerrar el viaje');
    }
  };

  const handleConsolidateLoads = async () => {
    setConsolidating(true);
    setConsolidationMessage(null);
    setTripError(null);
    try {
      const created = await consolidateLoads();
      setConsolidationMessage(
        created.length
          ? `Se crearon ${created.length} ${created.length === 1 ? 'carga' : 'cargas'} con pedidos pendientes.`
          : 'No hay pedidos pendientes asignables a camiones disponibles.',
      );
      await refreshPlanning();
    } catch (consolidationError) {
      setTripError(consolidationError instanceof Error ? consolidationError.message : 'No se pudieron consolidar los pedidos');
    } finally {
      setConsolidating(false);
    }
  };

  const handleSaveOrder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingOrder(true);
    setTripError(null);
    const input: PedidoInputApi = {
      idCliente: Number(orderForm.idCliente),
      pesoKg: Number(orderForm.pesoKg),
      volumenM3: Number(orderForm.volumenM3),
      ventanaInicio: `${orderForm.ventanaInicio}:00`,
      ventanaFin: `${orderForm.ventanaFin}:00`,
      tipoMercaderia: orderForm.tipoMercaderia,
    };
    try {
      if (editingOrderId === null) {
        await createOrder(input);
      } else {
        await updateOrder(editingOrderId, input);
      }
      setShowOrderForm(false);
      setEditingOrderId(null);
      setOrderForm(EMPTY_ORDER_FORM);
      await refreshPlanning();
    } catch (saveError) {
      setTripError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el pedido');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleEditOrder = (pedido: PedidoApi) => {
    setEditingOrderId(pedido.id);
    setOrderForm({
      idCliente: String(pedido.idCliente),
      pesoKg: pedido.pesoKg,
      volumenM3: pedido.volumenM3,
      ventanaInicio: pedido.ventanaInicio.slice(0, 16),
      ventanaFin: pedido.ventanaFin.slice(0, 16),
      tipoMercaderia: pedido.tipoMercaderia as MercaderiaTipoApi,
    });
    setShowOrderForm(true);
    setTripError(null);
  };

  const handleDeleteOrder = async (pedido: PedidoApi) => {
    if (!window.confirm(`¿Eliminar el pedido PED-${pedido.id}?`)) return;
    setTripError(null);
    try {
      await deleteOrder(pedido.id);
      await refreshPlanning();
    } catch (deleteError) {
      setTripError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el pedido');
    }
  };

  const orderHasActiveLoad = (idPedido: number) => loads.some(
    (carga) => carga.estado !== 'CANCELADA'
      && carga.pedidos.some((pedido) => pedido.id === idPedido),
  );
  const orderHasLoadHistory = (idPedido: number) => loads.some(
    (carga) => carga.pedidos.some((pedido) => pedido.id === idPedido),
  );

  const handleSaveCenter = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingCenter(true);
    setTripError(null);
    try {
      await createDistributionCenter({
        direccion: centerForm.direccion.trim(),
        distanciaKm: Number(centerForm.distanciaKm),
        distanciaMin: Number(centerForm.distanciaMin),
      });
      setCenterForm(EMPTY_CENTER_FORM);
      setShowCenterForm(false);
      await refreshPlanning();
    } catch (saveError) {
      setTripError(saveError instanceof Error ? saveError.message : 'No se pudo crear el centro');
    } finally {
      setSavingCenter(false);
    }
  };

  const handleDeleteCenter = async (centro: CentroDistribucionApi) => {
    if (!window.confirm(`¿Eliminar el centro “${centro.direccion}”?`)) return;
    setTripError(null);
    try {
      await deleteDistributionCenter(centro.id);
      await refreshPlanning();
    } catch (deleteError) {
      setTripError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el centro');
    }
  };

  const handleClearDeliveredHistory = async () => {
    if (!window.confirm('Se eliminarán todos los viajes finalizados y las cargas entregadas. Los pedidos entregados se conservarán. ¿Continuar?')) return;
    setCleaningHistory(true);
    setCleanupMessage(null);
    setTripError(null);
    try {
      const result = await clearDeliveredHistory();
      setCleanupMessage(
        `Historial eliminado: ${result.viajesEliminados} viajes y ${result.cargasEliminadas} cargas.`,
      );
      await refreshPlanning();
    } catch (cleanupError) {
      setTripError(cleanupError instanceof Error ? cleanupError.message : 'No se pudo limpiar el historial');
    } finally {
      setCleaningHistory(false);
    }
  };

  const camionesDisponibles = planning?.camiones.filter((camion) => camion.estadoOperativo === 'DISPONIBLE') ?? [];
  const conductoresDisponibles = planning?.conductores.filter((conductor) => conductor.habilitado && !conductor.enViaje) ?? [];
  const cargasCompatibles = planning?.cargas.filter((carga) => !carga.idCamion || carga.idCamion === Number(tripForm.idCamion)) ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Map color="var(--accent-primary)" /> Pedidos y Viajes
          </h1>
          <p className="text-muted">
            Planificación logística, consolidación de pedidos en cargas y control de restricciones de compatibilidad
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => { setSubTab('viajes'); setShowTripForm(true); setTripError(null); }}>
          <Plus size={16} /> Registrar viaje
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {([
          ['cargas', `Cargas consolidadas (${loads.length})`],
          ['pedidos', `Pedidos individuales (${orders.filter((pedido) => pedido.estado !== 'ENTREGADO').length})`],
          ['rutas', `Centros de distribución (${centers.length})`],
          ['viajes', `Viajes (${planning?.viajes.length ?? 0})`],
        ] as const).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className="btn"
            onClick={() => setSubTab(tab)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: subTab === tab ? 'var(--accent-glow)' : 'transparent',
              color: subTab === tab ? 'white' : 'var(--text-secondary)',
              border: subTab === tab ? '1px solid var(--accent-primary)' : '1px solid transparent',
              fontWeight: subTab === tab ? 600 : 400,
            }}
          >
            {tab === 'cargas' ? <Package size={16} /> : tab === 'pedidos' ? <Box size={16} /> : tab === 'rutas' ? <Navigation size={16} /> : <Map size={16} />}
            {label}
          </button>
        ))}
      </div>

      {tripError && <div role="alert" className="glass-panel" style={{ padding: '0.85rem 1rem', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>{tripError}</div>}
      {cleanupMessage && <p role="status" className="text-muted">{cleanupMessage}</p>}
      {loadingTrips && <p className="text-muted">Cargando conductores, camiones, cargas y viajes…</p>}

      {subTab === 'viajes' && (
        <>
          {showTripForm && (
            <form onSubmit={handleCreateTrip} className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <strong style={{ gridColumn: '1 / -1' }}>Asignar conductor, camión y carga</strong>
              <label>Conductor habilitado<select required value={tripForm.idConductor} onChange={(event) => setTripForm({ ...tripForm, idConductor: event.target.value })}><option value="">Seleccionar conductor</option>{conductoresDisponibles.map((conductor) => <option key={conductor.id} value={conductor.id}>{conductor.nombres} {conductor.apellidos}</option>)}</select></label>
              <label>Camión disponible<select required value={tripForm.idCamion} onChange={(event) => setTripForm({ ...tripForm, idCamion: event.target.value, idCarga: '' })}><option value="">Seleccionar camión</option>{camionesDisponibles.map((camion) => <option key={camion.id} value={camion.id}>{camion.patente}</option>)}</select></label>
              <label>Carga creada<select required value={tripForm.idCarga} onChange={(event) => setTripForm({ ...tripForm, idCarga: event.target.value })}><option value="">Seleccionar carga</option>{cargasCompatibles.map((carga) => <option key={carga.id} value={carga.id}>CRG-{carga.id} · {carga.pedidos.length} pedidos</option>)}</select></label>
              <label>Salida<input required type="datetime-local" value={tripForm.fechaInicio} onChange={(event) => setTripForm({ ...tripForm, fechaInicio: event.target.value })} /></label>
              <label>Regreso estimado<input required type="datetime-local" value={tripForm.fechaFin} onChange={(event) => setTripForm({ ...tripForm, fechaFin: event.target.value })} /></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}><button type="submit" className="btn btn-primary" disabled={savingTrip}>{savingTrip ? 'Asignando…' : 'Iniciar viaje'}</button><button type="button" className="btn btn-secondary" onClick={() => setShowTripForm(false)}>Cancelar</button></div>
              {planning && (!conductoresDisponibles.length || !camionesDisponibles.length || !cargasCompatibles.length) && <p className="text-muted" style={{ gridColumn: '1 / -1' }}>Se requiere al menos un conductor habilitado, un camión disponible y una carga creada compatible.</p>}
            </form>
          )}

          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0 }}>Viajes</h2>
              <button type="button" className="btn btn-secondary" onClick={() => void handleClearDeliveredHistory()} disabled={cleaningHistory || loadingTrips}>
                <Trash2 size={16} /> {cleaningHistory ? 'Limpiando…' : 'Limpiar historial entregado'}
              </button>
            </div>
            <div className="table-container"><table>
              <thead><tr><th>Viaje</th><th>Conductor</th><th>Camión</th><th>Carga</th><th>Salida</th><th>Regreso</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {planning?.viajes.map((viaje) => (
                  <tr key={viaje.id}>
                    <td>VIA-{viaje.id}</td><td>{viaje.nombreConductor}</td><td>{viaje.patenteCamion}</td><td>CRG-{viaje.idCarga}</td>
                    <td>{viaje.fechaInicio.replace('T', ' ').slice(0, 16)}</td><td>{viaje.fechaFin.replace('T', ' ').slice(0, 16)}</td>
                    <td><span className={`badge ${viaje.estado === 'EN_RUTA' ? 'badge-warning' : viaje.estado === 'FINALIZADO' ? 'badge-success' : 'badge-neutral'}`}>{viaje.estado === 'EN_RUTA' ? 'En tránsito' : viaje.estado === 'FINALIZADO' ? 'Finalizado' : 'Cancelado'}</span></td>
                    <td>{viaje.estado === 'EN_RUTA' && <div style={{ display: 'flex', gap: '0.4rem' }}><button type="button" className="btn btn-primary" onClick={() => void handleCloseTrip(viaje, 'FINALIZADO')}>Finalizar</button><button type="button" className="btn btn-secondary" onClick={() => void handleCloseTrip(viaje, 'CANCELADO')}>Cancelar</button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
            {!loadingTrips && !planning?.viajes.length && <p className="text-muted">No hay viajes registrados.</p>}
          </div>
        </>
      )}

      {/* Cargas Table */}
      {subTab === 'cargas' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Cargas registradas</h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-primary" onClick={() => void handleConsolidateLoads()} disabled={consolidating || loadingTrips}>
                <PackagePlus size={16} /> {consolidating ? 'Consolidando…' : 'Consolidar pedidos pendientes'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => void handleClearDeliveredHistory()} disabled={cleaningHistory || loadingTrips}>
                <Trash2 size={16} /> {cleaningHistory ? 'Limpiando…' : 'Limpiar historial entregado'}
              </button>
            </div>
          </div>
          {consolidationMessage && <p role="status" className="text-muted">{consolidationMessage}</p>}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código Carga</th>
                  <th>Centro</th>
                  <th>Camión</th>
                  <th>Pedidos Incluidos</th>
                  <th>Peso Total</th>
                  <th>Volumen</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {loads.map((carga) => {
                  const pesoTotal = carga.pedidos.reduce((total, pedido) => total + Number(pedido.pesoKg), 0);
                  const volumenTotal = carga.pedidos.reduce((total, pedido) => total + Number(pedido.volumenM3), 0);
                  return (
                  <tr key={carga.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Package size={16} color="var(--accent-secondary)" />
                        CRG-{carga.id}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>ID: {carga.id}</div>
                    </td>
                    <td>Centro #{carga.idCentro}</td>
                    <td>{carga.idCamion ? `Camión #${carga.idCamion}` : 'Sin asignar'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {carga.pedidos.map((pedido) => (
                          <span
                            key={pedido.id}
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
                            <span><strong>PED-{pedido.id}</strong> · Cliente #{pedido.idCliente}</span>
                            <span style={{
                              fontSize: '0.7rem',
                              color: pedido.tipoMercaderia === 'PELIGROSA' ? 'var(--status-error)' : pedido.tipoMercaderia === 'REFRIGERADA' ? 'var(--accent-secondary)' : 'var(--text-secondary)'
                            }}>
                              {pedido.tipoMercaderia}
                            </span>
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Weight size={14} color="var(--text-secondary)" />
                        {pesoTotal.toLocaleString('es-CL')} kg
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Box size={14} color="var(--text-secondary)" />
                        {volumenTotal.toLocaleString('es-CL')} m³
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${carga.estado === 'CREADO' ? 'badge-warning' : carga.estado === 'ENTREGADA' ? 'badge-success' : 'badge-neutral'}`}>
                        {carga.estado}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!loadingTrips && !loads.length && <p className="text-muted">No hay cargas registradas.</p>}
        </div>
      )}

      {/* Pedidos Table */}
      {subTab === 'pedidos' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Pedidos individuales</h2>
            <button type="button" className="btn btn-primary" onClick={() => { setEditingOrderId(null); setOrderForm(EMPTY_ORDER_FORM); setShowOrderForm((visible) => !visible); setTripError(null); }}>
              <Plus size={16} /> Nuevo pedido
            </button>
          </div>
          {showOrderForm && (
            <form onSubmit={handleSaveOrder} className="glass-panel" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end', marginBottom: '1rem' }}>
              <strong style={{ gridColumn: '1 / -1' }}>{editingOrderId === null ? 'Crear pedido' : `Editar PED-${editingOrderId}`}</strong>
              <label>Cliente<select required value={orderForm.idCliente} onChange={(event) => setOrderForm({ ...orderForm, idCliente: event.target.value })}><option value="">Seleccionar cliente</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.razon}</option>)}</select></label>
              <label>Peso (kg)<input required type="number" min="0.01" step="0.01" value={orderForm.pesoKg} onChange={(event) => setOrderForm({ ...orderForm, pesoKg: event.target.value })} /></label>
              <label>Volumen (m³)<input required type="number" min="0.01" step="0.01" value={orderForm.volumenM3} onChange={(event) => setOrderForm({ ...orderForm, volumenM3: event.target.value })} /></label>
              <label>Inicio de ventana<input required type="datetime-local" value={orderForm.ventanaInicio} onChange={(event) => setOrderForm({ ...orderForm, ventanaInicio: event.target.value })} /></label>
              <label>Fin de ventana<input required type="datetime-local" value={orderForm.ventanaFin} onChange={(event) => setOrderForm({ ...orderForm, ventanaFin: event.target.value })} /></label>
              <label>Mercadería<select value={orderForm.tipoMercaderia} onChange={(event) => setOrderForm({ ...orderForm, tipoMercaderia: event.target.value as MercaderiaTipoApi })}><option value="GENERAL">General</option><option value="REFRIGERADA">Refrigerada</option><option value="PELIGROSA">Peligrosa</option><option value="FRAGIL">Frágil</option></select></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingOrder || !clients.length}>{savingOrder ? 'Guardando…' : 'Guardar pedido'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowOrderForm(false); setEditingOrderId(null); }}>Cancelar</button>
              </div>
              {!clients.length && <p className="text-muted" style={{ gridColumn: '1 / -1' }}>Registra un cliente antes de crear pedidos.</p>}
            </form>
          )}
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
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter((pedido) => pedido.estado !== 'ENTREGADO').map((pedido) => (
                  <tr key={pedido.id}>
                    <td style={{ fontWeight: 600 }}>PED-{pedido.id}</td>
                    <td>Cliente #{pedido.idCliente}</td>
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
                    <td style={{ fontWeight: 500 }}>{Number(pedido.pesoKg).toLocaleString('es-CL')} kg</td>
                    <td>{Number(pedido.volumenM3).toLocaleString('es-CL')} m³</td>
                    <td>
                      <div style={{ fontSize: '0.8125rem' }}>{pedido.ventanaInicio.replace('T', ' ').slice(0, 16)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>hasta {pedido.ventanaFin.replace('T', ' ').slice(0, 16)}</div>
                    </td>
                    <td>
                      <span className={`badge ${pedido.estado === 'EN_ESPERA' ? 'badge-warning' : pedido.estado === 'TRANSITO' ? 'badge-neutral' : 'badge-error'}`}>
                        {pedido.estado === 'EN_ESPERA' ? 'En espera' : pedido.estado === 'TRANSITO' ? 'En tránsito' : 'Cancelado'}
                      </span>
                    </td>
                    <td>
                      {pedido.estado === 'EN_ESPERA' && !orderHasActiveLoad(pedido.id) ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button type="button" className="btn btn-secondary" title="Editar pedido" aria-label={`Editar pedido PED-${pedido.id}`} onClick={() => handleEditOrder(pedido)}><Pencil size={15} /></button>
                          {!orderHasLoadHistory(pedido.id) && <button type="button" className="btn btn-secondary" title="Eliminar pedido" aria-label={`Eliminar pedido PED-${pedido.id}`} onClick={() => void handleDeleteOrder(pedido)}><Trash2 size={15} /></button>}
                        </div>
                      ) : <span className="text-muted">{pedido.estado === 'EN_ESPERA' ? 'Asignado a carga' : 'No editable'}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loadingTrips && !orders.some((pedido) => pedido.estado !== 'ENTREGADO') && (
            <p className="text-muted">No hay pedidos pendientes de entrega.</p>
          )}
        </div>
      )}

      {/* Rutas y Centros */}
      {subTab === 'rutas' && (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Centros de distribución</h2>
            <button type="button" className="btn btn-primary" onClick={() => { setShowCenterForm((visible) => !visible); setTripError(null); }}>
              <Plus size={16} /> Añadir centro
            </button>
          </div>
          {showCenterForm && (
            <form onSubmit={handleSaveCenter} className="glass-panel" style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end', marginBottom: '1rem' }}>
              <strong style={{ gridColumn: '1 / -1' }}>Nuevo centro de distribución</strong>
              <label>Dirección<input required value={centerForm.direccion} onChange={(event) => setCenterForm({ ...centerForm, direccion: event.target.value })} /></label>
              <label>Distancia (km)<input required type="number" min="0" step="0.01" value={centerForm.distanciaKm} onChange={(event) => setCenterForm({ ...centerForm, distanciaKm: event.target.value })} /></label>
              <label>Tiempo estimado (min)<input required type="number" min="0" step="1" value={centerForm.distanciaMin} onChange={(event) => setCenterForm({ ...centerForm, distanciaMin: event.target.value })} /></label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" disabled={savingCenter}>{savingCenter ? 'Guardando…' : 'Guardar centro'}</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCenterForm(false)}>Cancelar</button>
              </div>
            </form>
          )}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Centro de Distribución</th>
                  <th>Distancia desde Base (Coquimbo)</th>
                  <th>Tiempo Estimado</th>
                  <th>Tipo de Ruta</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {centers.map((centro) => (
                  <tr key={centro.id}>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Building2 size={16} color="var(--accent-primary)" />
                        {centro.direccion}
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{Number(centro.distanciaKm).toLocaleString('es-CL')} km</td>
                    <td>{centro.distanciaMin === 0 ? 'Base central' : `${Math.floor(centro.distanciaMin / 60)}h ${centro.distanciaMin % 60}m`}</td>
                    <td>
                      <span className="badge badge-neutral">
                        {Number(centro.distanciaKm) > 500 ? 'Larga distancia' : Number(centro.distanciaKm) > 0 ? 'Interregional' : 'Base central'}
                      </span>
                    </td>
                    <td><button type="button" className="btn btn-secondary" title="Eliminar centro" aria-label={`Eliminar centro ${centro.direccion}`} onClick={() => void handleDeleteCenter(centro)}><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loadingTrips && !centers.length && <p className="text-muted">No hay centros de distribución registrados.</p>}
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
