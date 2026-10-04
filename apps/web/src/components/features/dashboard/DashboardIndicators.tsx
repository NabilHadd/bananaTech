import { AlertTriangle, Gauge, PackageSearch, Truck } from 'lucide-react';
import type { DashboardData } from '../../../api/dashboard.api';
import { formatDashboardNumber } from './dashboard.constants';

export function DashboardIndicators({ data }: { data: DashboardData }) {
  return (
    <section className="dashboard-kpis" aria-label="Indicadores generales">
      <article className="dashboard-kpi dashboard-kpi-trips">
        <div className="dashboard-kpi-label"><Truck size={16} /> Viajes en curso</div>
        <strong>{data.viajesEnCurso.length}</strong>
        <span>{data.camionesEnRuta} camiones en ruta</span>
      </article>
      <article className="dashboard-kpi dashboard-kpi-orders">
        <div className="dashboard-kpi-label"><PackageSearch size={16} /> Pedidos sin planificar</div>
        <strong>{data.pedidosSinPlanificar.length}</strong>
        <span>Pedidos creados sin carga activa</span>
      </article>
      <article className="dashboard-kpi dashboard-kpi-occupancy">
        <div className="dashboard-kpi-label"><Gauge size={16} /> Ocupación por peso</div>
        <strong>{formatDashboardNumber(data.ocupacionFlotaPct)}<small>%</small></strong>
        <span>{formatDashboardNumber(data.pesoEnRutaKg)} kg de {formatDashboardNumber(data.capacidadFlotaKg)} kg activos</span>
        <div className="dashboard-meter"><i style={{ width: `${Math.min(100, Number(data.ocupacionFlotaPct))}%` }} /></div>
      </article>
      <article className={`dashboard-kpi dashboard-kpi-docs${data.documentosPorVencer.length ? ' has-alert' : ''}`}>
        <div className="dashboard-kpi-label"><AlertTriangle size={16} /> Alertas documentales</div>
        <strong>{data.documentosPorVencer.length}</strong>
        <span>{data.camionesActivos} camiones activos · vence en 30 días</span>
      </article>
    </section>
  );
}