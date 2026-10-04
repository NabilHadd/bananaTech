import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { getAuthSession, login } from '../api/auth';
import { LoginScreen } from '../components/features/auth/LoginScreen';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const session = getAuthSession();
  if (session) return <Navigate to="/flota" replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await login(username, password);
      const destination = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(destination, { replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setSending(false);
    }
  }

  return <LoginScreen
    username={username}
    password={password}
    error={error}
    sending={sending}
    onUsernameChange={setUsername}
    onPasswordChange={setPassword}
    onSubmit={submit}
  />;
}