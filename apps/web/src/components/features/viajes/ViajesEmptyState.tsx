import { FilterX, LoaderCircle, Navigation, Plus, WifiOff } from 'lucide-react';
import { EmptyState } from '../../common/EmptyState';
import { Button } from '../../ui/Button';
import type { ViajeEstado } from '../flota/types';

interface ViajesEmptyStateProps {
  error: string | null;
  loading: boolean;
  estado: ViajeEstado | '';
  onRetry: () => void;
  onClearFilter: () => void;
  onCreate: () => void;
}

export function ViajesEmptyState({ error, loading, estado, onRetry, onClearFilter, onCreate }: ViajesEmptyStateProps) {
  if (error) return <EmptyState icon={<WifiOff size={36} />} title="No se pudo cargar los viajes" description={error} action={<Button onClick={onRetry}>Reintentar</Button>} />;
  if (loading) return <EmptyState icon={<LoaderCircle size={36} />} title="Cargando viajes..." />;
  if (estado) return <EmptyState icon={<FilterX size={36} />} title="Ningún viaje está en ese estado" action={<Button onClick={onClearFilter}>Ver todos</Button>} />;
  return <EmptyState
    icon={<Navigation size={36} />}
    title="Aún no hay viajes"
    description="Genere un viaje para una carga Confirmada: el sistema propone camión y conductor, o puede elegirlos usted."
    action={<Button variant="primary" icon={<Plus size={16} />} onClick={onCreate}>Generar viaje</Button>}
  />;
}