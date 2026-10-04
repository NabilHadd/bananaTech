import { useEffect, useState } from 'react';
import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { getDashboard, type DashboardData } from '../api/dashboard.api';
import { PageHeader } from '../components/common/PageHeader';
import { DashboardIndicators } from '../components/features/dashboard/DashboardIndicators';
import { DashboardOperations } from '../components/features/dashboard/DashboardOperations';
import { formatDashboardDate } from '../components/features/dashboard/dashboard.constants';

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getDashboard(controller.signal)
      .then((current) => { setData(current); setError(''); })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'No se pudo cargar el dashboard.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const refresh = () => {
    setLoading(true);
    setRevision((current) => current + 1);
  };

  return <div className="page-view-enter stack-lg dashboard-page">
    <PageHeader
      className="dashboard-header"
      eyebrow="OPERACIONES · RESUMEN EN VIVO"
      title="Dashboard"
      icon={<LayoutDashboard size={22} />}
      description="Estado actual de viajes, pedidos, flota y documentos."
      actions={<div className="dashboard-refresh">
        {data && <span>Actualizado {formatDashboardDate(data.actualizadoEn)}</span>}
        <button className="btn btn-secondary" type="button" onClick={refresh} disabled={loading} title="Actualizar indicadores">
          <RefreshCw size={15} className={loading ? 'dashboard-spin' : ''} />Actualizar
        </button>
      </div>}
    />
    {error && <div className="dashboard-error" role="alert">{error}</div>}
    {!data && loading && <div className="dashboard-loading">Cargando estado de la operación…</div>}
    {data && <>
      <DashboardIndicators data={data} />
      <DashboardOperations data={data} />
    </>}
  </div>;
}