import React, { useEffect, useState } from 'react';
import { AlertCircle, Boxes, LoaderCircle, MapPin, PackageX, Plus } from 'lucide-react';
import { getPedidosLibres } from '../../../api/carga.api';
import { EmptyState } from '../../common/EmptyState';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import type { Pedido } from '../pedidos/types';
import { PedidosSeleccionables } from './PedidosSeleccionables';
import { ResumenSeleccion } from './ResumenSeleccion';

interface CargaFormModalProps {
  onSubmit: (idPedidos: number[]) => Promise<void>;
  onClose: () => void;
}

/** Creación de una carga: se elige el destino y luego sus pedidos libres (HU4.1). */
export const CargaFormModal: React.FC<CargaFormModalProps> = ({ onSubmit, onClose }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [idCentro, setIdCentro] = useState('');
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const control = new AbortController();
    getPedidosLibres(control.signal)
      .then(setPedidos)
      .catch((e) => !control.signal.aborted && setErrorLocal(e instanceof Error ? e.message : 'Error al cargar pedidos'))
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, []);

  // Destinos con pedidos libres: una carga va a un solo centro de distribución.
  const destinos = [...new Map(pedidos.map((p) => [p.idCentro, p.centro?.direccion ?? `Centro #${p.idCentro}`]))];
  const delDestino = pedidos.filter((p) => String(p.idCentro) === idCentro);

  const elegirDestino = (valor: string) => {
    setIdCentro(valor);
    setSeleccion([]);
    setErrorLocal(null);
  };

  const alternar = (id: number) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async () => {
    setErrorLocal(null);
    setGuardando(true);
    try {
      await onSubmit(seleccion);
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : 'Error al crear la carga');
      setGuardando(false);
    }
  };

  return (
    <Modal
      title="Nueva carga"
      subtitle="Una carga agrupa pedidos que van al mismo centro de distribución"
      icon={<Boxes color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="720px"
      footer={
        <>
          <ResumenSeleccion seleccionados={delDestino.filter((p) => seleccion.includes(p.id))} />
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={handleSubmit}
            disabled={guardando || seleccion.length === 0}
          >
            Crear carga
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {errorLocal && (
          <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorLocal}</span>
          </div>
        )}

        {cargando ? (
          <EmptyState icon={<LoaderCircle size={36} />} title="Buscando pedidos libres..." />
        ) : pedidos.length === 0 ? (
          <EmptyState
            icon={<PackageX size={36} />}
            title="No hay pedidos libres"
            description="Todos los pedidos Creada ya están en una carga."
          />
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>1. Destino</span>
              <Select
                value={idCentro}
                options={[
                  { value: '', label: 'Elegir centro de distribución' },
                  ...destinos.map(([id, direccion]) => {
                    const n = pedidos.filter((p) => p.idCentro === id).length;
                    return { value: String(id), label: direccion, sublabel: `${n} pedido${n === 1 ? '' : 's'} libre${n === 1 ? '' : 's'}` };
                  }),
                ]}
                onChange={elegirDestino}
                minWidth="320px"
              />
            </div>

            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.6rem' }}>2. Pedidos</div>
              {idCentro ? (
                <PedidosSeleccionables pedidos={delDestino} seleccion={seleccion} onToggle={alternar} />
              ) : (
                <div className="callout" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <MapPin size={15} style={{ flexShrink: 0 }} /> Elija un destino para ver los pedidos que puede agrupar.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
