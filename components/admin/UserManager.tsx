import React, { useEffect, useState } from 'react';
import { subscribeToUsers, removeUser, updateUserRole } from '../../services/requestService';
import { AppUser, UserRole } from '../../types';
import { Users, Trash2, Loader2, Shield, User, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const ROLE_LABELS: Record<UserRole, string> = {
  AMBASSADOR: '🏆 Embajador',
  MEMBER: '👤 Miembro',
};

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [changingRole, setChangingRole] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUsers((data) => {
      setUsers(data.sort((a, b) => {
        if (a.role === 'AMBASSADOR' && b.role !== 'AMBASSADOR') return -1;
        if (b.role === 'AMBASSADOR' && a.role !== 'AMBASSADOR') return 1;
        return a.name.localeCompare(b.name);
      }));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleRemove = async (email: string) => {
    setRemoving(email);
    await removeUser(email);
    setRemoving(null);
    setConfirmRemove(null);
  };

  const handleRoleChange = async (email: string, role: UserRole) => {
    setChangingRole(email);
    await updateUserRole(email, role);
    setChangingRole(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <Users className="text-indigo-600" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-zinc-900">Gestión de usuarios</h1>
          <p className="text-xs text-zinc-500">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-700 leading-relaxed">
        Los usuarios se registran solos desde la pantalla de login con su email <strong>@lartirigoyen.com</strong>.
        Acá podés cambiar su rol o eliminarlos.
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Users size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">Todavía no hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {users.map((u) => (
                <div key={u.email} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    u.role === 'AMBASSADOR' ? 'bg-amber-100' : 'bg-indigo-100'
                  }`}>
                    {u.role === 'AMBASSADOR'
                      ? <Shield size={18} className="text-amber-600" />
                      : <User size={18} className="text-indigo-600" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{u.email}</div>
                    <div className="text-xs text-zinc-400">{u.team}</div>
                  </div>

                  {/* Role selector */}
                  <div className="flex-shrink-0">
                    {changingRole === u.email ? (
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                        className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                          u.role === 'AMBASSADOR'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}
                      >
                        <option value="MEMBER">👤 Miembro</option>
                        <option value="AMBASSADOR">🏆 Embajador</option>
                      </select>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="flex-shrink-0">
                    <AnimatePresence mode="wait">
                      {confirmRemove === u.email ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-xs text-red-500 font-semibold flex items-center gap-1">
                            <AlertTriangle size={11} /> ¿Eliminar?
                          </span>
                          <button
                            onClick={() => handleRemove(u.email)}
                            disabled={removing === u.email}
                            className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-red-600 transition-all"
                          >
                            {removing === u.email ? <Loader2 size={12} className="animate-spin" /> : 'Sí'}
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="text-xs bg-zinc-100 text-zinc-600 px-2.5 py-1 rounded-lg font-bold"
                          >
                            No
                          </button>
                        </motion.div>
                      ) : (
                        <motion.button
                          key="delete"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setConfirmRemove(u.email)}
                          className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
        <strong>Nota:</strong> Al eliminar un usuario pierde acceso a la app, pero su cuenta de Firebase Authentication permanece activa. Para eliminarla completamente ir a la consola de Firebase.
      </div>
    </div>
  );
};
