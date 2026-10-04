import type { ReporteCostos } from '../../../api/reporte-costos.api';
import { formatCurrency } from './reporteCostos.constants';

export function ReporteCostosSummary({ report }: { report: ReporteCostos }) {
  return (
    <div className="report-metrics">
      <div><small>INGRESOS</small><strong>{formatCurrency(report.ingresosClp)}</strong></div>
      <div><small>COSTOS TOTALES</small><strong>{formatCurrency(report.costosTotalesClp)}</strong></div>
      <div><small>MARGEN</small><strong className={Number(report.margenClp) < 0 ? 'negative-value' : ''}>{formatCurrency(report.margenClp)}</strong></div>
      <div><small>VIAJES</small><strong>{report.cantidadViajes}</strong></div>
    </div>
  );
}