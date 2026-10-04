import React, { useCallback, useEffect, useState } from 'react';
import { FilterX, LoaderCircle, Trash2, UserPlus, Users, WifiOff } from 'lucide-react';
import {
  darDeBajaConductor,
  editarConductor,
  getClasesLicencia,
  getConductor,
  getConductores,
  getHistorialConductor,
  getResumenPersonal,
  registrarConductor,
  registrarLicencia,
} from '../api/conductor.api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { Toast } from '../components/ui/Toast';
import { useToast } from '../components/ui/useToast';
import { ConductorDetailModal } from '../components/features/conductores/ConductorDetailModal';
import { ConductorFilters } from '../components/features/conductores/ConductorFilters';
import { ConductorFormModal } from '../components/features/conductores/ConductorFormModal';
import { ConductorTable } from '../components/features/conductores/ConductorTable';
import { LicenciaFormModal } from '../components/features/conductores/LicenciaFormModal';
import { ResumenPersonalPanel } from '../components/features/conductores/ResumenPersonalPanel';
import { FILTROS_VACIOS } from '../components/features/conductores/conductores.constants';
import type {
  ClaseLicencia,
  Conductor,
  ConductorFiltros,
  ConductorInput,
  HistorialConductor,
  RegistroConductorInput,
  ResumenPersonal,
} from '../components/features/conductores/types';

type Formulario = { modo: 'crear' } | { modo: 'editar'; conductor: Conductor };

interface Ficha {
  conductor: Conductor;
  historial: HistorialConductor;
}

/** Espera tras la última tecla del buscador antes de consultar la API. */
const ESPERA_BUSQUEDA_MS = 250;

// Una petición cancelada (cambio de filtro, modal cerrado) no es un error que mostrar.
const esCancelacion = (error: unknown) => error instanceof DOMException && error.name === 'AbortError';

const mensajeDe = (error: unknown) => (error instanceof Error ? error.message : 'Error inesperado');

/**
 * Página "Conductores" (Épica 2): panel de personal con su indicador de
 * disponibilidad y filtros, ficha del conductor, registro, edición,
 * renovación de licencia y baja.
 *
 * Coordina qué modal está abierto y delega en `api/conductor.api.ts` cada
 * lectura y acción. El backend valida el RUT y las licencias y calcula el
 * estado de cada conductor; tras cada acción la página vuelve a consultar.
 */
