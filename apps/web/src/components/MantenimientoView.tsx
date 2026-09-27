import React, { useEffect, useState } from 'react';
import { AlertTriangle, FileText, ShieldAlert, ShieldCheck, Wrench } from 'lucide-react';
import {
  deleteDocument,
  getFleet,
  registerDocument,
  scheduleMaintenance,
  setMaintenanceState,
  updateDocument,
} from '../lib/fleetApi';
import type {
  CamionFlota,
  DocumentoFlota,
  DocumentoInput,
  DocumentoTipo,
  MantencionEstado,
  MantencionFlota,
  MantencionInput,
  MantencionTipo,
} from '../lib/fleetApi';

interface DocumentoForm {
  idCamion: string;
  tipo: DocumentoTipo;
  fechaEmision: string;
  fechaVencimiento: string;
}

interface MantencionForm {
  idCamion: string;
  tipo: MantencionTipo;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
}

const EMPTY_DOCUMENT: DocumentoForm = {
  idCamion: '', tipo: 'RT', fechaEmision: '', fechaVencimiento: '',
};

const EMPTY_MAINTENANCE: MantencionForm = {
  idCamion: '', tipo: 'PREVENTIVA', descripcion: '', fechaInicio: '', fechaFin: '',
};

const dateOnly = (value: string | null) => value?.slice(0, 10) ?? 'Sin fecha';
const dateTimeInput = (value: string) => `${value}T00:00:00`;

