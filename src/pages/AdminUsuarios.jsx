import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import Card from '../components/Card.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import { authService } from '../services/authService.js';

export default function AdminUsuarios() {
  const currentUser = authService.getCurrentUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal Crear Usuario
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'operador',
  });
  const [submittingCreate, setSubmittingCreate] = useState(false);

  // Modal Editar Rol / Estado
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ role: 'operador', active: true });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Modal Cambiar Contraseña
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [submittingPassword, setSubmittingPassword] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await authService.listUsers();
      setUsers(list);
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const notifySuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // 1. Crear Usuario
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (createForm.password !== createForm.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (createForm.password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmittingCreate(true);
    try {
      await authService.createUser({
        username: createForm.username,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      });
      setShowCreateModal(false);
      setCreateForm({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'operador',
      });
      notifySuccess(`Usuario "${createForm.username}" creado exitosamente.`);
      await loadUsers();
    } catch (err) {
      alert('Error al crear usuario: ' + err.message);
    } finally {
      setSubmittingCreate(false);
    }
  };

  // 2. Editar Usuario
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmittingEdit(true);
    try {
      await authService.updateUser(editingUser.id, editForm);
      setEditingUser(null);
      notifySuccess(`Usuario "${editingUser.username}" actualizado.`);
      await loadUsers();
    } catch (err) {
      alert('Error al actualizar: ' + err.message);
    } finally {
      setSubmittingEdit(false);
    }
  };

  // 3. Cambiar Contraseña
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('Las contraseñas no coinciden.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      alert('La contraseña debe tener como mínimo 8 caracteres.');
      return;
    }

    setSubmittingPassword(true);
    try {
      await authService.changePassword(passwordUser.id, passwordForm.newPassword);
      setPasswordUser(null);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      notifySuccess(`Contraseña de "${passwordUser.username}" actualizada correctamente.`);
      await loadUsers();
    } catch (err) {
      alert('Error al cambiar contraseña: ' + err.message);
    } finally {
      setSubmittingPassword(false);
    }
  };

  // 4. Desbloquear Usuario
  const handleUnlock = async (user) => {
    if (window.confirm(`¿Desea desbloquear la cuenta de "${user.username}"?`)) {
      try {
        await authService.unlockUser(user.id);
        notifySuccess(`Cuenta de "${user.username}" desbloqueada.`);
        await loadUsers();
      } catch (err) {
        alert('Error al desbloquear: ' + err.message);
      }
    }
  };

  // 5. Eliminar Usuario
  const handleDelete = async (user) => {
    if (user.id === currentUser?.userId) {
      alert('No puede eliminar su propia cuenta de Administrador.');
      return;
    }
    if (
      window.confirm(
        `¿Está seguro de que desea eliminar permanentemente al usuario "${user.username}" (${user.email})?`
      )
    ) {
      try {
        await authService.deleteUser(user.id);
        notifySuccess(`Usuario "${user.username}" eliminado.`);
        await loadUsers();
      } catch (err) {
        alert('Error al eliminar: ' + err.message);
      }
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'editor':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'operador':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-stone-100 text-stone-600 border-stone-200';
    }
  };

  const isUserLocked = (user) => {
    if (!user.lockedUntil) return false;
    return new Date(user.lockedUntil) > new Date();
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
              Usuarios y Permisos
            </h1>
            <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono text-[10px] font-bold">
              SECCIÓN H
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Gestión de cuentas del personal administrativo, asignación de roles (admin, editor, operador) y seguridad.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={RefreshCw} loading={loading} onClick={loadUsers}>
            Actualizar
          </Button>
          <Button size="sm" icon={UserPlus} onClick={() => setShowCreateModal(true)}>
            Nuevo Usuario
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <Card padding="p-6">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Cuentas Registradas en Firestore (`admin_users`)
            </h3>
          </div>
          <span className="text-xs text-stone-400 font-mono">
            {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5">Usuario / Correo</th>
                <th className="py-2.5">Rol</th>
                <th className="py-2.5">Estado</th>
                <th className="py-2.5">Seguridad</th>
                <th className="py-2.5">Último Acceso</th>
                <th className="py-2.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => {
                const locked = isUserLocked(u);
                return (
                  <tr key={u.id} className="hover:bg-stone-50/70">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-xs uppercase border border-stone-200">
                          {u.username?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <span className="font-bold text-stone-900 block font-mono">
                            {u.username}
                          </span>
                          <span className="text-[11px] text-stone-500">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3">
                      {locked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <Lock className="w-3 h-3" /> Bloqueado
                        </span>
                      ) : u.active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                          Inactivo
                        </span>
                      )}
                    </td>

                    <td className="py-3 font-mono text-[11px] text-stone-500">
                      {u.failedAttempts > 0 ? (
                        <span className="text-amber-600 font-bold">
                          {u.failedAttempts} fallos
                        </span>
                      ) : (
                        <span className="text-stone-400">0 fallos</span>
                      )}
                    </td>

                    <td className="py-3 text-[11px] text-stone-500">
                      {u.lastLogin ? (
                        new Date(u.lastLogin).toLocaleString('es-AR')
                      ) : (
                        <span className="text-stone-400">Nunca</span>
                      )}
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {locked && (
                          <button
                            onClick={() => handleUnlock(u)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded cursor-pointer"
                            title="Desbloquear cuenta"
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setEditForm({ role: u.role, active: u.active !== false });
                          }}
                          className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded cursor-pointer"
                          title="Modificar rol o estado"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => {
                            setPasswordUser(u);
                            setPasswordForm({ newPassword: '', confirmPassword: '' });
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                          title="Cambiar contraseña"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {u.id !== currentUser?.userId && (
                          <button
                            onClick={() => handleDelete(u)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal: Crear Usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Dar de Alta Usuario Administrativo"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Nombre de Usuario (Login)
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                placeholder="ej. editor_ariq"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Correo Electrónico Oficial
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="ejemplo@ariq.org.ar"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Rol Asignado
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
            >
              <option value="operador">Operador (Inscripciones y Mensajes de Contacto)</option>
              <option value="editor">Editor (Noticias, Cursos, Eventos)</option>
              <option value="admin">Administrador General (Acceso Total y Seguridad)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Contraseña (mínimo 8 caracteres)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={createForm.confirmPassword}
                onChange={(e) => setCreateForm({ ...createForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
            <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={submittingCreate}>
              Crear Usuario
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Editar Usuario */}
      {editingUser && (
        <Modal
          isOpen={true}
          onClose={() => setEditingUser(null)}
          title={`Editar Usuario: ${editingUser.username}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Rol</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
              >
                <option value="operador">Operador</option>
                <option value="editor">Editor</option>
                <option value="admin">Administrador General</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="activeToggle"
                checked={editForm.active}
                onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })}
                className="w-4 h-4 text-red-600 rounded border-stone-300 focus:ring-red-500"
              />
              <label htmlFor="activeToggle" className="font-semibold text-stone-700 cursor-pointer">
                Cuenta Activa (permite inicio de sesión)
              </label>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
              <Button variant="outline" type="button" onClick={() => setEditingUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submittingEdit}>
                Guardar Modificaciones
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Cambiar Contraseña */}
      {passwordUser && (
        <Modal
          isOpen={true}
          onClose={() => setPasswordUser(null)}
          title={`Actualizar Contraseña: ${passwordUser.username}`}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Nueva Contraseña (mínimo 8 caracteres)
              </label>
              <input
                type="password"
                required
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                }
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
              />
            </div>

            <div className="p-2.5 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
              La contraseña se cifrará con salt mediante bcrypt (cost factor 12) antes de persistir en Firestore.
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-stone-100">
              <Button variant="outline" type="button" onClick={() => setPasswordUser(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={submittingPassword}>
                Actualizar Contraseña
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
