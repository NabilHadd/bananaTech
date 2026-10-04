import React from 'react';
import { Outlet } from 'react-router';
import { TopBar } from './TopBar';
import type { NavItem } from './TopBar';

interface AppLayoutProps {
  navItems: NavItem[];
  username: string;
  role: string;
  onLogout: () => void;
}

/** Estructura común a todas las páginas: top-bar arriba y la página activa debajo. */
export const AppLayout: React.FC<AppLayoutProps> = ({ navItems, username, role, onLogout }) => (
  <div className="app-container">
    <TopBar items={navItems} username={username} role={role} onLogout={onLogout} />
    <main className="page-content">
      <div className="page-container">
        <Outlet />
      </div>
    </main>
  </div>
);
