import React, { useCallback, useEffect, useState } from 'react';
import { FilterX, LoaderCircle, Plus, Trash2, Truck, WifiOff } from 'lucide-react';
import {
  darDeBajaCamion,
  editarCamion,
  getCamion,
  getCamiones,
  getHistorialCamion,
  getTiposCamion,
  registrarCamion,
  registrarDocumento,
} from '../api/camion.api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { CamionDetailModal } from '../components/features/flota/CamionDetailModal';
import { CamionFilters } from '../components/features/flota/CamionFilters';
import { CamionFormModal } from '../components/features/flota/CamionFormModal';
import { CamionTable } from '../components/features/flota/CamionTable';
import { DocumentoFormModal } from '../components/features/flota/DocumentoFormModal';
import { FILTROS_VACIOS } from '../components/features/flota/flota.constants';
import type {
  Camion,
  CamionFiltros,
  CamionInput,
  DocumentoCamion,
  HistorialCamion,
  RegistroCamionInput,
  TipoCamion,
} from '../components/features/flota/types';

type Formulario = { modo: 'crear' } | { modo: 'editar'; camion: Camion };

interface Ficha {
  camion: Camion;
  historial: HistorialCamion;
}

/** Espera tras la última tecla del buscador antes de consultar la API. */
const ESPERA_BUSQUEDA_MS = 250;

// Una petición cancelada (cambio de filtro, modal cerrado) no es un error que mostrar.
const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : 'Error inesperado');

/**
 * Página "Flota" (Épica 1): listado con filtros, ficha del camión, registro,
 * edición, documentos y baja.
 *
 * Coordina qué modal está abierto y delega en `api/camion.api.ts` cada lectura
 * y acción. El backend filtra, valida y calcula los estados; tras cada acción
 * la página vuelve a consultar para mostrar lo que quedó guardado.
 */
