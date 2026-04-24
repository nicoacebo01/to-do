import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../services/firebase';
import { addUser } from '../../services/requestService';
import { Team } from '../../types';
import { Loader2, Lock, Mail, Lightbulb, ShieldAlert, User, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ALLOWED_DOMAIN = 'lartirigoyen.com';

type Screen = 'login' | 'register' | 'forgot' | 'forgot-sent';

export const LoginView: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('login');

  const isValidDomain = (value: string) =>
    value.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 mb-4">
            <Lightbulb className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight">Ideas & Mejoras</h1>
          <p className="text-zinc-500 text-sm mt-1">Equipo de Finanzas · @{ALLOWED_DOMAIN}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-zinc-200/60 border border-zinc-100 p-8">
          <AnimatePresence mode="wait">
            {screen === 'login' && (
              <LoginForm key="login" isValidDomain={isValidDomain} onRegister={() => setScreen('register')} onForgot={() => setScreen('forgot')} />
            )}
            {screen === 'register' && (
              <RegisterForm key="register" isValidDomain={isValidDomain} onBack={() => setScreen('login')} />
            )}
            {screen === 'forgot' && (
              <ForgotForm key="forgot" isValidDomain={isValidDomain} onBack={() => setScreen('login')} onSent={() => setScreen('forgot-sent')} />
            )}
            {screen === 'forgot-sent' && (
              <ForgotSent key="forgot-sent" onBack={() => setScreen('login')} />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

// ── Login ──────────────────────────────────────────────────────────────────
const LoginForm: React.FC<{
  isValidDomain: (v: string) => boolean;
  onRegister: () => void;
  onForgot: () => void;
}> = ({ isValidDomain, onRegister, onForgot }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const domainWarning = email.includes('@') && !isValidDomain(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDomain(email)) { setError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}`); return; }
    setError(''); setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    } catch {
      setError('Email o contraseña incorrectos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <h2 className="text-lg font-bold text-zinc-800 mb-6">Iniciá sesión</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailField value={email} onChange={setEmail} domainWarning={domainWarning} />
        <PasswordField value={password} onChange={setPassword} />
        {error && <ErrorMsg text={error} />}
        <SubmitBtn loading={loading} disabled={domainWarning} label="Ingresar" />
      </form>
      <div className="mt-5 flex flex-col gap-2 text-center">
        <button onClick={onForgot} className="text-xs text-zinc-400 hover:text-indigo-600 transition-colors">
          Olvidé mi contraseña
        </button>
        <div className="border-t border-zinc-100 pt-3">
          <span className="text-xs text-zinc-500">¿Primera vez? </span>
          <button onClick={onRegister} className="text-xs font-bold text-indigo-600 hover:underline">
            Creá tu cuenta
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ── Register ───────────────────────────────────────────────────────────────
const RegisterForm: React.FC<{
  isValidDomain: (v: string) => boolean;
  onBack: () => void;
}> = ({ isValidDomain, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [team, setTeam] = useState<Team>(Team.PLANIFICACION);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const domainWarning = email.includes('@') && !isValidDomain(email);
  const passwordMismatch = confirm.length > 0 && password !== confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDomain(email)) { setError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}`); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setError(''); setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await addUser({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        team,
        role: 'MEMBER',
      });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con ese email. Iniciá sesión.');
      } else {
        setError('Error al crear la cuenta. Intentá de nuevo.');
      }
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-bold text-zinc-800">Crear cuenta</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre completo</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input required value={name} onChange={e => setName(e.target.value)} placeholder="Juan Pérez" className={`${inputClass} pl-9`} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Equipo</label>
          <select value={team} onChange={e => setTeam(e.target.value as Team)} className={inputClass}>
            {Object.values(Team).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <EmailField value={email} onChange={setEmail} domainWarning={domainWarning} />

        <div>
          <label className={labelClass}>Contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input required type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className={`${inputClass} pl-9`} />
          </div>
        </div>

        <div>
          <label className={labelClass}>Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repetí la contraseña" className={`${inputClass} pl-9 ${passwordMismatch ? 'border-red-300 focus:ring-red-400' : ''}`} />
          </div>
          {passwordMismatch && <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>}
        </div>

        {error && <ErrorMsg text={error} />}
        <SubmitBtn loading={loading} disabled={domainWarning || passwordMismatch} label="Crear cuenta" />
      </form>
    </motion.div>
  );
};

// ── Forgot password ────────────────────────────────────────────────────────
const ForgotForm: React.FC<{
  isValidDomain: (v: string) => boolean;
  onBack: () => void;
  onSent: () => void;
}> = ({ isValidDomain, onBack, onSent }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const domainWarning = email.includes('@') && !isValidDomain(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDomain(email)) { setError(`Solo se permiten cuentas @${ALLOWED_DOMAIN}`); return; }
    setError(''); setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      onSent();
    } catch {
      setError('No encontramos una cuenta con ese email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-all">
          <ArrowLeft size={16} />
        </button>
        <h2 className="text-lg font-bold text-zinc-800">Recuperar contraseña</h2>
      </div>
      <p className="text-sm text-zinc-500 mb-4">Ingresá tu email y te enviamos un link para restablecer tu contraseña.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <EmailField value={email} onChange={setEmail} domainWarning={domainWarning} />
        {error && <ErrorMsg text={error} />}
        <SubmitBtn loading={loading} disabled={domainWarning} label="Enviar link" />
      </form>
    </motion.div>
  );
};

const ForgotSent: React.FC<{ onBack: () => void }> = ({ onBack }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <CheckCircle2 className="text-emerald-600" size={28} />
    </div>
    <h3 className="font-black text-zinc-900 text-lg">¡Email enviado!</h3>
    <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
      Revisá tu bandeja de entrada y seguí las instrucciones para restablecer tu contraseña.
    </p>
    <button onClick={onBack} className="mt-6 text-sm font-bold text-indigo-600 hover:underline">
      Volver al login
    </button>
  </motion.div>
);

// ── Shared components ──────────────────────────────────────────────────────
const labelClass = 'block text-xs font-bold text-zinc-600 uppercase tracking-wider mb-1.5';
const inputClass = 'w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm';

const EmailField: React.FC<{ value: string; onChange: (v: string) => void; domainWarning: boolean }> = ({ value, onChange, domainWarning }) => (
  <div>
    <label className={labelClass}>Email institucional</label>
    <div className="relative">
      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
      <input
        type="email" required value={value} onChange={e => onChange(e.target.value)}
        placeholder={`tu@${ALLOWED_DOMAIN}`}
        className={`${inputClass} pl-9 ${domainWarning ? 'border-red-300 focus:ring-red-400' : ''}`}
      />
    </div>
    {domainWarning && (
      <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
        <ShieldAlert size={11} /> Solo se aceptan cuentas @{ALLOWED_DOMAIN}
      </p>
    )}
  </div>
);

const PasswordField: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => (
  <div>
    <label className={labelClass}>Contraseña</label>
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
      <input type="password" required value={value} onChange={e => onChange(e.target.value)} placeholder="••••••••" className={`${inputClass} pl-9`} />
    </div>
  </div>
);

const ErrorMsg: React.FC<{ text: string }> = ({ text }) => (
  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
    className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
    <ShieldAlert size={16} className="flex-shrink-0" /> {text}
  </motion.div>
);

const SubmitBtn: React.FC<{ loading: boolean; disabled: boolean; label: string }> = ({ loading, disabled, label }) => (
  <button type="submit" disabled={loading || disabled}
    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-2">
    {loading ? <><Loader2 size={18} className="animate-spin" /> Procesando...</> : label}
  </button>
);
