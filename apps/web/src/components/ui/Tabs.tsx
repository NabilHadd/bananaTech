import React from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: React.ReactNode;
  /** Muestra un indicador de alerta junto a la etiqueta. */
  alert?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
}

export function Tabs<T extends string>({ items, active, onChange }: TabsProps<T>) {
  return (
    <div className="tabs" role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={item.id === active}
          className={`tab${item.id === active ? ' active' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.icon}
          {item.label}
          {item.alert && <span className="tab-alert">!</span>}
        </button>
      ))}
    </div>
  );
}
