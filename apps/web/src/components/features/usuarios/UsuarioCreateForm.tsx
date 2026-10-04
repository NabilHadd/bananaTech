import { useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import type { UsuarioAdmin } from '../../../api/usuarios.api';

interface UsuarioCreateFormProps {
  error: string;
  busy: boolean;
  onCreate: (username: string, password: string, rol: UsuarioAdmin['rol']) => Promise<void>;
}

export function UsuarioCreateForm({ error, busy, onCreate }: UsuarioCreateFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UsuarioAdmin['rol']>('PLANIFICADOR');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await onCreate(username, password, role);
      setUsername('');
      setPassword('');
    } catch {
      return;
    }
  }

  return (
    <section className="glass-panel admin-section">
      <h2><UserPlus size={18} /> Crear usuario</h2>
      <form className="admin-form" onSubmit={(event) => void submit(event)}>
        <label>Nombre de usuario<input minLength={3} value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
        <label>Contraseña inicial<input type="password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
        <label>Rol<select value={role} onChange={(event) => setRole(event.target.value as UsuarioAdmin['rol'])}><option value="PLANIFICADOR">Planificador</option><option value="ADMINISTRADOR">Administrador</option></select></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary" type="submit" disabled={busy}><UserPlus size={16} /> Crear cuenta</button>
      </form>
    </section>
  );
}