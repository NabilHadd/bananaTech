export const formatDashboardNumber = (value: string | number) =>
  new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(Number(value));

export const formatDashboardDate = (value: string) =>
  new Date(value).toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });