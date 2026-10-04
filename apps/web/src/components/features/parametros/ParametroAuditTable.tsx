import { Clock3 } from 'lucide-react';
import type { AuditoriaParametro } from '../../../api/parametros.api';
import { PARAMETRO_LABELS } from './parametros.constants';

interface ParametroAuditTableProps {
  history: AuditoriaParametro[];
}

export function ParametroAuditTable({ history }: ParametroAuditTableProps) {
  return (
    <section className="admin-section">
      <div className="admin-section-heading"><h2><Clock3 size={18} /> Cambios recientes</h2></div>
      <div className="glass-panel table-container"><table><thead><tr><th>Parámetro</th><th>Antes</th><th>Ahora</th><th>Quién</th><th>Cuándo</th></tr></thead>
        <tbody>{history.slice(0, 30).map((event) => <tr key={event.id}><td>{PARAMETRO_LABELS[event.clave] ?? event.clave}</td><td>{event.valorAnterior}</td><td>{event.valorNuevo}</td><td>{event.cambiadoPor}</td><td>{new Date(event.cambiadoEn).toLocaleString('es-CL')}</td></tr>)}</tbody>
      </table></div>
    </section>
  );
}