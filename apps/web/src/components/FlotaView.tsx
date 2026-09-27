import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Pencil, Plus, Search, ShieldAlert, Trash2, Truck, Weight } from 'lucide-react';
import {
  createTruck,
  deleteTruck,
  getFleet,
  setTruckActive,
  updateTruck,
} from '../lib/fleetApi';
import type { CamionFlota, TipoCamionFlota } from '../lib/fleetApi';

interface CamionForm {
  patente: string;
  idTipoCamion: string;
  pesoKg: string;
  volumenM3: string;
}

const EMPTY_FORM: CamionForm = {
  patente: '',
  idTipoCamion: '',
  pesoKg: '',
  volumenM3: '',
};

export const FlotaView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterState, setFilterState] = useState<string>('todos');
  const [camiones, setCamiones] = useState<CamionFlota[]>([]);
  const [tiposCamion, setTiposCamion] = useState<TipoCamionFlota[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CamionForm>(EMPTY_FORM);
  const [editing, setEditing] = useState<CamionFlota | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    let active = true;
    void getFleet()
      .then((data) => {
        if (!active) return;
        setCamiones(data.camiones);
        setTiposCamion(data.tiposCamion);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar la flota');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const closeForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(false);
  };

  const openEdit = (camion: CamionFlota) => {
    setEditing(camion);
    setShowForm(true);
    setForm({
      patente: camion.patente,
      idTipoCamion: String(camion.idTipoCamion),
      pesoKg: camion.pesoKg,
      volumenM3: camion.volumenM3,
    });
    setError(null);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const input = {
        patente: form.patente.trim().toUpperCase(),
        idTipoCamion: Number(form.idTipoCamion),
        pesoKg: Number(form.pesoKg),
        volumenM3: Number(form.volumenM3),
      };
      const camion = editing
        ? await updateTruck(editing.id, input)
        : await createTruck(input);
      setCamiones((current) => editing
        ? current.map((item) => item.id === camion.id ? camion : item)
        : [...current, camion].sort((left, right) => left.patente.localeCompare(right.patente)));
      closeForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el camión');
    } finally {
      setSaving(false);
    }
  };

  const handleActiveChange = async (camion: CamionFlota) => {
    setError(null);
    try {
      const updated = await setTruckActive(camion.id, !camion.activo);
      setCamiones((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'No se pudo cambiar el estado');
    }
  };

  const handleDelete = async (camion: CamionFlota) => {
    setError(null);
    try {
      await deleteTruck(camion.id);
      setCamiones((current) => current.filter((item) => item.id !== camion.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el camión');
    }
  };

  const filteredCamiones = camiones.filter((camion) => {
    const tipo = tiposCamion.find((item) => item.id === camion.idTipoCamion)?.tipo ?? '';
    const matchesSearch = `${camion.patente} ${tipo}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'todos' || String(camion.idTipoCamion) === filterType;
    const matchesState = filterState === 'todos' ||
      (filterState === 'habilitado' && camion.activo && camion.habilitado) ||
      (filterState === 'restringido' && camion.activo && !camion.habilitado) ||
      (filterState === 'inactivo' && !camion.activo);

    return matchesSearch && matchesType && matchesState;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck color="var(--accent-primary)" /> Gestión de Flota
          </h1>
          <p className="text-muted">
            Estado operativo, capacidad y documentación legal por vehículo
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-primary"
            onClick={() => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); setError(null); }}
          >
            <Plus size={16} /> Registrar camión
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" className="glass-panel" style={{ padding: '0.85rem 1rem', color: 'var(--status-error)', borderColor: 'var(--status-error)' }}>
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSave} className="glass-panel" style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
            Patente
            <input required maxLength={12} value={form.patente} onChange={(event) => setForm({ ...form, patente: event.target.value })} />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
            Tipo de camión
            <select required value={form.idTipoCamion} onChange={(event) => setForm({ ...form, idTipoCamion: event.target.value })}>
              <option value="">Seleccionar tipo</option>
              {tiposCamion.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>)}
            </select>
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
            Peso máximo (kg)
            <input required min="0.01" step="0.01" type="number" value={form.pesoKg} onChange={(event) => setForm({ ...form, pesoKg: event.target.value })} />
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.8rem' }}>
            Volumen máximo (m³)
            <input required min="0.01" step="0.01" type="number" value={form.volumenM3} onChange={(event) => setForm({ ...form, volumenM3: event.target.value })} />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear camión'}</button>
            <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancelar</button>
          </div>
        </form>
      )}

      {loading && <p className="text-muted">Cargando flota…</p>}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', minWidth: '260px' }}>
          <Search size={16} color="var(--text-tertiary)" />
          <input
            type="text"
            placeholder="Buscar por patente o código..."
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
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>Tipo:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
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
              <option value="todos">Todos los tipos</option>
              {tiposCamion.map((tipo) => <option key={tipo.id} value={tipo.id}>{tipo.tipo}</option>)}
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
              <option value="habilitado">Habilitado</option>
              <option value="restringido">Con restricciones</option>
              <option value="inactivo">Desactivado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código / Patente</th>
                <th>Tipo de Camión</th>
                <th>Capacidad Carga</th>
                <th>Documentación Legal</th>
                <th>Estado Operativo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCamiones.map((camion) => (
                <tr key={camion.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: !camion.activo || !camion.habilitado ? 'var(--status-error-bg)' : 'var(--accent-glow)',
                        color: !camion.activo || !camion.habilitado ? 'var(--status-error)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        {camion.patente.slice(-2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
                          {camion.patente}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      fontSize: '0.8125rem'
                    }}>
                      {tiposCamion.find((tipo) => tipo.id === camion.idTipoCamion)?.tipo ?? 'Sin tipo'}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Weight size={14} color="var(--text-secondary)" />
                        {Number(camion.pesoKg).toLocaleString('es-CL')} kg
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Volumen: {camion.volumenM3} m³
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {camion.documentos.map((doc) => (
                        <span
                          key={doc.id}
                          title={`Vence: ${doc.fechaVencimiento}`}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor: doc.vigente ? 'rgba(255,255,255,0.05)' : 'var(--status-error-bg)',
                            color: doc.vigente ? 'var(--text-secondary)' : 'var(--status-error)',
                            border: doc.vigente ? '1px solid var(--border-color)' : '1px solid var(--status-error)'
                          }}
                        >
                          {doc.tipo} {doc.vigente ? '✓' : 'Vencido'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {camion.activo && camion.habilitado ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Habilitado
                      </span>
                    ) : (
                      <div>
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <ShieldAlert size={12} /> {!camion.activo ? 'Desactivado' : 'No habilitado'}
                        </span>
                        {camion.restricciones.length > 0 && (
                          <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.75rem', color: 'var(--status-error)', maxWidth: '200px', lineHeight: 1.2 }}>
                            {camion.restricciones.join('; ')}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button type="button" className="btn btn-secondary" title="Editar camión" onClick={() => openEdit(camion)}>
                        <Pencil size={14} />
                      </button>
                      <button type="button" className="btn btn-secondary" title="Eliminar camión" onClick={() => void handleDelete(camion)}>
                        <Trash2 size={14} />
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => void handleActiveChange(camion)}>
                        {camion.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
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
        backgroundColor: 'var(--status-warning-bg)',
        borderLeft: '4px solid var(--status-warning)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        <AlertCircle size={20} color="var(--status-warning)" />
        <div>
          <strong>Regla de negocio RN-05 / RF-103:</strong> El sistema bloquea de forma automática la asignación a viajes de cualquier camión que posea al menos un documento legal vencido (como el camión <code>EFGH-34</code> con su Revisión Técnica expirada).
        </div>
      </div>
    </div>
  );
};