export const ConductoresPage: React.FC = () => {
  const [filtros, setFiltros] = useState<ConductorFiltros>(FILTROS_VACIOS);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [licenciaDe, setLicenciaDe] = useState<Conductor | null>(null);
  const [bajaConductor, setBajaConductor] = useState<Conductor | null>(null);
  const { toast, showToast } = useToast();

  const [clases, setClases] = useState<ClaseLicencia[]>([]);
  const [conductores, setConductores] = useState<Conductor[]>([]);
  const [resumen, setResumen] = useState<ResumenPersonal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ficha, setFicha] = useState<Ficha | null>(null);

  // Cada acción que modifica el personal incrementa `version` para volver a consultar.
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    const control = new AbortController();
    getClasesLicencia(control.signal)
      .then(setClases)
      .catch((e) => !esCancelacion(e) && showToast(mensajeDe(e), 'error'));
    return () => control.abort();
  }, [showToast]);

  // Panel filtrado. Al cambiar un filtro se cancela la consulta anterior.
  useEffect(() => {
    const control = new AbortController();
    const timer = window.setTimeout(() => {
      setCargando(true);
      getConductores(filtros, control.signal)
        .then((data) => {
          setConductores(data);
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

  // Indicador disponibles / total, sin filtros.
  useEffect(() => {
    const control = new AbortController();
    getResumenPersonal(control.signal)
      .then(setResumen)
      // Si falla, el error ya lo muestra el panel.
      .catch(() => undefined);
    return () => control.abort();
  }, [version]);

  // Ficha abierta: conductor e historial. Se refresca tras cada acción.
  useEffect(() => {
    if (fichaId === null) return;
    const control = new AbortController();
    Promise.all([getConductor(fichaId, control.signal), getHistorialConductor(fichaId, control.signal)])
      .then(([conductor, historial]) => {
        if (conductor) {
          setFicha({ conductor, historial });
        } else {
          showToast('El conductor ya no existe.', 'error');
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

  // Evita mostrar la ficha anterior mientras llega la del conductor recién elegido.
  const fichaAbierta = ficha && ficha.conductor.id === fichaId ? ficha : null;

  /**
   * Ejecuta una mutation. Si el backend la rechaza (p. ej. RUT inválido o
   * duplicado), muestra su mensaje y deja el modal abierto para corregir.
   */
  const ejecutar = async (
    accion: () => Promise<Conductor>,
    exito: (conductor: Conductor) => string,
    cerrar: () => void,
  ) => {
    try {
      const conductor = await accion();
      showToast(exito(conductor));
      cerrar();
      recargar();
    } catch (e) {
      showToast(mensajeDe(e), 'error');
    }
  };

  const guardarConductor = (input: ConductorInput | RegistroConductorInput) => {
    if (!formulario) return;
    if (formulario.modo === 'editar') {
      void ejecutar(
        () => editarConductor(formulario.conductor.id, input),
        (c) => `Datos de ${c.nombres} ${c.apellidos} guardados.`,
        () => setFormulario(null),
      );
    } else {
      void ejecutar(
        // Al registrar, el formulario incluye la licencia.
        () => registrarConductor(input as RegistroConductorInput),
        (c) => `Conductor ${c.nombres} ${c.apellidos} registrado.`,
        () => setFormulario(null),
      );
    }
  };

  const tablaVacia = error ? (
    <EmptyState
      icon={<WifiOff size={36} />}
      title="No se pudo cargar el personal"
      description={error}
      action={<Button onClick={recargar}>Reintentar</Button>}
    />
  ) : cargando ? (
    <EmptyState icon={<LoaderCircle size={36} />} title="Cargando conductores..." />
  ) : (
    <EmptyState
      icon={<FilterX size={36} />}
      title="Ningún conductor cumple con los filtros seleccionados"
      action={<Button onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</Button>}
    />
  );

  return (
    <div className="page-view-enter stack-lg">
      <Toast message={toast} />

      <PageHeader
        title="Conductores"
        icon={<Users size={22} />}
        description="Panel de personal con disponibilidad, licencias habilitantes e historial de viajes"
        actions={<Button variant="primary" icon={<UserPlus size={16} />} onClick={() => setFormulario({ modo: 'crear' })}>Registrar conductor</Button>}
      />

      <ResumenPersonalPanel resumen={resumen} />

      <ConductorFilters
        filtros={filtros}
        onChange={setFiltros}
        onReset={() => setFiltros(FILTROS_VACIOS)}
        clases={clases}
        visibles={error ? 0 : conductores.length}
        total={resumen ? resumen.total + resumen.inactivos : 0}
      />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <ConductorTable
          conductores={error ? [] : conductores}
          onSelect={(c) => setFichaId(c.id)}
          empty={tablaVacia}
        />
      </div>

      {fichaAbierta && (
        <ConductorDetailModal
          conductor={fichaAbierta.conductor}
          historial={fichaAbierta.historial}
          onClose={() => setFichaId(null)}
          onEditar={() => setFormulario({ modo: 'editar', conductor: fichaAbierta.conductor })}
          onRenovarLicencia={() => setLicenciaDe(fichaAbierta.conductor)}
          onDarDeBaja={() => setBajaConductor(fichaAbierta.conductor)}
        />
      )}

      {formulario && (
        <ConductorFormModal
          conductor={formulario.modo === 'editar' ? formulario.conductor : undefined}
          clases={clases}
          onClose={() => setFormulario(null)}
          onSubmit={guardarConductor}
        />
      )}

      {licenciaDe && (
        <LicenciaFormModal
          conductor={licenciaDe}
          clases={clases}
          onClose={() => setLicenciaDe(null)}
          onSubmit={(input) =>
            void ejecutar(
              () => registrarLicencia(licenciaDe.id, input),
              (c) => `Licencia de ${c.nombres} ${c.apellidos} registrada.`,
              () => setLicenciaDe(null),
            )
          }
        />
      )}

      {bajaConductor && (
        <ConfirmDialog
          tone="danger"
          icon={<Trash2 size={22} color="var(--status-error)" />}
          title={`¿Dar de baja a ${bajaConductor.nombres} ${bajaConductor.apellidos}?`}
          subtitle={`RUT ${bajaConductor.rut}`}
          confirmLabel="Confirmar baja"
          onCancel={() => setBajaConductor(null)}
          onConfirm={() =>
            void ejecutar(
              () => darDeBajaConductor(bajaConductor.id),
              (c) => `${c.nombres} ${c.apellidos} dado de baja.`,
              () => setBajaConductor(null),
            )
          }
        >
          El conductor quedará <strong>Inactivo</strong> y dejará de estar disponible para nuevos viajes, pero se
          conservarán sus licencias y su historial. No se puede dar de baja a un conductor con viajes en curso o
          planificados.
        </ConfirmDialog>
      )}
    </div>
  );
};
