import React, { useState } from 'react';
import { FilterX, Plus, Trash2, Truck } from 'lucide-react';
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
import {
  CAMIONES_MOCK,
  HISTORIAL_MOCK,
  HISTORIAL_VACIO,
  TIPOS_CAMION_MOCK,
  filtrarCamionesMock,
} from '../components/features/flota/flota.mock';
import type { Camion, CamionFiltros, DocumentoCamion } from '../components/features/flota/types';

type Formulario = { modo: 'crear' } | { modo: 'editar'; camion: Camion };

/**
 * Página "Flota" (Épica 1): listado con filtros, ficha del camión, registro,
 * edición, documentos y baja.
 *
 * Coordina qué modal está abierto y delega en la API cada acción. Mientras
 * no exista `api/camion.api.ts`, lee de `flota.mock.ts` y las acciones de
 * escritura sólo avisan que están pendientes.
 */
export const FlotaPage: React.FC = () => {
  const [filtros, setFiltros] = useState<CamionFiltros>(FILTROS_VACIOS);
  const [fichaId, setFichaId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [documento, setDocumento] = useState<{ camion: Camion; documento?: DocumentoCamion } | null>(null);
  const [bajaCamion, setBajaCamion] = useState<Camion | null>(null);
  const { toast, showToast } = useToast();

  // TODO: reemplazar por camion.api.ts (query de camiones con filtros y tipos de camión).
  const tipos = TIPOS_CAMION_MOCK;
  const camiones = filtrarCamionesMock(CAMIONES_MOCK, filtros);
  const fichaCamion = CAMIONES_MOCK.find((c) => c.id === fichaId) ?? null;

  // TODO: reemplazar por las mutations de camion.api.ts. El backend valida
  // (patente única, documentos, estados) y la página muestra su respuesta o error.
  const pendienteApi = (accion: string) => showToast(`${accion}: pendiente de conexión con la API.`, 'info');

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
        visibles={camiones.length}
        total={CAMIONES_MOCK.length}
      />

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <CamionTable
          camiones={camiones}
          onSelect={(c) => setFichaId(c.id)}
          empty={
            <EmptyState
              icon={<FilterX size={36} />}
              title="Ningún camión cumple con los filtros seleccionados"
              action={<Button onClick={() => setFiltros(FILTROS_VACIOS)}>Limpiar filtros</Button>}
            />
          }
        />
      </div>

      {fichaCamion && (
        <CamionDetailModal
          camion={fichaCamion}
          historial={HISTORIAL_MOCK[fichaCamion.id] ?? HISTORIAL_VACIO}
          onClose={() => setFichaId(null)}
          onEditar={() => setFormulario({ modo: 'editar', camion: fichaCamion })}
          onDocumento={(doc) => setDocumento({ camion: fichaCamion, documento: doc })}
          onDarDeBaja={() => setBajaCamion(fichaCamion)}
        />
      )}

      {formulario && (
        <CamionFormModal
          camion={formulario.modo === 'editar' ? formulario.camion : undefined}
          tipos={tipos}
          onClose={() => setFormulario(null)}
          onSubmit={() => {
            pendienteApi(formulario.modo === 'editar' ? 'Editar camión' : 'Registrar camión');
            setFormulario(null);
          }}
        />
      )}

      {documento && (
        <DocumentoFormModal
          camion={documento.camion}
          documento={documento.documento}
          onClose={() => setDocumento(null)}
          onSubmit={() => {
            pendienteApi('Guardar documento');
            setDocumento(null);
          }}
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
          onConfirm={() => {
            pendienteApi('Dar de baja');
            setBajaCamion(null);
          }}
        >
          El camión quedará <strong>Inactivo</strong> y dejará de estar disponible para nuevos viajes, pero se
          conservará todo su historial.
        </ConfirmDialog>
      )}
    </div>
  );
};
