import React, { useEffect, useState } from 'react';
import { AlertCircle, LoaderCircle, PackagePlus, PackageX } from 'lucide-react';
import { getPedidosLibres } from '../../../api/carga.api';
import { EmptyState } from '../../common/EmptyState';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import type { Pedido } from '../pedidos/types';
import { codigoCarga } from './cargas.constants';
import { PedidosSeleccionables } from './PedidosSeleccionables';
import { ResumenSeleccion } from './ResumenSeleccion';
import type { Carga } from './types';

interface AgregarPedidosModalProps {
  carga: Carga;
  onSubmit: (idPedidos: number[]) => Promise<void>;
  onClose: () => void;
}

/** Elegir pedidos libres con el mismo destino y sumarlos de una vez a la carga (HU4.3). */
export const AgregarPedidosModal: React.FC<AgregarPedidosModalProps> = ({ carga, onSubmit, onClose }) => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  useEffect(() => {
    const control = new AbortController();
    getPedidosLibres(control.signal)
      .then((data) => setPedidos(data.filter((p) => p.idCentro === carga.idCentro)))
      .catch((e) => !control.signal.aborted && setErrorLocal(e instanceof Error ? e.message : 'Error al cargar pedidos'))
      .finally(() => !control.signal.aborted && setCargando(false));
    return () => control.abort();
  }, [carga.idCentro]);

  const alternar = (id: number) =>
    setSeleccion((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async () => {
    setErrorLocal(null);
    setGuardando(true);
    try {
      await onSubmit(seleccion);
    } catch (e) {
      setErrorLocal(e instanceof Error ? e.message : 'Error al agregar los pedidos');
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={`Agregar pedidos a ${codigoCarga(carga.id)}`}
      subtitle={`Pedidos libres con destino ${carga.centro?.direccion ?? `centro #${carga.idCentro}`}`}
      icon={<PackagePlus color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="720px"
      footer={
        <>
          <ResumenSeleccion
            seleccionados={pedidos.filter((p) => seleccion.includes(p.id))}
            base={{ pesoKg: carga.pesoTotalKg, volumenM3: carga.volumenTotalM3 }}
          />
          <Button onClick={onClose}>Volver</Button>
          <Button
            variant="primary"
            icon={<PackagePlus size={16} />}
            onClick={handleSubmit}
            disabled={guardando || seleccion.length === 0}
          >
            {seleccion.length > 1 ? `Agregar ${seleccion.length} pedidos` : 'Agregar pedido'}
          </Button>
        </>
      }
    >
      {errorLocal && (
        <div className="callout callout-error" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorLocal}</span>
        </div>
      )}
      {cargando ? (
        <EmptyState icon={<LoaderCircle size={36} />} title="Buscando pedidos libres..." />
      ) : pedidos.length === 0 ? (
        <EmptyState
          icon={<PackageX size={36} />}
          title="No hay pedidos libres con este destino"
          description="Los pedidos Creada de este centro ya están en otras cargas."
        />
      ) : (
        <PedidosSeleccionables pedidos={pedidos} seleccion={seleccion} onToggle={alternar} />
      )}
    </Modal>
  );
};
