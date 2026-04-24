import React, { useState, useEffect, Suspense, lazy } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginView } from './components/auth/LoginView';
import { AppView } from './types';
import {
  LayoutDashboard, Lightbulb, BarChart2, Settings, LogOut,
  Plus, Loader2, Users, AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const RequestForm = lazy(() => import('./components/requests/RequestForm').then(m => ({ default: m.RequestForm })));
const RequestDetail = lazy(() => import('./components/requests/RequestDetail').then(m => ({ default: m.RequestDetail })));
const StatsView = lazy(() => import('./components/stats/StatsView').then(m => ({ default: m.StatsView })));
const UserManager = lazy(() => import('./components/admin/UserManager').then(m => ({ default: m.UserManager })));

const LoadingSpinner: React.FC = () => (
  <div className="flex-1 flex items-center justify-center">
    <Loader2 className="animate-spin text-indigo-600" size={36} />
  </div>
);

const UnauthorizedScreen: React.FC = () => {
  const handleLogout = () => signOut(auth);
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-zinc-100 p-10 text-center"
      >
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="text-red-500" size={32} />
        </div>
        <h2 className="text-xl font-black text-zinc-900">Sin acceso</h2>
        <p className="text-zinc-500 text-sm mt-3 leading-relaxed">
          Tu cuenta no está autorizada para usar esta aplicación. Contactá al Embajador Tecnológico para solicitar acceso.
        </p>
        <button
          onClick={handleLogout}
          className="mt-8 px-6 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold rounded-xl transition-all text-sm flex items-center gap-2 mx-auto"
        >
          <LogOut size={16} /> Cerrar sesión
        </button>
      </motion.div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { firebaseUser, appUser, loading, isAmbassador } = useAuth();
  const [view, setView] = useState<AppView>('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Reset to dashboard if appUser logs out
  useEffect(() => {
    if (!appUser) setView('dashboard');
  }, [appUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (!firebaseUser) return <LoginView />;
  if (!appUser) return <UnauthorizedScreen />;

  const handleOpenDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedId(null);
    setView('dashboard');
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const navItems = [
    { id: 'dashboard' as AppView, label: 'Solicitudes', icon: LayoutDashboard },
    { id: 'new' as AppView, label: 'Nueva idea', icon: Plus },
    ...(isAmbassador ? [
      { id: 'stats' as AppView, label: 'Estadísticas', icon: BarChart2 },
      { id: 'admin' as AppView, label: 'Usuarios', icon: Users },
    ] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500 p-1.5 rounded-lg">
              <Lightbulb className="text-white" size={20} />
            </div>
            <div>
              <span className="font-black text-base tracking-tight">Ideas & Mejoras</span>
              <span className="hidden sm:inline text-indigo-300 text-xs ml-2">Finanzas</span>
            </div>
            {isAmbassador && (
              <span className="hidden md:inline ml-2 px-2 py-0.5 bg-amber-500 text-amber-950 text-[10px] font-black uppercase tracking-widest rounded-full">
                Embajador
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setView(id); setSelectedId(null); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                  view === id && selectedId === null
                    ? 'bg-white/20 text-white'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}

            <div className="w-px h-5 bg-indigo-700 mx-1" />

            <div className="flex items-center gap-2">
              <div className="hidden md:block text-right">
                <div className="text-xs font-semibold text-white leading-none">{appUser.name}</div>
                <div className="text-[10px] text-indigo-300 leading-none mt-0.5">{appUser.team}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-indigo-300 hover:text-red-400 hover:bg-white/10 rounded-full transition-all"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 py-6">
        <Suspense fallback={<LoadingSpinner />}>
          <AnimatePresence mode="wait">
            {view === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col">
                <DashboardView onOpenDetail={handleOpenDetail} />
              </motion.div>
            )}
            {view === 'new' && (
              <motion.div key="new" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RequestForm onSuccess={() => setView('dashboard')} onCancel={() => setView('dashboard')} />
              </motion.div>
            )}
            {view === 'detail' && selectedId && (
              <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RequestDetail requestId={selectedId} onBack={handleBack} />
              </motion.div>
            )}
            {view === 'stats' && isAmbassador && (
              <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <StatsView />
              </motion.div>
            )}
            {view === 'admin' && isAmbassador && (
              <motion.div key="admin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <UserManager />
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppShell />
  </AuthProvider>
);

export default App;
