import { Navigate, createBrowserRouter } from 'react-router';
import { ProtectedLayout } from './components/common/ProtectedLayout';
import { CargasPage } from './pages/CargasPage';
import { ClientesPage } from './pages/ClientesPage';
import { ConductoresPage } from './pages/ConductoresPage';
import { FlotaPage } from './pages/FlotaPage';
import { PedidosPage } from './pages/PedidosPage';
import { ViajesPage } from './pages/ViajesPage';
import { LoginPage } from './pages/LoginPage';
import { UsuariosPage } from './pages/UsuariosPage';
import { ParametrosPage } from './pages/ParametrosPage';
import { ReporteCostosPage } from './pages/ReporteCostosPage';
import { DashboardPage } from './pages/DashboardPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'flota', element: <FlotaPage /> },
      { path: 'conductores', element: <ConductoresPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'pedidos', element: <PedidosPage /> },
      { path: 'cargas', element: <CargasPage /> },
      { path: 'viajes', element: <ViajesPage /> },
      { path: 'usuarios', element: <UsuariosPage /> },
      { path: 'parametros', element: <ParametrosPage /> },
      { path: 'reporte-costos', element: <ReporteCostosPage /> },
      { path: '*', element: <Navigate to="/flota" replace /> },
    ],
  },
]);
