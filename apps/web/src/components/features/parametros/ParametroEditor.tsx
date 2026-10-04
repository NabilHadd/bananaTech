import { Save } from 'lucide-react';
import type { ParametroNegocio } from '../../../api/parametros.api';
import { PARAMETRO_LABELS } from './parametros.constants';

interface ParametroEditorProps {
  parameters: ParametroNegocio[];
  drafts: Record<string, string>;
  saving: string | null;
  onChange: (clave: string, value: string) => void;
  onSave: (parameter: ParametroNegocio) => void;
}

export function ParametroEditor({ parameters, drafts, saving, onChange, onSave }: ParametroEditorProps) {
  return (
    <section className="glass-panel admin-section"><h2>Economía y operación</h2>
      <div className="parameter-list">{parameters.map((parameter) => <div className="parameter-row" key={parameter.clave}>
        <div><strong>{PARAMETRO_LABELS[parameter.clave] ?? parameter.clave}</strong><small>{parameter.unidad}</small></div>
        <input aria-label={PARAMETRO_LABELS[parameter.clave] ?? parameter.clave} type="number" min="0" step={parameter.clave.includes('horas') ? '1' : '0.01'} value={drafts[parameter.clave] ?? ''} onChange={(event) => onChange(parameter.clave, event.target.value)} />
        <button className="btn btn-secondary" type="button" disabled={saving === parameter.clave || Number(drafts[parameter.clave]) === Number(parameter.valor)} onClick={() => onSave(parameter)} title="Guardar parámetro"><Save size={15} />Guardar</button>
      </div>)}</div>
    </section>
  );
}