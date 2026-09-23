import React, { useState } from 'react';
import { useCamionesState } from '../data/mockData';
import type { Camion } from '../data/mockData';
import { DocumentModal } from './DocumentModal';
import { TruckDetailModal } from './TruckDetailModal';
import { CustomSelect } from './CustomSelect';
import { CustomSwitch } from './CustomSwitch';
import { ModalPortal } from './ModalPortal';
import {
  Truck,
  Search,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
  RotateCcw,
  X,
  Check,
  FileText,
  Eye,
  FilterX,
  SlidersHorizontal
} from 'lucide-react';

const TIPO_OPTIONS = [
  { value: 'todos', label: 'Todos los tipos' },
  { value: 'Rampla plana', label: 'Rampla plana', sublabel: 'Cargas estándar y pallets' },
  { value: 'Semirremolque', label: 'Semirremolque', sublabel: 'Carga pesada articulada' },
  { value: '3/4', label: '3/4 (Liviano)', sublabel: 'Distribución ágil urbana' }
];

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'Disponible', label: 'Disponible', sublabel: 'Habilitado para asignación' },
  { value: 'Bloqueado', label: 'Bloqueado', sublabel: 'Restringido por documento o taller' }
];

const CAPACIDAD_OPTIONS = [
  { value: '0', label: 'Cualquier capacidad' },
  { value: '5000', label: '≥ 5.000 kg', sublabel: 'Mediano / Pesado' },
  { value: '15000', label: '≥ 15.000 kg', sublabel: 'Alta capacidad' },
  { value: '25000', label: '≥ 25.000 kg', sublabel: 'Gran tonelaje' }
];

