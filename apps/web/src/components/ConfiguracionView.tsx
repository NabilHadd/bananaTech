import React, { useState } from 'react';
import { PARAMETROS_SISTEMA } from '../data/mockData';
import { Settings, Fuel, DollarSign, Clock, MapPin, Save, Check } from 'lucide-react';

export const ConfiguracionView: React.FC = () => {
  const [params, setParams] = useState(PARAMETROS_SISTEMA);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      {/* Header */}
      <div>
        <h1 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Settings color="var(--accent-primary)" /> Parámetros del Sistema
        </h1>
        <p className="text-muted">
          Configuración operativa y variables de costeo (Requerimiento RF-703: Configurable sin redespliegue)
        </p>
      </div>

      {saved && (
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--status-success-bg)',
          borderLeft: '4px solid var(--status-success)',
          color: 'var(--status-success)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <Check size={18} /> Parámetros guardados correctamente.
        </div>
      )}

      <form onSubmit={handleSave} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ margin: 0, fontSize: '1.125rem' }}>Variables de Costeo de Viajes (RF-605)</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <Fuel size={16} color="var(--accent-primary)" /> Precio Litro Diésel (CLP)
            </label>
            <input
              type="number"
              value={params.precioDieselLitro}
              onChange={(e) => setParams({ ...params, precioDieselLitro: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Utilizado para estimar costo combustible según km y rendimiento</span>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <DollarSign size={16} color="var(--accent-primary)" /> Viático por Día (CLP)
            </label>
            <input
              type="number"
              value={params.viaticoDia}
              onChange={(e) => setParams({ ...params, viaticoDia: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Asignación de alimentación y pernocte para conductores</span>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <DollarSign size={16} color="var(--accent-primary)" /> Costo por Km Desgaste (CLP/km)
            </label>
            <input
              type="number"
              value={params.costoKmDesgaste}
              onChange={(e) => setParams({ ...params, costoKmDesgaste: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Neumáticos, lubricantes y depreciación variable</span>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
              <Clock size={16} color="var(--accent-primary)" /> Descanso Mínimo entre Viajes (Horas)
            </label>
            <input
              type="number"
              value={params.descansoMinimoHoras}
              onChange={(e) => setParams({ ...params, descansoMinimoHoras: Number(e.target.value) })}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem'
              }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Regla RN-06: descanso obligatorio para asignar nuevo viaje</span>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            <MapPin size={16} color="var(--accent-primary)" /> Base de Operaciones Principal
          </label>
          <input
            type="text"
            disabled
            value={params.baseOperaciones}
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
              cursor: 'not-allowed'
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Guardar Parámetros
          </button>
        </div>
      </form>
    </div>
  );
};