export const FlotaPage: React.FC = () => {
  const [filtros, setFiltros] = useState<CamionFiltros>(FILTROS_VACIOS);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [documento, setDocumento] = useState<{ camion: Camion; documento?: DocumentoCamion } | null>(null);
  const [bajaCamion, setBajaCamion] = useState<Camion | null>(null);
  const { toast, showToast } = useToast();

  const [tipos, setTipos] = useState<TipoCamion[]>([]);
  const [camiones, setCamiones] = useState<Camion[]>([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);

  // Cada acción que modifica la flota incrementa `version` para volver a consultar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const control = new AbortController();
    getTiposCamion(control.signal)
      .then(setTipos)
      .catch((e) => !esCancelacion(e) && showToast(mensajeDe(e), 'error'));
    return () => control.abort();
  }, [showToast]);

  // Listado filtrado. Al cambiar un filtro se cancela la consulta anterior.
  useEffect(() => {
    const control = new AbortController();
    const timer = window.setTimeout(() => {
      setCargando(true);
      getCamiones(filtros, control.signal)
        .then((data) => {
          setCamiones(data);
          setError(null);
        })
        .catch((e) => !esCancelacion(e) && setError(mensajeDe(e)))
        .finally(() => !control.signal.aborted && setCargando(false));
    }, ESPERA_BUSQUEDA_MS);
    return () => {
      window.clearTimeout(timer);
      control.abort();
    };
  }, [filtros, version]);

  // Total sin filtros, para el "Mostrando X de N vehículos".
  useEffect(() => {
    const control = new AbortController();
    getCamiones(FILTROS_VACIOS, control.signal)
      .then((data) => setTotal(data.length))
      // Si falla, el error ya lo muestra el listado.
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  // Ficha abierta: camión e historial. Se refresca tras cada acción.
  useEffect(() => {
    if (fichaId === null) return;
    const control = new AbortController();
    Promise.all([getCamion(fichaId, control.signal), getHistorialCamion(fichaId, control.signal)])
      .then(([camion, historial]) => {
        if (camion) {
          setFicha({ camion, historial });
        } else {
          showToast('El camión ya no existe.', 'error');
          setFichaId(null);
        }
      })
      .catch((e) => {
        if (esCancelacion(e)) return;
        showToast(mensajeDe(e), 'error');
        setFichaId(null);
      });
    return () => control.abort();
  }, [fichaId, version, showToast]);

  // Evita mostrar la ficha anterior mientras llega la del camión recién elegido.
  const fichaAbierta = ficha && ficha.camion.id === fichaId ? ficha : null;

  /**
   * Ejecuta una mutation. Si el backend la rechaza (p. ej. patente duplicada),
   * muestra su mensaje y deja el modal abierto para corregir.
   */
  const ejecutar = async (accion: () => Promise<Camion>, exito: (camion: Camion) => string, cerrar: () => void) => {
    try {
      const camion = await accion();
      showToast(exito(camion));
      cerrar();
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
    }
  };

  const guardarCamion = (input: CamionInput | RegistroCamionInput) => {
    if (!formulario) return;
    if (formulario.modo === 'editar') {
      void ejecutar(
        () => editarCamion(formulario.camion.id, input),
        (c) => `Cambios del camión ${c.patente} guardados.`,
        () => setFormulario(null),
      );
    } else {
      void ejecutar(
        // Al registrar, el formulario incluye los documentos obligatorios.
        () => registrarCamion(input as RegistroCamionInput),
        (c) => `Camión ${c.patente} registrado.`,
        () => setFormulario(null),
      );
    }
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar la flota"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando flota..." />
  ) : (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ningún camión cumple con los filtros seleccionados"
      action={<Button onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck color="var(--accent-primary)" /> Flota
          </h1>
          <p className="text-muted">
            Inventario de camiones con filtros combinables, ficha técnica, documentos e historial de viajes
          </p>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setFormulario({ modo: 'crear' })}>
          Registrar camión
        </Button>
      </div>

      <CamionFilters
        filtros={filtros}
        onChange={setFiltros}
        onReset={() => setFiltros(FILTROS_VACIOS)}
        tipos={tipos}
        visibles={error ? 0 : camiones.length}
        total={total}
      />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <CamionTable camiones={error ? [] : camiones} onSelect={(c) => setFichaId(c.id)} empty={tablaVacia} />
      </div>

      {fichaAbierta && (
        <CamionDetailModal
          camion={fichaAbierta.camion}
          historial={fichaAbierta.historial}
          onClose={() => setFichaId(null)}
          onEditar={() => setFormulario({ modo: 'editar', camion: fichaAbierta.camion })}
          onDocumento={(doc) => setDocumento({ camion: fichaAbierta.camion, documento: doc })}
          onDarDeBaja={() => setBajaCamion(fichaAbierta.camion)}
        />
      )}

      {formulario && (
        <CamionFormModal
          camion={formulario.modo === 'editar' ? formulario.camion : undefined}
          tipos={tipos}
          onClose={() => setFormulario(null)}
          onSubmit={guardarCamion}
        />
      )}

      {documento && (
        <DocumentoFormModal
          camion={documento.camion}
          documento={documento.documento}
          onClose={() => setDocumento(null)}
          onSubmit={(input) =>
            void ejecutar(
              () => registrarDocumento(documento.camion.id, input),
              (c) => `Documento ${input.tipo} guardado para ${c.patente}.`,
              () => setDocumento(null),
            )
          }
        />
      )}

      {bajaCamion && (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={22} color="var(--status-error)" />}
          title={`¿Dar de baja el camión ${bajaCamion.patente}?`}
          subtitle={`${bajaCamion.marca} ${bajaCamion.modelo}`}
          confirmLabel="Confirmar baja"
          onCancel={() => setBajaCamion(null)}
          onConfirm={() =>
            void ejecutar(
              () => darDeBajaCamion(bajaCamion.id),
              (c) => `Camión ${c.patente} dado de baja.`,
              () => setBajaCamion(null),
            )
          }
        >
          El camión quedará <strong>Inactivo</strong> y dejará de estar disponible para nuevos viajes, pero se
          conservará todo su historial.
        </ConfirmDialog>
      )}
    </div>
  );
};
