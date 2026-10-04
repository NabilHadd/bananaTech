import { useEffect, useState } from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { getReporteCostos, type ReporteCostos } from '../api/reporte-costos.api';
import { PageHeader } from '../components/common/PageHeader';
import { ReporteCostosSummary } from '../components/features/reporte-costos/ReporteCostosSummary';
import { ReporteCostosTable } from '../components/features/reporte-costos/ReporteCostosTable';

export function ReporteCostosPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<ReporteCostos | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    getReporteCostos(year, month).then((value) => { if (active) { setReport(value); setError(''); } })
      .catch((cause) => active && setError(cause.message));
    return () => { active = false; };
  }, [year, month]);

  return <div className="page-view-enter stack-lg admin-page">
    <PageHeader title="Reporte de costos" icon={<ChartNoAxesCombined size={22} />} description="Resultado mensual de los viajes registrados."
      actions={<div className="month-select"><label>Mes<select value={month} onChange={(event) => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{new Date(2020, index).toLocaleDateString('es-CL', { month: 'long' })}</option>)}</select></label><label>Año<input type="number" min="2000" max="2200" value={year} onChange={(event) => setYear(Number(event.target.value))} /></label></div>}
    />
    {error && <p className="form-error" role="alert">{error}</p>}
    {report && <>
      <ReporteCostosSummary report={report} />
      <ReporteCostosTable report={report} />
    </>}
  </div>;
}