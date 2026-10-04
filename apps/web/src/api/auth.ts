export interface AuthUser {
  id: number;
  username: string;
  role: 'ADMINISTRADOR' | 'PLANIFICADOR';
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const SESSION_KEY = 'bananatech-session';
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/graphql',
).origin;

export function getAuthSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as AuthSession;
    const payload = session.token.split('.')[0].replaceAll('-', '+').replaceAll('_', '/');
    const expiresAt = JSON.parse(atob(payload + '='.repeat((4 - payload.length % 4) % 4))) as { exp?: number };
    if (!session.user?.role || !expiresAt.exp || expiresAt.exp <= Date.now() / 1000) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function login(username: string, password: string): Promise<AuthSession> {
  const response = await fetch(`${API_ORIGIN}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await response.json() as AuthSession | { detail?: string };
  if (!response.ok || !('token' in body)) {
    throw new Error(('detail' in body && body.detail) || 'No se pudo iniciar sesión.');
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(body));
  return body;
}