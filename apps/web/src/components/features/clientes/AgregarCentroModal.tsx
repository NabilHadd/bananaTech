import React, { useEffect, useState } from 'react';
import { Check, LoaderCircle, MapPin, Plus, Search } from 'lucide-react';
import { getCentrosDistribucion } from '../../../api/cliente.api';
import { Modal } from '../../common/Modal';
import { Button } from '../../ui/Button';
import { Field } from '../../ui/Field';
import { Tabs } from '../../ui/Tabs';
import type { CentroDistribucion } from './types';

export interface CentroItem {
  id?: number;
  direccion: string;
  distanciaKm: number;
  distanciaMin: number;
}

interface AgregarCentroModalProps {
  /** Centros que ya están en el formulario del cliente para excluirlos */
  centrosActuales: CentroItem[];
  onAgregar: (centro: CentroItem) => void;
  onClose: () => void;
}

type TabModo = 'existente' | 'nuevo';

export const AgregarCentroModal: React.FC<AgregarCentroModalProps> = ({
  centrosActuales,
  onAgregar,
  onClose,
}) => {
  const [tab, setTab] = useState<TabModo>('existente');

  // Estado para asociar existente
  const [centrosDisponibles, setCentrosDisponibles] = useState<CentroDistribucion[]>([]);
  const [cargandoCentros, setCargandoCentros] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionadoId, setSeleccionadoId] = useState<number | null>(null);

  // Estado para crear nuevo
  const [direccionNueva, setDireccionNueva] = useState('');
  const [distanciaKmNueva, setDistanciaKmNueva] = useState('');
  const [distanciaMinNueva, setDistanciaMinNueva] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);

  // Cargar centros del backend
  useEffect(() => {
    let cancelado = false;
    getCentrosDistribucion()
      .then((data: CentroDistribucion[]) => {
        if (!cancelado) {
          setCentrosDisponibles(data);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setCentrosDisponibles([]);
        }
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoCentros(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  // Filtrar centros que ya están asociados al cliente
  const idsYaAsociados = new Set(
    centrosActuales
      .filter((c) => c.id !== undefined)
      .map((c) => c.id as number)
  );

  const direccionesYaAsociadas = new Set(
    centrosActuales.map((c) => c.direccion.trim().toLowerCase())
  );

  const centrosFiltrados = centrosDisponibles.filter((c) => {
    if (idsYaAsociados.has(c.id)) return false;
    if (direccionesYaAsociadas.has(c.direccion.trim().toLowerCase())) return false;
    if (busqueda.trim()) {
      return c.direccion.toLowerCase().includes(busqueda.trim().toLowerCase());
    }
    return true;
  });

  const handleAsociarExistente = () => {
    if (!seleccionadoId) return;
    const centro = centrosDisponibles.find((c) => c.id === seleccionadoId);
    if (!centro) return;
    onAgregar({
      id: centro.id,
      direccion: centro.direccion,
      distanciaKm: centro.distanciaKm,
      distanciaMin: centro.distanciaMin,
    });
    onClose();
  };

  const handleCrearNuevo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorLocal(null);

    const dir = direccionNueva.trim();
    if (!dir) {
      setErrorLocal('La dirección del centro es obligatoria');
      return;
    }

    if (direccionesYaAsociadas.has(dir.toLowerCase())) {
      setErrorLocal('Ya ha agregado un centro con esta misma dirección');
      return;
    }

    const kmStr = distanciaKmNueva.trim();
    if (kmStr === '') {
      setErrorLocal('La distancia en km es obligatoria');
      return;
    }
    const km = Number(kmStr);
    if (isNaN(km) || km <= 0) {
      setErrorLocal('La distancia debe ser mayor que 0 km: la base es el origen de los viajes, no un destino');
      return;
    }

    const minStr = distanciaMinNueva.trim();
    if (minStr === '') {
      setErrorLocal('El tiempo de viaje estimado en minutos es obligatorio');
      return;
    }
    const min = Number(minStr);
    if (isNaN(min) || min <= 0) {
      setErrorLocal('El tiempo de viaje debe ser mayor que 0 minutos');
      return;
    }

    onAgregar({
      direccion: dir,
      distanciaKm: km,
      distanciaMin: Math.round(min),
    });
    onClose();
  };

  return (
    <Modal
      title="Agregar Centro de Distribución"
      subtitle="Relación N:N: Asocie un centro existente o registre uno nuevo"
      icon={<MapPin color="var(--accent-primary)" size={22} />}
      onClose={onClose}
      maxWidth="520px"
      zIndex={100050}
      header={
        <div style={{ padding: '0 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <Tabs<TabModo>
            items={[
              { id: 'existente', label: 'Asociar existente', icon: <Search size={15} /> },
              { id: 'nuevo', label: 'Crear nuevo centro', icon: <Plus size={15} /> },
            ]}
            active={tab}
            onChange={(next: TabModo) => {
              setErrorLocal(null);
              setTab(next);
            }}
          />
        </div>
      }
    >
      {tab === 'existente' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <input
              className="form-control"
              placeholder="Buscar por dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              paddingRight: '0.25rem',
            }}
          >
            {cargandoCentros ? (
              <div className="loading-state" style={{ padding: '1.5rem 0' }}>
                <LoaderCircle className="spin" size={20} />
                <span>Cargando centros existentes...</span>
              </div>
            ) : centrosFiltrados.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem 1rem',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.875rem',
                }}
              >
                {centrosDisponibles.length === 0
                  ? 'No hay otros centros registrados en el sistema. Puedes crear uno nuevo en la pestaña "Crear nuevo centro".'
                  : 'No se encontraron centros disponibles que no estén ya asociados.'}
              </div>
            ) : (
              centrosFiltrados.map((c) => {
                const esSeleccionado = seleccionadoId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSeleccionadoId(c.id)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: esSeleccionado
                        ? '1px solid var(--accent-primary)'
                        : '1px solid var(--border-subtle)',
                      background: esSeleccionado
                        ? 'rgba(37, 99, 235, 0.12)'
                        : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <MapPin
                        size={16}
                        color={esSeleccionado ? 'var(--accent-primary)' : 'var(--text-tertiary)'}
                      />
                      <div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            color: esSeleccionado ? 'var(--text-primary)' : 'var(--text-secondary)',
                          }}
                        >
                          {c.direccion}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {c.distanciaKm} km · {c.distanciaMin} min de viaje
                        </div>
                      </div>
                    </div>
                    {esSeleccionado && (
                      <Check size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="form-actions" style={{ marginTop: '0.5rem' }}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button
              variant="primary"
              disabled={!seleccionadoId}
              onClick={handleAsociarExistente}
            >
              Asociar al cliente
            </Button>
          </div>
        </div>
      ) : (
        <form noValidate onSubmit={handleCrearNuevo} className="form-grid">
          {errorLocal && (
            <div
              className="form-span-2"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid var(--status-error)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--status-error)',
                fontSize: '0.875rem',
              }}
            >
              {errorLocal}
            </div>
          )}

          <div className="form-span-2">
            <Field label="Dirección del Centro *">
              <input
                className="form-control"
                required
                placeholder="Ej. Av. El Santo 1230, La Serena"
                value={direccionNueva}
                onChange={(e) => setDireccionNueva(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Distancia desde Coquimbo (km) *">
            <input
              className="form-control"
              type="number"
              step="any"
              required
              placeholder="Ej. 12.5"
              value={distanciaKmNueva}
              onChange={(e) => setDistanciaKmNueva(e.target.value)}
            />
          </Field>

          <Field label="Tiempo estimado de viaje (minutos) *">
            <input
              className="form-control"
              type="number"
              step="1"
              required
              placeholder="Ej. 25"
              value={distanciaMinNueva}
              onChange={(e) => setDistanciaMinNueva(e.target.value)}
            />
          </Field>

          <div className="form-actions form-span-2" style={{ marginTop: '0.5rem' }}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary">
              Agregar a la lista
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
