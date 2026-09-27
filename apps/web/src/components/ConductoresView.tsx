import React, { useEffect, useState } from 'react';
import { Users, Search, AlertCircle, CheckCircle2, UserX, Phone, Mail, ShieldAlert } from 'lucide-react';
import { createDriver, deleteDriver, getDrivers, updateDriver, updateDriverLicense } from '../lib/fleetApi';
import type { ConductorApi, ConductorInput, LicenciaClase, LicenciaInput, PerfilConductorInput } from '../lib/fleetApi';

interface ConductorFila extends ConductorApi {
  claseLicencia: string;
  fechaVencimientoLicencia: string;
  licenciaVencida: boolean;
  tiposHabilitados: string[];
  estado: string;
  motivoBloqueo?: string;
}

interface DriverForm {
  rut: string;
  nombres: string;
  apellidos: string;
  telefono: string;
  email: string;
  fechaEmisionLicencia: string;
  fechaVencimientoLicencia: string;
  clases: LicenciaClase[];
}

const EMPTY_FORM: DriverForm = {
  rut: '', nombres: '', apellidos: '', telefono: '', email: '',
  fechaEmisionLicencia: '', fechaVencimientoLicencia: '', clases: [],
};

const CLASES_LICENCIA: LicenciaClase[] = ['A1', 'A2', 'A3', 'A4', 'A5', 'B', 'C', 'D', 'E', 'F'];

