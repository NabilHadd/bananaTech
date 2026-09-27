import React from 'react';
import { Outlet } from 'react-router';
import { TopBar } from './TopBar';
import type { NavItem } from './TopBar';

interface AppLayoutProps {
  navItems: NavItem[];
}

/** Estructura común a todas las páginas: top-bar arriba y la página activa debajo. */
export const AppLayout: React.FC<AppLayoutProps> = ({ navItems }) => (
  <div className="app-container">
    <TopBar items={navItems} />
    <main className="page-content">
      <div className="page-container">
        <Outlet />
      </div>
    </main>
  </div>
);
