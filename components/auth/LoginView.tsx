import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { Loader2, Lock, Mail, Lightbulb, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const ALLOWED_DOMAIN = 'lartirigoyen.com';

export const LoginView: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValidDomain = (value: string) =>
    value.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isValidDomain(email)) {
      setError(`Solo se permiten cuentas con dominio @${ALLOWED_DOMAIN}`);
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch {
      setError('Email o contraseña incorrectos. Verificá tus datos.');
    } finally {
      setLoading(false);
    }
  };

  const domainWarning = email.length > 0 && email.includes('@') && !isValidDomain(email);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <Lightbulb className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Ideas & Mejoras</h1>
          <p className="text-zinc-500 text-sm mt-1">Equipo de Finanzas</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/60 border border-zinc-100 p-8">
          <h2 className="text-lg font-bold text-zinc-800 mb-6">Iniciá sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Email institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={`tu@${ALLOWED_DOMAIN}`}
                  className={`w-full pl-9 pr-4 py-3 rounded-xl border bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
                    domainWarning
                      ? 'border-red-300 focus:ring-red-400'
                      : 'border-zinc-200 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {domainWarning && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-red-500 mt-1.5 flex items-center gap-1"
                >
                  <ShieldAlert size={11} />
                  Solo se aceptan cuentas @{ALLOWED_DOMAIN}
                </motion.p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2"
              >
                <ShieldAlert size={16} className="flex-shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading || domainWarning}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Exclusivo para el equipo de Finanzas · @{ALLOWED_DOMAIN}
        </p>
      </motion.div>
    </div>
  );
};
