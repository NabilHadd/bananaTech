import { useEffect, useState } from 'react';
import { Trash2, UserCheck, UserX, Users } from 'lucide-react';
import { cambiarEstadoUsuario, crearUsuario, eliminarUsuario, getUsuarios, type UsuarioAdmin } from '../api/usuarios.api';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { PageHeader } from '../components/common/PageHeader';
import { UsuarioCreateForm } from '../components/features/usuarios/UsuarioCreateForm';
import { UsuariosTable } from '../components/features/usuarios/UsuariosTable';

export function UsuariosPage() {
  const [users, setUsers] = useState<UsuarioAdmin[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [porEliminar, setPorEliminar] = useState<UsuarioAdmin | null>(null);
  const [porCambiarEstado, setPorCambiarEstado] = useState<UsuarioAdmin | null>(null);
  const refresh = () => getUsuarios().then(setUsers).catch((cause) => setError(cause.message));
  useEffect(() => { void refresh(); }, []);

  async function create(username: string, password: string, role: UsuarioAdmin['rol']) {
    setBusy(true); setError('');
    try {
      await crearUsuario(username, password, role);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo crear el usuario.');
      throw cause;
    }
    finally { setBusy(false); }
  }

  async function toggle(user: UsuarioAdmin) {
    setPorCambiarEstado(null);
    setError('');
    try { await cambiarEstadoUsuario(user.id, !user.activo); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el usuario.'); }
  }

  async function remove(user: UsuarioAdmin) {
    setPorEliminar(null);
    setError('');
    try { await eliminarUsuario(user.id); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo eliminar el usuario.'); }
  }

  return <div className="page-view-enter stack-lg admin-page">
    <PageHeader title="Gestión de usuarios" icon={<Users size={22} />} description="Cuentas y permisos de acceso a la operación." />
    <div className="admin-split">
      <UsuarioCreateForm error={error} busy={busy} onCreate={create} />
      <section className="admin-section">
        <div className="admin-section-heading"><h2>Usuarios registrados</h2><span>{users.length} cuentas</span></div>
        <div className="glass-panel">
          <UsuariosTable users={users} onToggle={setPorCambiarEstado} onDelete={setPorEliminar} />
        </div>
      </section>
    </div>
    {porCambiarEstado && (
      <ConfirmDialog
        tone={porCambiarEstado.activo ? 'danger' : 'default'}
        icon={porCambiarEstado.activo
          ? <UserX size={22} color="var(--status-error)" />
          : <UserCheck size={22} />}
        title={`¿${porCambiarEstado.activo ? 'Desactivar' : 'Activar'} a ${porCambiarEstado.username}?`}
        confirmLabel={porCambiarEstado.activo ? 'Desactivar usuario' : 'Activar usuario'}
        onCancel={() => setPorCambiarEstado(null)}
        onConfirm={() => void toggle(porCambiarEstado)}
      >
        {porCambiarEstado.activo
          ? 'No podrá iniciar sesión y sus sesiones abiertas dejarán de funcionar hasta que se vuelva a activar.'
          : 'Podrá volver a iniciar sesión con su contraseña actual.'}
      </ConfirmDialog>
    )}
    {porEliminar && (
      <ConfirmDialog
        tone="danger"
        icon={<Trash2 size={22} color="var(--status-error)" />}
        title={`¿Eliminar a ${porEliminar.username}?`}
        subtitle="Esta acción no se puede deshacer."
        confirmLabel="Eliminar usuario"
        onCancel={() => setPorEliminar(null)}
        onConfirm={() => void remove(porEliminar)}
      >
        La cuenta se elimina definitivamente. El historial de cambios de parámetros conservará su nombre.
      </ConfirmDialog>
    )}
  </div>;
}