export const ConductoresView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<string>('todos');
  const [filterState, setFilterState] = useState<string>('todos');
  const [conductores, setConductores] = useState<ConductorApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DriverForm>(EMPTY_FORM);
  const [perfilId, setPerfilId] = useState<number | null>(null);
  const [editPerfil, setEditPerfil] = useState(false);
  const [perfilForm, setPerfilForm] = useState<PerfilConductorInput | null>(null);
  const [editLicenciaId, setEditLicenciaId] = useState<number | null>(null);
  const [licenciaForm, setLicenciaForm] = useState<LicenciaInput | null>(null);
  const [savingLicencia, setSavingLicencia] = useState(false);

  useEffect(() => {
    let active = true;
    void getDrivers()
      .then((data) => { if (active) setConductores(data); })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar conductores');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filas: ConductorFila[] = conductores.map((conductor) => {
    const licencia = conductor.licencias[0];
    return {
      ...conductor,
      claseLicencia: licencia?.clases.join(', ') ?? 'Sin licencia',
      fechaVencimientoLicencia: licencia?.fechaVencimiento.slice(0, 10) ?? 'Sin fecha',
      licenciaVencida: !conductor.habilitado,
      tiposHabilitados: licencia?.tiposCamionHabilitados ?? [],
      estado: conductor.enViaje ? 'En viaje' : conductor.habilitado ? 'Disponible' : 'Bloqueado',
      motivoBloqueo: !conductor.habilitado ? 'Licencia vencida o sin clases habilitantes' : undefined,
    };
  });

  const filteredConductores = filas.filter((conductor) => {
    const fullName = `${conductor.nombres} ${conductor.apellidos}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      conductor.rut.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conductor.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClass = filterClass === 'todos' ||
      conductor.licencias[0]?.clases.includes(filterClass as LicenciaClase);
    const matchesState = filterState === 'todos' ||
      (filterState === 'Disponible' && conductor.estado === 'Disponible') ||
      (filterState === 'En viaje' && conductor.estado === 'En viaje') ||
      (filterState === 'Bloqueado' && conductor.estado === 'Bloqueado');

    return matchesSearch && matchesClass && matchesState;
  });

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const input: ConductorInput = {
      ...form,
      rut: form.rut.trim(),
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      telefono: form.telefono.trim(),
      email: form.email.trim(),
      fechaEmisionLicencia: `${form.fechaEmisionLicencia}T00:00:00`,
      fechaVencimientoLicencia: `${form.fechaVencimientoLicencia}T00:00:00`,
    };
    try {
      const conductor = await createDriver(input);
      setConductores((current) => [...current, conductor].sort((a, b) => a.apellidos.localeCompare(b.apellidos)));
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo registrar el conductor');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (conductor: ConductorApi, input: PerfilConductorInput) => {
    setError(null);
    try {
      const updated = await updateDriver(conductor.id, input);
      setConductores((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditPerfil(false);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar el perfil');
    }
  };

  const handleDelete = async (conductor: ConductorApi) => {
    setError(null);
    try {
      await deleteDriver(conductor.id);
      setConductores((current) => current.filter((item) => item.id !== conductor.id));
      setPerfilId(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el conductor');
    }
  };

  const openProfile = (conductor: ConductorApi) => {
    setPerfilId(conductor.id);
    setEditPerfil(false);
    setPerfilForm({
      rut: conductor.rut,
      nombres: conductor.nombres,
      apellidos: conductor.apellidos,
      telefono: conductor.telefono,
      email: conductor.email,
    });
    setError(null);
  };

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const conductor = conductores.find((item) => item.id === perfilId);
    if (conductor && perfilForm) await handleProfileSave(conductor, perfilForm);
  };

  const perfilSeleccionado = conductores.find((conductor) => conductor.id === perfilId);

  const editLicense = (licencia: ConductorApi['licencias'][number]) => {
    setEditLicenciaId(licencia.id);
    setLicenciaForm({
      fechaEmision: licencia.fechaEmision.slice(0, 10),
      fechaVencimiento: licencia.fechaVencimiento.slice(0, 10),
      clases: [...licencia.clases],
    });
  };

  const submitLicense = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const conductor = perfilSeleccionado;
    if (!conductor || !licenciaForm || editLicenciaId === null) return;
    setSavingLicencia(true);
    setError(null);
    try {
      const updated = await updateDriverLicense(editLicenciaId, {
        ...licenciaForm,
        fechaEmision: `${licenciaForm.fechaEmision}T00:00:00`,
        fechaVencimiento: `${licenciaForm.fechaVencimiento}T00:00:00`,
      });
      setConductores((current) => current.map((item) => item.id === updated.id ? updated : item));
      setEditLicenciaId(null);
      setLicenciaForm(null);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la licencia');
    } finally {
      setSavingLicencia(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users color="var(--accent-primary)" /> Gestión de Conductores
          </h1>
          <p className="text-muted">
            Perfiles, licencias y disponibilidad para asignación de viajes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="button" className="btn btn-primary" onClick={() => { setForm(EMPTY_FORM); setShowForm((open) => !open); setError(null); }}>
            + Registrar conductor
          </button>
        </div>
      </div>

      {error && <div role="alert" className="glass-panel" style={{ padding: '0.85rem 1rem', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>{error}</div>}
      {loading && <p className="text-muted">Cargando conductores…</p>}

      {showForm && (
        <form onSubmit={handleCreate} className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <strong style={{ gridColumn: '1 / -1' }}>Registrar conductor y licencia vigente</strong>
          <label>RUT<input required value={form.rut} onChange={(event) => setForm({ ...form, rut: event.target.value })} /></label>
          <label>Nombres<input required value={form.nombres} onChange={(event) => setForm({ ...form, nombres: event.target.value })} /></label>
          <label>Apellidos<input required value={form.apellidos} onChange={(event) => setForm({ ...form, apellidos: event.target.value })} /></label>
          <label>Teléfono<input required value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} /></label>
          <label>Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Emisión licencia<input required type="date" value={form.fechaEmisionLicencia} onChange={(event) => setForm({ ...form, fechaEmisionLicencia: event.target.value })} /></label>
          <label>Vencimiento licencia<input required type="date" value={form.fechaVencimientoLicencia} onChange={(event) => setForm({ ...form, fechaVencimientoLicencia: event.target.value })} /></label>
          <fieldset style={{ gridColumn: '1 / -1', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <legend>Clases habilitadas</legend>
            {CLASES_LICENCIA.map((clase) => (
              <label key={clase} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <input type="checkbox" checked={form.clases.includes(clase)} onChange={() => setForm((current) => ({ ...current, clases: current.clases.includes(clase) ? current.clases.filter((item) => item !== clase) : [...current.clases, clase] }))} />
                {clase}
              </label>
            ))}
          </fieldset>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Crear conductor'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '260px' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por RUT o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              outline: 'none',
              width: '100%',
              fontSize: '0.875rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Clase:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todas las clases</option>
              {CLASES_LICENCIA.map((clase) => <option key={clase} value={clase}>{clase}</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Estado:</span>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.4rem 0.8rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            >
              <option value="todos">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="En viaje">En viaje</option>
              <option value="Bloqueado">Bloqueado</option>
            </select>
          </div>
        </div>
      </div>

      {perfilSeleccionado && perfilForm && (
        <section className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
            <h2 style={{ margin: 0 }}>Perfil: {perfilSeleccionado.nombres} {perfilSeleccionado.apellidos}</h2>
            <button type="button" className="btn btn-secondary" onClick={() => { setPerfilId(null); setEditPerfil(false); }}>Cerrar</button>
          </div>
          <form onSubmit={submitProfile} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginTop: '1rem' }}>
            <label>RUT<input disabled={!editPerfil} value={perfilForm.rut} onChange={(event) => setPerfilForm({ ...perfilForm, rut: event.target.value })} /></label>
            <label>Nombres<input disabled={!editPerfil} value={perfilForm.nombres} onChange={(event) => setPerfilForm({ ...perfilForm, nombres: event.target.value })} /></label>
            <label>Apellidos<input disabled={!editPerfil} value={perfilForm.apellidos} onChange={(event) => setPerfilForm({ ...perfilForm, apellidos: event.target.value })} /></label>
            <label>Teléfono<input disabled={!editPerfil} value={perfilForm.telefono} onChange={(event) => setPerfilForm({ ...perfilForm, telefono: event.target.value })} /></label>
            <label>Email<input disabled={!editPerfil} type="email" value={perfilForm.email} onChange={(event) => setPerfilForm({ ...perfilForm, email: event.target.value })} /></label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'end' }}>
              {editPerfil ? <><button className="btn btn-primary">Guardar</button><button type="button" className="btn btn-secondary" onClick={() => { setEditPerfil(false); openProfile(perfilSeleccionado); }}>Cancelar</button></> : <button type="button" className="btn btn-secondary" onClick={() => setEditPerfil(true)}>Editar perfil</button>}
              <button type="button" className="btn btn-secondary" onClick={() => void handleDelete(perfilSeleccionado)}>Eliminar</button>
            </div>
          </form>
          <h3 style={{ margin: '1.25rem 0 0.5rem' }}>Historial de licencias</h3>
          {perfilSeleccionado.licencias.map((licencia) => (
            <div key={licencia.id} style={{ padding: '0.65rem 0', borderTop: '1px solid var(--border-color)' }}>
              {editLicenciaId === licencia.id && licenciaForm ? (
                <form onSubmit={submitLicense} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', alignItems: 'end' }}>
                  <label>Emisión<input required type="date" value={licenciaForm.fechaEmision} onChange={(event) => setLicenciaForm({ ...licenciaForm, fechaEmision: event.target.value })} /></label>
                  <label>Vencimiento<input required type="date" value={licenciaForm.fechaVencimiento} onChange={(event) => setLicenciaForm({ ...licenciaForm, fechaVencimiento: event.target.value })} /></label>
                  <fieldset style={{ gridColumn: '1 / -1', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <legend>Clases habilitadas</legend>
                    {CLASES_LICENCIA.map((clase) => (
                      <label key={clase} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <input type="checkbox" checked={licenciaForm.clases.includes(clase)} onChange={() => setLicenciaForm((current) => current ? { ...current, clases: current.clases.includes(clase) ? current.clases.filter((item) => item !== clase) : [...current.clases, clase] } : current)} />
                        {clase}
                      </label>
                    ))}
                  </fieldset>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={savingLicencia || licenciaForm.clases.length === 0}>{savingLicencia ? 'Guardando…' : 'Guardar licencia'}</button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setEditLicenciaId(null); setLicenciaForm(null); }}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <span>{licencia.clases.join(', ')} · {licencia.fechaEmision.slice(0, 10)} a {licencia.fechaVencimiento.slice(0, 10)}</span>
                  <button type="button" className="btn btn-secondary" onClick={() => editLicense(licencia)}>Editar licencia</button>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Conductor</th>
                <th>Contacto</th>
                <th>Licencia & Clase</th>
                <th>Vencimiento</th>
                <th>Vehículos Habilitados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredConductores.map((conductor) => (
                <tr key={conductor.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: conductor.licenciaVencida ? 'var(--status-error-bg)' : 'var(--accent-glow)',
                        color: conductor.licenciaVencida ? 'var(--status-error)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        {conductor.nombres.charAt(0)}{conductor.apellidos.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {conductor.nombres} {conductor.apellidos}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          RUT: {conductor.rut}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8125rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        <Phone size={12} /> {conductor.telefono}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                        <Mail size={12} /> {conductor.email}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      backgroundColor: conductor.claseLicencia === 'A5' ? 'rgba(59, 130, 246, 0.2)' : conductor.claseLicencia === 'A4' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(148, 163, 184, 0.2)',
                      color: conductor.claseLicencia === 'A5' ? 'var(--accent-secondary)' : conductor.claseLicencia === 'A4' ? 'var(--status-warning)' : 'var(--text-secondary)',
                      border: '1px solid currentColor'
                    }}>
                      Clase {conductor.claseLicencia}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {conductor.fechaVencimientoLicencia}
                    </div>
                    {conductor.licenciaVencida ? (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-error)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <ShieldAlert size={12} /> ¡VENCIDA!
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--status-success)' }}>
                        Vigente
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', maxWidth: '220px' }}>
                      {conductor.tiposHabilitados.length ? conductor.tiposHabilitados.map((tipo) => (
                        <span
                          key={tipo}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-tertiary)',
                            color: 'var(--text-secondary)'
                          }}
                        >
                          {tipo}
                        </span>
                      )) : <span className="text-muted">Ninguno</span>}
                    </div>
                  </td>
                  <td>
                    {conductor.estado === 'Disponible' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : conductor.estado === 'En viaje' ? (
                      <span className="badge badge-warning">En viaje</span>
                    ) : (
                      <div>
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <UserX size={12} /> Bloqueado
                        </span>
                        {conductor.motivoBloqueo && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)', maxWidth: '200px', lineHeight: 1.2 }}>
                            {conductor.motivoBloqueo}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <button type="button" onClick={() => openProfile(conductor)} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}>
                      Ver Perfil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Rule Banner */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--status-error-bg)',
        borderLeft: '4px solid var(--status-error)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        <AlertCircle size={20} color="var(--status-error)" />
        <div>
          <strong>Regla de negocio RN-04 / RF-203:</strong> Se impide asignar a un viaje cualquier conductor cuya licencia de conducir esté vencida (caso de <code>Carlos Gómez</code>) o cuya clase no habilite el tipo de camión del viaje (ej: <code>Luis Silva</code> con Clase B no puede tomar Semirremolques).
        </div>
      </div>
    </div>
  );
};
