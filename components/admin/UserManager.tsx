import React, { useEffect, useState } from 'react';
import { subscribeToUsers, addUser, removeUser } from '../../services/requestService';
import { AppUser, Team, UserRole } from '../../types';
import { Users, Plus, Trash2, Loader2, Shield, User, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';

const ROLE_LABELS: Record<UserRole, string> = {
  AMBASSADOR: '🏆 Embajador',
  MEMBER: '👤 Miembro',
};

export const UserManager: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    team: Team.PLANIFICACION,
    role: 'MEMBER' as UserRole,
    password: '',
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      // Create Firebase Auth account
      await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      // Send password reset so user can choose their own
      await sendPasswordResetEmail(auth, form.email.trim());
      // Save to Firestore
      await addUser({
        email: form.email.trim().toLowerCase(),
        name: form.name.trim(),
        team: form.team,
        role: form.role,
      });
      setForm({ name: '', email: '', team: Team.PLANIFICACION, role: 'MEMBER', password: '' });
      setShowForm(false);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        // User exists in Auth, just add to Firestore
        try {
          await addUser({
            email: form.email.trim().toLowerCase(),
            name: form.name.trim(),
            team: form.team,
            role: form.role,
          });
          setForm({ name: '', email: '', team: Team.PLANIFICACION, role: 'MEMBER', password: '' });
          setShowForm(false);
        } catch {
          setFormError('Error al guardar el usuario.');
        }
      } else {
        setFormError('Error al crear el usuario. Verificá los datos.');
        console.error(err);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (email: string) => {
    setRemoving(email);
    await removeUser(email);
    setRemoving(null);
    setConfirmRemove(null);
  };

  const inputClass = 'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Users className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900">Gestión de usuarios</h1>
            <p className="text-xs text-zinc-500">{users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus size={16} /> Agregar usuario
        </button>
      </div>

      {/* Add user form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-black text-zinc-700">Nuevo usuario</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Juan Pérez"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="juan@empresa.com"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Equipo</label>
                  <select
                    value={form.team}
                    onChange={(e) => setForm((p) => ({ ...p, team: e.target.value as Team }))}
                    className={inputClass}
                  >
                    {Object.values(Team).map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Rol</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm((p) => ({ ...p, role: e.target.value as UserRole }))}
                    className={inputClass}
                  >
                    <option value="MEMBER">Miembro</option>
                    <option value="AMBASSADOR">Embajador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Contraseña inicial
                </label>
                <input
                  required
                  type="password"
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                  className={inputClass}
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Se enviará un email para que el usuario establezca su propia contraseña.
                </p>
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-sm hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <><Plus size={16} /> Agregar</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

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
              <p className="text-sm">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-50">
              {users.map((u) => (
                <div key={u.email} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    u.role === 'AMBASSADOR' ? 'bg-amber-100' : 'bg-indigo-100'
                  }`}>
                    {u.role === 'AMBASSADOR'
                      ? <Shield size={18} className="text-amber-600" />
                      : <User size={18} className="text-indigo-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 text-sm">{u.name}</div>
                    <div className="text-xs text-zinc-500 truncate">{u.email}</div>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-xs text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full">
                      {u.team}
                    </span>
                  </div>
                  <div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      u.role === 'AMBASSADOR'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {ROLE_LABELS[u.role]}
                    </span>
                  </div>
                  <div>
                    {confirmRemove === u.email ? (
                      <div className="flex items-center gap-2">
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
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemove(u.email)}
                        className="p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar usuario"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-700">
        <strong>Nota:</strong> Al eliminar un usuario de esta lista, pierde acceso a la app pero su cuenta de Firebase Authentication permanece. Para eliminarla completamente, ir a la consola de Firebase.
      </div>
    </div>
  );
};
