import { Navigate, createBrowserRouter } from 'react-router';
import { Boxes, Building2, Package, Truck, Users } from 'lucide-react';
import { AppLayout } from './components/common/AppLayout';
import type { NavItem } from './components/common/TopBar';
import { CargasPage } from './pages/CargasPage';
import { ClientesPage } from './pages/ClientesPage';
import { ConductoresPage } from './pages/ConductoresPage';
import { FlotaPage } from './pages/FlotaPage';
import { PedidosPage } from './pages/PedidosPage';

// Pestañas del top-bar. Cada página nueva se agrega aquí y en `children`.
const NAV_ITEMS: NavItem[] = [
  { to: '/flota', label: 'Flota', icon: <Truck size={16} /> },
  { to: '/conductores', label: 'Conductores', icon: <Users size={16} /> },
  { to: '/clientes', label: 'Clientes', icon: <Building2 size={16} /> },
  { to: '/pedidos', label: 'Pedidos', icon: <Package size={16} /> },
  { to: '/cargas', label: 'Cargas', icon: <Boxes size={16} /> },
];

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout navItems={NAV_ITEMS} />,
    children: [
      { index: true, element: <Navigate to="/flota" replace /> },
      { path: 'flota', element: <FlotaPage /> },
      { path: 'conductores', element: <ConductoresPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'pedidos', element: <PedidosPage /> },
      { path: 'cargas', element: <CargasPage /> },
      { path: '*', element: <Navigate to="/flota" replace /> },
    ],
  },
]);
