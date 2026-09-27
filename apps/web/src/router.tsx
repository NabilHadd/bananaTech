import { Navigate, createBrowserRouter } from 'react-router';
import { Truck } from 'lucide-react';
import { AppLayout } from './components/common/AppLayout';
import type { NavItem } from './components/common/TopBar';
import { FlotaPage } from './pages/FlotaPage';

// Pestañas del top-bar. Cada página nueva se agrega aquí y en `children`.
const NAV_ITEMS: NavItem[] = [
  { to: '/flota', label: 'Flota', icon: <Truck size={16} /> },
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout navItems={NAV_ITEMS} />,
    children: [
      { index: true, element: <Navigate to="/flota" replace /> },
      { path: 'flota', element: <FlotaPage /> },
      { path: '*', element: <Navigate to="/flota" replace /> },
    ],
  },
]);