export const FlotaView: React.FC = () => {
  const [camiones, setCamiones] = useCamionesState();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [filterState, setFilterState] = useState<string>('todos');
  const [filterMinCapacidadKg, setFilterMinCapacidadKg] = useState<number | ''>('');
  const [showInactivos, setShowInactivos] = useState<boolean>(true);

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [editingCamion, setEditingCamion] = useState<Camion | null>(null);
  const [bajaCamionTarget, setBajaCamionTarget] = useState<Camion | null>(null);
  const [selectedDocCamion, setSelectedDocCamion] = useState<Camion | null>(null);
  const [selectedFichaCamion, setSelectedFichaCamion] = useState<Camion | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Create/Edit
  const [formData, setFormData] = useState({
    patente: '',
    marca: 'Volvo',
    modelo: '',
    anio: 2024,
    tipo: 'Rampla plana' as '3/4' | 'Semirremolque' | 'Rampla plana',
    pesoMaxKg: 25000,
    volumenMaxM3: 90,
    rendimientoBaseKmL: 2.8,
    kilometrajeActual: 10000,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenRegister = () => {
    setFormData({
      patente: '',
      marca: 'Volvo',
      modelo: '',
      anio: 2024,
      tipo: 'Rampla plana',
      pesoMaxKg: 25000,
      volumenMaxM3: 90,
      rendimientoBaseKmL: 2.8,
      kilometrajeActual: 0,
    });
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (camion: Camion) => {
    setEditingCamion(camion);
    setFormData({
      patente: camion.patente,
      marca: camion.marca,
      modelo: camion.modelo,
      anio: camion.anio,
      tipo: camion.tipo,
      pesoMaxKg: camion.pesoMaxKg,
      volumenMaxM3: camion.volumenMaxM3,
      rendimientoBaseKmL: camion.rendimientoBaseKmL,
      kilometrajeActual: camion.kilometrajeActual,
    });
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetPatente = formData.patente.toUpperCase().trim();

    // Validación Criterio 1 - HU1.1: Rechazar registro si la patente ya existe
    const patenteExistente = camiones.some(
      (c) => c.patente === targetPatente && c.id !== editingCamion?.id
    );

    if (patenteExistente) {
      showToast(`⚠ Error (HU1.1): La patente "${targetPatente}" ya se encuentra registrada en la flota.`);
      return;
    }

    if (editingCamion) {
      // EDIT
      setCamiones((prev) =>
        prev.map((c) =>
          c.id === editingCamion.id
            ? {
              ...c,
              patente: formData.patente.toUpperCase().trim(),
              marca: formData.marca.trim(),
              modelo: formData.modelo.trim(),
              anio: Number(formData.anio),
              tipo: formData.tipo,
              pesoMaxKg: Number(formData.pesoMaxKg),
              volumenMaxM3: Number(formData.volumenMaxM3),
              rendimientoBaseKmL: Number(formData.rendimientoBaseKmL),
              kilometrajeActual: Number(formData.kilometrajeActual),
            }
            : c
        )
      );
      showToast(`Camión ${formData.patente.toUpperCase()} actualizado correctamente.`);
      setEditingCamion(null);
    } else {
      // REGISTER NEW
      const newId = camiones.length > 0 ? Math.max(...camiones.map((c) => c.id)) + 1 : 1;
      const newCodigo = `CAM-0${newId}`;
      const newCamion: Camion = {
        id: newId,
        codigo: newCodigo,
        patente: formData.patente.toUpperCase().trim(),
        marca: formData.marca.trim(),
        modelo: formData.modelo.trim(),
        anio: Number(formData.anio),
        tipo: formData.tipo,
        pesoMaxKg: Number(formData.pesoMaxKg),
        volumenMaxM3: Number(formData.volumenMaxM3),
        rendimientoBaseKmL: Number(formData.rendimientoBaseKmL),
        kilometrajeActual: Number(formData.kilometrajeActual),
        estado: 'Disponible',
        activo: true,
        documentos: [
          { id: Date.now(), tipo: 'RT', nombre: 'Revisión Técnica', fechaEmision: '2026-01-01', fechaVencimiento: '2027-01-01', vencido: false },
          { id: Date.now() + 1, tipo: 'PC', nombre: 'Permiso de Circulación', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
          { id: Date.now() + 2, tipo: 'SOAP', nombre: 'Seguro Obligatorio (SOAP)', fechaEmision: '2026-03-01', fechaVencimiento: '2027-03-31', vencido: false },
        ]
      };
      setCamiones((prev) => [newCamion, ...prev]);
      showToast(`Camión ${newCamion.patente} registrado con éxito.`);
      setIsRegisterOpen(false);
    }
  };

  const handleConfirmBaja = () => {
    if (!bajaCamionTarget) return;
    setCamiones((prev) =>
      prev.map((c) =>
        c.id === bajaCamionTarget.id ? { ...c, activo: false } : c
      )
    );
    showToast(`Camión ${bajaCamionTarget.patente} dado de baja (baja lógica RNF-06 aplicada).`);
    setBajaCamionTarget(null);
  };

  const handleReactivar = (camion: Camion) => {
    setCamiones((prev) =>
      prev.map((c) => (c.id === camion.id ? { ...c, activo: true } : c))
    );
    showToast(`Camión ${camion.patente} reactivado exitosamente.`);
  };

  const activeFiltersCount =
    (filterType !== 'todos' ? 1 : 0) +
    (filterState !== 'todos' ? 1 : 0) +
    (filterMinCapacidadKg !== '' && Number(filterMinCapacidadKg) > 0 ? 1 : 0) +
    (searchTerm.trim() !== '' ? 1 : 0) +
    (!showInactivos ? 1 : 0);

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterType('todos');
    setFilterState('todos');
    setFilterMinCapacidadKg('');
    setShowInactivos(true);
  };

  const filteredCamiones = camiones.filter((camion) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      camion.patente.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      camion.tipo.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === 'todos' || camion.tipo === filterType;
    const matchesState = filterState === 'todos' || camion.estado === filterState;
    const minCap = filterMinCapacidadKg === '' ? 0 : Number(filterMinCapacidadKg);
    const matchesCapacidad = minCap === 0 || camion.pesoMaxKg >= minCap;
    const matchesActivo = showInactivos ? true : camion.activo;

    return matchesSearch && matchesType && matchesState && matchesCapacidad && matchesActivo;
  });

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-enter" style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-primary)',
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          fontSize: '0.875rem'
        }}>
          <Check size={18} color="var(--status-success)" />
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Truck color="var(--accent-primary)" /> Gestión de Flota & Ficha Técnica
          </h1>
          <p className="text-muted">
            Inventario de vehículos, filtros combinables avanzados y trazabilidad de historial de viajes y documentos vigentes
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleOpenRegister} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Plus size={16} />Registrar Camión
          </button>
        </div>
      </div>

      {/* Combinable Filters Bar (Custom & Non-Primitive) */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', position: 'relative', zIndex: 30 }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Quick Search with modern focus styling */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            padding: '0.5rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            minWidth: '280px',
            flex: '1 1 280px',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
          }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              placeholder="Buscar por patente, código, marca o modelo..."
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
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Custom Filter Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Filter Tipo */}
            <CustomSelect
              label="Tipo"
              value={filterType}
              options={TIPO_OPTIONS}
              onChange={setFilterType}
              minWidth="175px"
            />

            {/* Filter Estado */}
            <CustomSelect
              label="Estado"
              value={filterState}
              options={ESTADO_OPTIONS}
              onChange={setFilterState}
              minWidth="155px"
            />

            {/* Filter Capacidad Mínima */}
            <CustomSelect
              label="Capacidad"
              value={filterMinCapacidadKg === '' ? '0' : String(filterMinCapacidadKg)}
              options={CAPACIDAD_OPTIONS}
              onChange={(val) => setFilterMinCapacidadKg(val === '0' ? '' : Number(val))}
              minWidth="180px"
            />

            {/* Custom Toggle Switch for Dados de Baja */}
            <div style={{ marginLeft: '0.25rem' }}>
              <CustomSwitch
                checked={showInactivos}
                onChange={setShowInactivos}
                label="Mostrar dados de baja"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Quick Reset Strip */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid var(--border-color)',
          fontSize: '0.8125rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'var(--text-tertiary)' }}>
              Mostrando <strong style={{ color: 'var(--text-primary)' }}>{filteredCamiones.length}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{camiones.length}</strong> vehículos
            </span>

            {activeFiltersCount > 0 && (
              <span style={{
                backgroundColor: 'var(--accent-glow)',
                color: 'var(--accent-primary)',
                fontSize: '0.75rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '12px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <SlidersHorizontal size={12} /> {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-secondary"
              style={{
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <FilterX size={13} /> Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-panel" style={{ padding: '1.5rem', position: 'relative', zIndex: 1 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patente / Código</th>
                <th>Marca / Modelo / Año</th>
                <th>Tipo</th>
                <th>Capacidad Máxima</th>
                <th>Rendimiento & Km</th>
                <th>Documentos</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCamiones.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
                    <FilterX size={36} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '0.75rem' }} />
                    <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginBottom: '0.35rem' }}>
                      No se encontraron camiones con los filtros combinados
                    </div>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', maxWidth: '480px', margin: '0 auto 1.25rem', lineHeight: 1.4 }}>
                      Ningún camión cumple simultáneamente con las condiciones seleccionadas (Tipo: <strong>{filterType}</strong>, Estado: <strong>{filterState}</strong>, Capacidad mín: <strong>{filterMinCapacidadKg ? `${filterMinCapacidadKg.toLocaleString('es-CL')} kg` : 'Cualquiera'}</strong>).
                    </p>
                    <button onClick={handleResetFilters} className="btn btn-secondary" style={{ fontSize: '0.8125rem' }}>
                      Restablecer Todos los Filtros
                    </button>
                  </td>
                </tr>
              )}

              {filteredCamiones.map((camion: Camion) => (
                <tr key={camion.id} style={{ opacity: camion.activo ? 1 : 0.55 }}>
                  <td>
                    <div
                      onClick={() => setSelectedFichaCamion(camion)}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
                      title="Haga clic para ver ficha técnica e historial"
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: !camion.activo ? 'rgba(255,255,255,0.05)' : camion.estado === 'Bloqueado' ? 'var(--status-error-bg)' : 'var(--accent-glow)',
                        color: !camion.activo ? 'var(--text-tertiary)' : camion.estado === 'Bloqueado' ? 'var(--status-error)' : 'var(--accent-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600
                      }}>
                        {camion.codigo.split('-')[1]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          {camion.patente}
                          <Eye size={12} color="var(--accent-primary)" style={{ opacity: 0.7 }} />
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                          {camion.codigo} {!camion.activo && '• [INACTIVO]'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {camion.marca} {camion.modelo}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Año {camion.anio}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      color: 'var(--text-primary)'
                    }}>
                      {camion.tipo}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {camion.pesoMaxKg.toLocaleString('es-CL')} kg
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      Volumen: {camion.volumenMaxM3} m³
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {camion.rendimientoBaseKmL.toFixed(1)} km/L
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                      {camion.kilometrajeActual.toLocaleString('es-CL')} km
                    </div>
                  </td>
                  <td>
                    <div
                      onClick={() => setSelectedDocCamion(camion)}
                      style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', cursor: 'pointer' }}
                      title="Haga clic para gestionar o renovar documentos"
                    >
                      {camion.documentos.map((doc) => (
                        <span
                          key={doc.id}
                          title={`${doc.nombre} - Vence: ${doc.fechaVencimiento}`}
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            fontWeight: 600,
                            backgroundColor: doc.vencido ? 'var(--status-error-bg)' : 'rgba(255,255,255,0.05)',
                            color: doc.vencido ? 'var(--status-error)' : 'var(--text-secondary)',
                            border: doc.vencido ? '1px solid var(--status-error)' : '1px solid var(--border-color)'
                          }}
                        >
                          {doc.tipo} {doc.vencido ? '⚠ Vencido' : '✓'}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    {!camion.activo ? (
                      <span className="badge badge-neutral">Dado de Baja</span>
                    ) : camion.estado === 'Disponible' ? (
                      <span className="badge badge-success" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <CheckCircle2 size={12} /> Disponible
                      </span>
                    ) : (
                      <div>
                        <span className="badge badge-error" style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          <ShieldAlert size={12} /> Bloqueado
                        </span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => setSelectedFichaCamion(camion)}
                        className="btn btn-secondary"
                        style={{
                          padding: '0.35rem 0.6rem',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          backgroundColor: 'var(--accent-glow)',
                          color: 'var(--accent-primary)',
                          borderColor: 'var(--accent-primary)'
                        }}
                        title="Ver ficha técnica, odómetro, documentos e historial de viajes"
                      >
                        <Eye size={13} /> Ficha
                      </button>

                      <button
                        onClick={() => setSelectedDocCamion(camion)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Gestionar y renovar documentos"
                      >
                        <FileText size={13} color="var(--accent-primary)" /> Docs
                      </button>

                      <button
                        onClick={() => handleOpenEdit(camion)}
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        title="Editar atributos del camión"
                      >
                        <Edit2 size={13} /> Editar
                      </button>

                      {camion.activo ? (
                        <button
                          onClick={() => setBajaCamionTarget(camion)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Dar de baja lógica (RNF-06)"
                        >
                          <Trash2 size={13} /> Baja
                        </button>
                      ) : (
                        <button
                          onClick={() => handleReactivar(camion)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          title="Reactivar camión"
                        >
                          <RotateCcw size={13} /> Reactivar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Registrar / Editar Camión */}
      {(isRegisterOpen || editingCamion) && (
        <ModalPortal>
          <div className="modal-backdrop">
          <div className="glass-panel modal-window" style={{
            width: '100%',
            maxWidth: '560px',
            padding: '2rem',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Truck color="var(--accent-primary)" size={22} />
                {editingCamion ? `Editar Camión (${editingCamion.patente})` : 'Registrar Nuevo Camión'}
              </h2>
              <button
                type="button"
                onClick={() => { setIsRegisterOpen(false); setEditingCamion(null); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* Row 1: Patente & Año */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Patente (Formato: AAAA-00) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABCD-12"
                    value={formData.patente}
                    onChange={(e) => setFormData({ ...formData, patente: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Año de Fabricación *
                  </label>
                  <input
                    type="number"
                    required
                    min={1990}
                    max={2030}
                    value={formData.anio}
                    onChange={(e) => setFormData({ ...formData, anio: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 2: Marca & Modelo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Marca *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Volvo, Scania, Mercedes-Benz..."
                    value={formData.marca}
                    onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Modelo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="FH 500, R450, Atego 1018..."
                    value={formData.modelo}
                    onChange={(e) => setFormData({ ...formData, modelo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 3: Tipo de Camión */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Tipo de Camión (Catálogo BD) *
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.8rem',
                    backgroundColor: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="Rampla plana">Rampla plana</option>
                  <option value="Semirremolque">Semirremolque</option>
                  <option value="3/4">3/4 (Carga Liviana)</option>
                </select>
              </div>

              {/* Row 4: Capacidades (kg y m³) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Capacidad Máxima (kg) *
                  </label>
                  <input
                    type="number"
                    required
                    min={500}
                    max={50000}
                    value={formData.pesoMaxKg}
                    onChange={(e) => setFormData({ ...formData, pesoMaxKg: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Capacidad Volumen (m³) *
                  </label>
                  <input
                    type="number"
                    required
                    min={5}
                    max={200}
                    value={formData.volumenMaxM3}
                    onChange={(e) => setFormData({ ...formData, volumenMaxM3: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Row 5: Rendimiento & Kilometraje */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Rendimiento Base (km/L) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    min={0.5}
                    max={15}
                    value={formData.rendimientoBaseKmL}
                    onChange={(e) => setFormData({ ...formData, rendimientoBaseKmL: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    Kilometraje Actual (km) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.kilometrajeActual}
                    onChange={(e) => setFormData({ ...formData, kilometrajeActual: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.8rem',
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => { setIsRegisterOpen(false); setEditingCamion(null); }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCamion ? 'Guardar Cambios' : 'Registrar Camión'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* MODAL: Confirmar Baja Lógica (RNF-06) */}
      {bajaCamionTarget && (
        <ModalPortal>
          <div className="modal-backdrop">
          <div className="glass-panel modal-window" style={{
            width: '100%',
            maxWidth: '460px',
            padding: '2rem',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'var(--status-error-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--status-error)'
              }}>
                <Trash2 size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-primary)' }}>
                  ¿Dar de baja camión {bajaCamionTarget.patente}?
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  {bajaCamionTarget.marca} {bajaCamionTarget.modelo} ({bajaCamionTarget.codigo})
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              De acuerdo con el requerimiento <strong>RNF-06</strong>, se aplicará una <strong>baja lógica (borrado suave)</strong>. El camión dejará de estar disponible para nuevos viajes pero <strong>se preservará todo su historial</strong> de viajes y mantenciones.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => setBajaCamionTarget(null)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmBaja}
                className="btn btn-primary"
                style={{ backgroundColor: 'var(--status-error)', borderColor: 'var(--status-error)' }}
              >
                Confirmar Baja
              </button>
            </div>
          </div>
        </div>
        </ModalPortal>
      )}

      {/* MODAL: Gestión de Documentos (HU 1.2) */}
      {selectedDocCamion && (
        <DocumentModal
          camion={selectedDocCamion}
          onClose={() => setSelectedDocCamion(null)}
          onSuccess={(msg) => {
            showToast(msg);
            setSelectedDocCamion(null);
          }}
        />
      )}

      {/* MODAL: Ficha Técnica & Historial del Camión (HU 1.3) */}
      {selectedFichaCamion && (
        <TruckDetailModal
          camion={selectedFichaCamion}
          onClose={() => setSelectedFichaCamion(null)}
          onEdit={(c) => {
            setSelectedFichaCamion(null);
            handleOpenEdit(c);
          }}
          onRenewDocs={(c) => {
            setSelectedFichaCamion(null);
            setSelectedDocCamion(c);
          }}
        />
      )}

      {/* Business Rule Banner */}
      <div style={{
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '4px solid var(--accent-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.875rem',
        color: 'var(--text-primary)'
      }}>
        <AlertCircle size={20} color="var(--accent-primary)" />
        <div>
          Administración de inventario de flota con atributos técnicos, bajas lógicas, auditoría de vencimiento de documentos y exclusión automática, más filtros combinados simultáneos (tipo, estado, capacidad mínima) y ficha técnica con historial de viajes.
        </div>
      </div>
    </div>
  );
};
