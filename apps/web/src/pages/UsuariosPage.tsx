import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { cambiarEstadoUsuario, crearUsuario, eliminarUsuario, getUsuarios, type UsuarioAdmin } from '../api/usuarios.api';
import { PageHeader } from '../components/common/PageHeader';
import { UsuarioCreateForm } from '../components/features/usuarios/UsuarioCreateForm';
import { UsuariosTable } from '../components/features/usuarios/UsuariosTable';

export function UsuariosPage() {
  const [users, setUsers] = useState<UsuarioAdmin[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
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
    try { await cambiarEstadoUsuario(user.id, !user.activo); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo actualizar el usuario.'); }
  }

  async function remove(user: UsuarioAdmin) {
    if (!window.confirm(`¿Eliminar definitivamente a ${user.username}? El historial conservará su nombre.`)) return;
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
          <UsuariosTable users={users} onToggle={(user) => void toggle(user)} onDelete={(user) => void remove(user)} />
        </div>
      </section>
    </div>
  </div>;
}