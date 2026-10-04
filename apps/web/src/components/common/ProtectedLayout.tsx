import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { Boxes, Building2, CircleDollarSign, LayoutDashboard, Navigation, Package, Settings, Truck, Users } from 'lucide-react';
import { clearAuthSession, getAuthSession } from '../../api/auth';
import { AppLayout } from './AppLayout';
import type { NavItem } from './TopBar';

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, adminOnly: true },
  { to: '/flota', label: 'Flota', icon: <Truck size={16} /> },
  { to: '/conductores', label: 'Conductores', icon: <Users size={16} /> },
  { to: '/clientes', label: 'Clientes', icon: <Building2 size={16} /> },
  { to: '/pedidos', label: 'Pedidos', icon: <Package size={16} /> },
  { to: '/cargas', label: 'Cargas', icon: <Boxes size={16} /> },
  { to: '/viajes', label: 'Viajes', icon: <Navigation size={16} /> },
  { to: '/usuarios', label: 'Usuarios', icon: <Users size={16} />, adminOnly: true },
  { to: '/parametros', label: 'Parámetros', icon: <Settings size={16} />, adminOnly: true },
  { to: '/reporte-costos', label: 'Costos', icon: <CircleDollarSign size={16} />, adminOnly: true },
];

export function ProtectedLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  useEffect(() => {
    const expired = () => refresh((value) => value + 1);
    window.addEventListener('auth-expired', expired);
    return () => window.removeEventListener('auth-expired', expired);
  }, []);

  const session = getAuthSession();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  const isAdmin = session.user.role === 'ADMINISTRADOR';
  const adminPaths = ['/dashboard', '/usuarios', '/parametros', '/reporte-costos'];
  const normalizedPath = location.pathname.replace(/\/+$/, '') || '/';
  if (!isAdmin && adminPaths.includes(normalizedPath)) {
    return <Navigate to="/flota" replace />;
  }

  const logout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  return <AppLayout navItems={NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin)}
    username={session.user.username} role={session.user.role} onLogout={logout} />;
}