export const MantenimientoView: React.FC = () => {
  const [todayUtc] = useState(() => new Date().toISOString().slice(0, 10));
  const [camiones, setCamiones] = useState<CamionFlota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentForm, setDocumentForm] = useState<DocumentoForm>(EMPTY_DOCUMENT);
  const [documentId, setDocumentId] = useState<number | null>(null);
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState<MantencionForm>(EMPTY_MAINTENANCE);
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);

  useEffect(() => {
    let active = true;
    void getFleet()
      .then((data) => { if (active) setCamiones(data.camiones); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la flota');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const allDocuments = camiones.flatMap((camion) =>
    camion.documentos.map((documento) => ({ camion, documento })),
  );
  const allMaintenance = camiones.flatMap((camion) =>
    camion.mantenciones.map((mantencion) => ({ camion, mantencion })),
  ).sort((left, right) => right.mantencion.fechaInicio.localeCompare(left.mantencion.fechaInicio));
  const expiredDocuments = allDocuments.filter(({ documento }) => !documento.vigente).length;
  const enabledTrucks = camiones.filter((camion) => camion.activo && camion.habilitado).length;

  const closeDocumentForm = () => {
    setShowDocumentForm(false);
    setDocumentId(null);
    setDocumentForm(EMPTY_DOCUMENT);
  };

  const editDocument = (camion: CamionFlota, documento: DocumentoFlota) => {
    setDocumentId(documento.id);
    setDocumentForm({
      idCamion: String(camion.id),
      tipo: documento.tipo,
      fechaEmision: dateOnly(documento.fechaEmision),
      fechaVencimiento: dateOnly(documento.fechaVencimiento),
    });
    setShowDocumentForm(true);
    setError(null);
  };

  const handleDocumentSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const input: DocumentoInput = {
      tipo: documentForm.tipo,
      fechaEmision: dateTimeInput(documentForm.fechaEmision),
      fechaVencimiento: dateTimeInput(documentForm.fechaVencimiento),
    };
    try {
      const document = documentId
        ? await updateDocument(documentId, input)
        : await registerDocument(Number(documentForm.idCamion), input);
      setCamiones((current) => current.map((camion) => {
        if (camion.id !== document.idCamion) return camion;
        const documentos = documentId
          ? camion.documentos.map((item) => item.id === document.id ? document : item)
          : [...camion.documentos, document];
        return { ...camion, documentos };
      }));
      closeDocumentForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el documento');
    } finally {
      setSaving(false);
    }
  };

  const handleDocumentDelete = async (documento: DocumentoFlota) => {
    setError(null);
    try {
      await deleteDocument(documento.id);
      setCamiones((current) => current.map((camion) => ({
        ...camion,
        documentos: camion.documentos.filter((item) => item.id !== documento.id),
      })));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el documento');
    }
  };

  const handleMaintenanceSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const input: MantencionInput = {
      tipo: maintenanceForm.tipo,
      descripcion: maintenanceForm.descripcion.trim(),
      fechaInicio: dateTimeInput(maintenanceForm.fechaInicio),
      fechaFin: maintenanceForm.fechaFin ? dateTimeInput(maintenanceForm.fechaFin) : null,
    };
    try {
      const mantencion = await scheduleMaintenance(Number(maintenanceForm.idCamion), input);
      setCamiones((current) => current.map((camion) => camion.id === mantencion.idCamion
        ? { ...camion, mantenciones: [...camion.mantenciones, mantencion] }
        : camion));
      setShowMaintenanceForm(false);
      setMaintenanceForm(EMPTY_MAINTENANCE);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo programar la mantención');
    } finally {
      setSaving(false);
    }
  };

  const changeMaintenanceState = async (
    mantencion: MantencionFlota,
    estado: MantencionEstado,
  ) => {
    setError(null);
    try {
      const fechaFin = estado === 'COMPLETADA'
        ? new Date().toISOString().slice(0, 19)
        : undefined;
      const updated = await setMaintenanceState(mantencion.id, estado, fechaFin);
      setCamiones((current) => current.map((camion) => camion.id === updated.idCamion
        ? { ...camion, mantenciones: camion.mantenciones.map((item) => item.id === updated.id ? updated : item) }
        : camion));
    } catch (stateError) {
      setError(stateError instanceof Error ? stateError.message : 'No se pudo cambiar el estado');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Wrench color="var(--accent-primary)" /> Documentación y mantenciones
          </h1>
          <p className="text-muted">Vigencia legal y agenda operativa de la flota</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={() => { closeDocumentForm(); setShowDocumentForm(true); }}>
            <FileText size={16} /> Registrar documento
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { setShowMaintenanceForm(true); setError(null); }}>
            <Wrench size={16} /> Programar mantención
          </button>
        </div>
      </div>

      {error && <div role="alert" className="glass-panel" style={{ padding: '0.85rem 1rem', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>{error}</div>}
      {loading && <p className="text-muted">Cargando documentación y mantenciones…</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <ShieldCheck color="var(--status-success)" />
          <div><strong>{enabledTrucks} / {camiones.length}</strong><div className="text-muted">Camiones habilitados hoy</div></div>
        </div>
        <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
          <ShieldAlert color={expiredDocuments ? 'var(--status-error)' : 'var(--status-success)'} />
          <div><strong>{expiredDocuments}</strong><div className="text-muted">Documentos no vigentes</div></div>
        </div>
      </div>

      {showDocumentForm && (
        <form onSubmit={handleDocumentSave} className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <strong style={{ gridColumn: '1 / -1' }}>{documentId ? 'Actualizar documento' : 'Registrar documento'}</strong>
          <label>Camión<select required disabled={documentId !== null} value={documentForm.idCamion} onChange={(event) => setDocumentForm({ ...documentForm, idCamion: event.target.value })}><option value="">Seleccionar patente</option>{camiones.map((camion) => <option key={camion.id} value={camion.id}>{camion.patente}</option>)}</select></label>
          <label>Documento<select value={documentForm.tipo} onChange={(event) => setDocumentForm({ ...documentForm, tipo: event.target.value as DocumentoTipo })}><option value="RT">Revisión técnica</option><option value="PC">Permiso de circulación</option><option value="SOAP">SOAP</option><option value="PADRON">Padrón</option><option value="CEC">CEC</option></select></label>
          <label>Fecha de emisión<input required type="date" value={documentForm.fechaEmision} onChange={(event) => setDocumentForm({ ...documentForm, fechaEmision: event.target.value })} /></label>
          <label>Fecha de vencimiento<input required type="date" value={documentForm.fechaVencimiento} onChange={(event) => setDocumentForm({ ...documentForm, fechaVencimiento: event.target.value })} /></label>
          <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button><button type="button" className="btn btn-secondary" onClick={closeDocumentForm}>Cancelar</button></div>
        </form>
      )}

      {showMaintenanceForm && (
        <form onSubmit={handleMaintenanceSave} className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <strong style={{ gridColumn: '1 / -1' }}>Programar mantención</strong>
          <label>Camión<select required value={maintenanceForm.idCamion} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, idCamion: event.target.value })}><option value="">Seleccionar patente</option>{camiones.map((camion) => <option key={camion.id} value={camion.id}>{camion.patente}</option>)}</select></label>
          <label>Tipo<select value={maintenanceForm.tipo} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, tipo: event.target.value as MantencionTipo })}><option value="PREVENTIVA">Preventiva</option><option value="CORRECTIVA">Correctiva</option></select></label>
          <label>Detalle<input required value={maintenanceForm.descripcion} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, descripcion: event.target.value })} /></label>
          <label>Inicio<input required type="date" value={maintenanceForm.fechaInicio} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, fechaInicio: event.target.value })} /></label>
          <label>Fin estimado<input type="date" value={maintenanceForm.fechaFin} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, fechaFin: event.target.value })} /></label>
          <div style={{ display: 'flex', gap: '0.5rem' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Programar'}</button><button type="button" className="btn btn-secondary" onClick={() => setShowMaintenanceForm(false)}>Cancelar</button></div>
        </form>
      )}

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-primary)" /> Documentación legal
        </h2>
        <div className="table-container"><table>
          <thead><tr><th>Camión</th><th>Documento</th><th>Emisión</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {allDocuments.map(({ camion, documento }) => (
              <tr key={documento.id}>
                <td>{camion.patente}</td><td>{documento.tipo}</td>
                <td>{dateOnly(documento.fechaEmision)}</td><td>{dateOnly(documento.fechaVencimiento)}</td>
                <td>{documento.vigente ? <span className="badge badge-success"><ShieldCheck size={12} /> Vigente</span> : <span className="badge badge-error"><AlertTriangle size={12} /> Vencido</span>}</td>
                <td><div style={{ display: 'flex', gap: '0.4rem' }}><button type="button" className="btn btn-secondary" onClick={() => editDocument(camion, documento)}>Actualizar</button><button type="button" className="btn btn-secondary" onClick={() => void handleDocumentDelete(documento)}>Eliminar</button></div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {!loading && allDocuments.length === 0 && <p className="text-muted">No hay documentos registrados.</p>}
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Wrench size={18} color="var(--accent-primary)" /> Mantenciones
        </h2>
        <div className="table-container"><table>
          <thead><tr><th>Camión</th><th>Tipo</th><th>Detalle</th><th>Inicio</th><th>Fin</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {allMaintenance.map(({ camion, mantencion }) => (
              <tr key={mantencion.id}>
                <td>{camion.patente}</td><td>{mantencion.tipo}</td><td>{mantencion.descripcion}</td>
                <td>{dateOnly(mantencion.fechaInicio)}</td><td>{dateOnly(mantencion.fechaFin)}</td><td>{mantencion.estado}</td>
                <td><div style={{ display: 'flex', gap: '0.4rem' }}>
                  {mantencion.estado === 'PROGRAMADA' && <><button type="button" className="btn btn-secondary" onClick={() => void changeMaintenanceState(mantencion, 'EN_CURSO')}>Iniciar</button><button type="button" className="btn btn-secondary" onClick={() => void changeMaintenanceState(mantencion, 'CANCELADA')}>Cancelar</button></>}
                  {mantencion.estado === 'EN_CURSO' && <button type="button" className="btn btn-secondary" disabled={mantencion.fechaInicio.slice(0, 10) > todayUtc} onClick={() => void changeMaintenanceState(mantencion, 'COMPLETADA')}>Completar</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table></div>
        {!loading && allMaintenance.length === 0 && <p className="text-muted">No hay mantenciones registradas.</p>}
      </div>
    </div>
  );
};
