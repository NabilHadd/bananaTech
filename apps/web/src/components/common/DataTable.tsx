import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  /** Filas atenuadas, p. ej. registros dados de baja. */
  isRowMuted?: (row: T) => boolean;
  /** Se muestra en lugar de las filas cuando `rows` está vacío. */
  empty?: React.ReactNode;
  bordered?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  isRowMuted,
  empty,
  bordered = false,
}: DataTableProps<T>) {
  return (
    <div className={`table-container${bordered ? ' bordered' : ''}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={[
                  onRowClick && 'row-clickable',
                  isRowMuted?.(row) && 'row-muted',
                ].filter(Boolean).join(' ') || undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
