import type { FormEventHandler } from 'react';
import { LockKeyhole, Truck } from 'lucide-react';

interface LoginScreenProps {
  username: string;
  password: string;
  error: string;
  sending: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export function LoginScreen({
  username,
  password,
  error,
  sending,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
}: LoginScreenProps) {
  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-brand"><Truck size={22} /><span>TNC Logística</span></div>
        <div className="login-heading">
          <span className="login-kicker">ACCESO OPERACIONAL</span>
          <h1>Iniciar sesión</h1>
          <p>Ingresa tus credenciales para continuar.</p>
        </div>
        <form className="admin-form login-form" onSubmit={onSubmit}>
          <label>Usuario<input autoComplete="username" value={username} onChange={(event) => onUsernameChange(event.target.value)} required /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => onPasswordChange(event.target.value)} required /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={sending}>
            <LockKeyhole size={16} /> {sending ? 'Validando…' : 'Entrar'}
          </button>
        </form>
      </section>
      <aside className="login-aside" aria-hidden="true">
        <div className="login-aside-rule" />
        <p>Centro de control</p>
        <strong>La operación,<br />en ruta.</strong>
        <span>TRANSPORTES NORTE CHICO</span>
      </aside>
    </main>
  );
}