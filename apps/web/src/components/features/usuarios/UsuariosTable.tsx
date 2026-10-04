import { ShieldCheck, Trash2 } from 'lucide-react';
import { DataTable } from '../../common/DataTable';
import type { Column } from '../../common/DataTable';
import type { UsuarioAdmin } from '../../../api/usuarios.api';

interface UsuariosTableProps {
  users: UsuarioAdmin[];
  onToggle: (user: UsuarioAdmin) => void;
  onDelete: (user: UsuarioAdmin) => void;
}

export function UsuariosTable({ users, onToggle, onDelete }: UsuariosTableProps) {
  const columns: Column<UsuarioAdmin>[] = [
    { key: 'username', header: 'Usuario', render: (user) => <strong>{user.username}</strong> },
    { key: 'role', header: 'Rol', render: (user) => <span className="role-label"><ShieldCheck size={14} />{user.rol === 'ADMINISTRADOR' ? 'Administrador' : 'Planificador'}</span> },
    { key: 'status', header: 'Estado', render: (user) => <span className={`state-label ${user.activo ? 'is-active' : 'is-off'}`}>{user.activo ? 'Activo' : 'Inactivo'}</span> },
    { key: 'actions', header: '', render: (user) => <button className="text-button" type="button" onClick={() => onToggle(user)}>{user.activo ? 'Desactivar' : 'Activar'}</button> },
      { key: 'actions', header: '', render: (user) => <>
        <button className="text-button user-delete-button" type="button" onClick={() => onDelete(user)} aria-label={`Eliminar ${user.username}`} title="Eliminar usuario"><Trash2 size={15} /></button>
      </> },
  ];

  return <DataTable columns={columns} rows={users} rowKey={(user) => user.id} />;
}