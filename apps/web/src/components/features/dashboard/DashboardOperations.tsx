import { AlertTriangle, Clock3, PackageSearch, Truck } from 'lucide-react';
import type { DashboardData } from '../../../api/dashboard.api';
import { formatDashboardDate, formatDashboardNumber } from './dashboard.constants';

export function DashboardOperations({ data }: { data: DashboardData }) {
  return (
    <div className="dashboard-panels">
      <section className="dashboard-panel">
        <div className="dashboard-panel-title"><div><Truck size={17} /><h2>Viajes en curso</h2></div><span>{data.viajesEnCurso.length}</span></div>
        {data.viajesEnCurso.length ? <div className="dashboard-list">{data.viajesEnCurso.map((trip) => <article className="dashboard-list-row" key={trip.id}>
          <span className="dashboard-id">V-{String(trip.id).padStart(4, '0')}</span><div><strong>{trip.patente}</strong><small>{trip.conductor} · {trip.destino}</small></div><time>{formatDashboardDate(trip.fechaInicio)}</time>
        </article>)}</div> : <div className="dashboard-empty">No hay viajes en ruta.</div>}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel-title"><div><PackageSearch size={17} /><h2>Pedidos por planificar</h2></div><span>{data.pedidosSinPlanificar.length}</span></div>
        {data.pedidosSinPlanificar.length ? <div className="dashboard-list">{data.pedidosSinPlanificar.slice(0, 8).map((order) => <article className="dashboard-list-row" key={order.id}>
          <span className="dashboard-id">P-{String(order.id).padStart(4, '0')}</span><div><strong>{formatDashboardNumber(order.pesoKg)} kg</strong><small>Ventana hasta {formatDashboardDate(order.ventanaFin)}</small></div><Clock3 size={15} className="dashboard-row-icon" />
        </article>)}</div> : <div className="dashboard-empty">Todos los pedidos creados están planificados.</div>}
      </section>

      <section className="dashboard-panel dashboard-panel-alerts">
        <div className="dashboard-panel-title"><div><AlertTriangle size={17} /><h2>Documentos por vencer</h2></div><span>{data.documentosPorVencer.length}</span></div>
        {data.documentosPorVencer.length ? <div className="dashboard-list">{data.documentosPorVencer.map((document) => <article className={`dashboard-list-row document-alert${document.diasRestantes < 0 ? ' is-expired' : ''}`} key={document.id}>
          <span className="document-alert-mark" /><div><strong>{document.patente} · {document.tipo}</strong><small>{document.diasRestantes < 0 ? `Vencido hace ${Math.abs(document.diasRestantes)} días` : document.diasRestantes === 0 ? 'Vence hoy' : `Vence en ${document.diasRestantes} días`}</small></div><time>{new Date(document.fechaVencimiento).toLocaleDateString('es-CL')}</time>
        </article>)}</div> : <div className="dashboard-empty">Sin vencimientos en los próximos 30 días.</div>}
      </section>
    </div>
  );
}