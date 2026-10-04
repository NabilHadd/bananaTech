import { FileSpreadsheet } from 'lucide-react';
import type { ReporteCostos } from '../../../api/reporte-costos.api';
import { formatCurrency } from './reporteCostos.constants';

export function ReporteCostosTable({ report }: { report: ReporteCostos }) {
  return (
    <section className="admin-section">
      <div className="admin-section-heading"><h2><FileSpreadsheet size={18} /> Detalle de viajes</h2><span>{report.cantidadViajes} viajes</span></div>
      <div className="glass-panel table-container"><table><thead><tr><th>Viaje</th><th>Inicio</th><th>Estado</th><th>Ingresos</th><th>Diésel</th><th>Peajes</th><th>Desgaste</th><th>Viáticos</th><th>Margen</th></tr></thead>
        <tbody>{report.viajes.map((trip) => <tr key={trip.id}><td>#{trip.id}</td><td>{new Date(trip.fechaInicio).toLocaleDateString('es-CL')}</td><td>{trip.estado}</td><td>{formatCurrency(trip.ingresosClp)}</td><td>{formatCurrency(trip.dieselClp)}</td><td>{formatCurrency(trip.peajesClp)}</td><td>{formatCurrency(trip.operacionClp)}</td><td>{formatCurrency(trip.viaticosClp)}</td><td>{formatCurrency(trip.margenClp)}</td></tr>)}</tbody>
        <tfoot><tr><th colSpan={3}>Total mensual</th><th>{formatCurrency(report.ingresosClp)}</th><th>{formatCurrency(report.dieselClp)}</th><th>{formatCurrency(report.peajesClp)}</th><th>{formatCurrency(report.operacionClp)}</th><th>{formatCurrency(report.viaticosClp)}</th><th>{formatCurrency(report.margenClp)}</th></tr></tfoot>
      </table></div>
    </section>
  );
}