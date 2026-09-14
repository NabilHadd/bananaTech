import React from 'react';

const MOCK_TRUCKS = [
  { id: 'T-01', plate: 'PXXT-99', type: 'Semirremolque', status: 'En ruta', destination: 'Antofagasta', driver: 'Juan Pérez' },
  { id: 'T-02', plate: 'KKLM-23', type: 'Rampa Plana', status: 'Disponible', destination: '-', driver: '-' },
  { id: 'T-03', plate: 'FFGH-12', type: '3/4', status: 'En mantención', destination: '-', driver: '-' },
  { id: 'T-04', plate: 'HHYY-88', type: 'Semirremolque', status: 'En ruta', destination: 'Santiago', driver: 'Carlos Soto' },
];

export const TruckList: React.FC = () => {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ margin: 0 }}>Estado de la Flota</h2>
        <button className="btn btn-secondary">Ver todos</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patente</th>
              <th>Tipo</th>
              <th>Conductor</th>
              <th>Destino</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_TRUCKS.map((truck) => (
              <tr key={truck.id}>
                <td style={{ fontWeight: 500 }}>{truck.id}</td>
                <td>{truck.plate}</td>
                <td className="text-muted">{truck.type}</td>
                <td>{truck.driver}</td>
                <td>{truck.destination}</td>
                <td>
                  <span className={`badge badge-${
                    truck.status === 'En ruta' ? 'success' :
                    truck.status === 'Disponible' ? 'warning' : 'error'
                  }`}>
                    {truck.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
