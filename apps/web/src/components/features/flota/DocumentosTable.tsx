import React from 'react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import { Button } from '../../ui/Button';
import { VigenciaBadge } from './FlotaBadges';
import { DOCUMENTO_LABEL } from './flota.constants';
import type { DocumentoCamion } from './types';

interface DocumentosTableProps {
  documentos: DocumentoCamion[];
  /** Si se omite (camión dado de baja), la tabla es de sólo lectura. */
  onRenovar?: (documento: DocumentoCamion) => void;
}

export const DocumentosTable: React.FC<DocumentosTableProps> = ({ documentos, onRenovar }) => {
  const columns: Column<DocumentoCamion>[] = [
    { key: 'tipo', header: 'Código', render: (d) => <strong>{d.tipo}</strong> },
    { key: 'nombre', header: 'Documento', render: (d) => DOCUMENTO_LABEL[d.tipo] },
    { key: 'emision', header: 'Emisión', render: (d) => d.fechaEmision },
    {
      key: 'vencimiento',
      header: 'Vencimiento',
      render: (d) => (
        <span style={{ fontWeight: d.vigente ? 500 : 700, color: d.vigente ? undefined : 'var(--status-error)' }}>
          {d.fechaVencimiento}
        </span>
      ),
    },
    { key: 'estado', header: 'Estado', render: (d) => <VigenciaBadge vigente={d.vigente} /> },
  ];
  if (onRenovar) {
    columns.push({
      key: 'accion',
      header: 'Acción',
      render: (d) => (
        <Button size="sm" onClick={() => onRenovar(d)}>
          {d.vigente ? 'Actualizar' : 'Renovar'}
        </Button>
      ),
    });
  }

  return <DataTable columns={columns} rows={documentos} rowKey={(d) => d.id} bordered />;
};
