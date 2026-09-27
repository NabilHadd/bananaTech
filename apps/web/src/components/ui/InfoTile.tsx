import React from 'react';

interface InfoTileProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

/** Par etiqueta / valor dentro de una tarjeta, para fichas de detalle. */
export const InfoTile: React.FC<InfoTileProps> = ({ label, value, icon }) => (
  <div className="info-tile">
    <div className="info-tile-label">{label}</div>
    <div className="info-tile-value">
      {icon}
      {value}
    </div>
  </div>
);
