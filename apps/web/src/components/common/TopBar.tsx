import React from 'react';
import { NavLink } from 'react-router';
import { Truck } from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon?: React.ReactNode;
}

interface TopBarProps {
  items: NavItem[];
}

export const TopBar: React.FC<TopBarProps> = ({ items }) => (
  <header className="topbar">
    <div className="page-container topbar-inner">
      <div className="topbar-brand">
        <div className="topbar-logo">
          <Truck color="var(--accent-primary)" size={18} />
        </div>
        <div>
          <div className="topbar-brand-name">TNC Logística</div>
          <div className="topbar-brand-sub">Transportes Norte Chico</div>
        </div>
      </div>

      <nav className="topbar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  </header>
);
