import { useEffect, useState } from 'react';
import { Settings2 } from 'lucide-react';
import { actualizarParametro, getHistorialParametros, getParametros, type AuditoriaParametro, type ParametroNegocio } from '../api/parametros.api';
import { PageHeader } from '../components/common/PageHeader';
import { PARAMETRO_LABELS } from '../components/features/parametros/parametros.constants';
import { ParametroAuditTable } from '../components/features/parametros/ParametroAuditTable';
import { ParametroEditor } from '../components/features/parametros/ParametroEditor';

export function ParametrosPage() {
  const [parameters, setParameters] = useState<ParametroNegocio[]>([]);
  const [history, setHistory] = useState<AuditoriaParametro[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  async function refresh() {
    const [current, changes] = await Promise.all([getParametros(), getHistorialParametros()]);
    setParameters(current); setHistory(changes);
    setDrafts(Object.fromEntries(current.map((item) => [item.clave, item.valor])));
  }
  useEffect(() => {
    let active = true;
    Promise.all([getParametros(), getHistorialParametros()])
      .then(([current, changes]) => {
        if (!active) return;
        setParameters(current);
        setHistory(changes);
        setDrafts(Object.fromEntries(current.map((item) => [item.clave, item.valor])));
      })
      .catch((cause: unknown) => active && setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los parámetros.'));
    return () => { active = false; };
  }, []);

  async function save(parameter: ParametroNegocio) {
    setSaving(parameter.clave); setError(''); setMessage('');
    try {
      await actualizarParametro(parameter.clave, Number(drafts[parameter.clave]));
      await refresh(); setMessage(`${PARAMETRO_LABELS[parameter.clave] ?? parameter.clave} actualizado.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo guardar.'); }
    finally { setSaving(null); }
  }

  return <div className="page-view-enter stack-lg admin-page">
    <PageHeader title="Parámetros de negocio" icon={<Settings2 size={22} />} description="Tarifas y políticas vigentes para nuevos cálculos." />
    {message && <p className="form-success" role="status">{message}</p>}{error && <p className="form-error" role="alert">{error}</p>}
    <div className="parameter-layout">
      <ParametroEditor
        parameters={parameters}
        drafts={drafts}
        saving={saving}
        onChange={(clave, value) => setDrafts((current) => ({ ...current, [clave]: value }))}
        onSave={(parameter) => void save(parameter)}
      />
      <ParametroAuditTable history={history} />
    </div>
  </div>;
}