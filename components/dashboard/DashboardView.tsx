import React, { useEffect, useState } from 'react';
import { subscribeToRequests } from '../../services/requestService';
import { IdeaRequest, Status, Priority, Team } from '../../types';
import { RequestCard } from '../requests/RequestCard';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Filter, X, Lightbulb, Wrench, PartyPopper, SortAsc } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onOpenDetail: (id: string) => void;
}

const STATUS_TABS = [
  { value: '', label: 'Todas', icon: null },
  { value: Status.IDEA, label: 'Ideas', icon: Lightbulb },
  { value: Status.IN_PROGRESS, label: 'En progreso', icon: Wrench },
  { value: Status.DONE, label: 'Logramos', icon: PartyPopper },
];

export const DashboardView: React.FC<Props> = ({ onOpenDetail }) => {
  const { appUser, isAmbassador } = useAuth();
  const [requests, setRequests] = useState<IdeaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

  useEffect(() => {
    const unsub = subscribeToRequests((data) => {
      setRequests(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const priorityOrder: Record<Priority, number> = {
    [Priority.URGENT]: 0,
    [Priority.HIGH]: 1,
    [Priority.MEDIUM]: 2,
    [Priority.LOW]: 3,
  };

  const filtered = requests
    .filter((r) => {
      if (!isAmbassador && r.submittedBy.email !== appUser?.email) {
        // Members see all requests but can filter their own
      }
      if (statusFilter && r.status !== statusFilter) return false;
      if (teamFilter && r.team !== teamFilter) return false;
      if (priorityFilter && r.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.currentProcess.toLowerCase().includes(q) ||
          r.submittedBy.name.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const diff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (diff !== 0) return diff;
      }
      // Default: newest first
      const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
      return bTime - aTime;
    });

  const counts = {
    all: requests.length,
    idea: requests.filter((r) => r.status === Status.IDEA).length,
    inProgress: requests.filter((r) => r.status === Status.IN_PROGRESS).length,
    done: requests.filter((r) => r.status === Status.DONE).length,
  };

  const hasFilters = search || statusFilter || teamFilter || priorityFilter;
  const clearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setTeamFilter('');
    setPriorityFilter('');
  };

  return (
    <div className="flex-1 flex flex-col gap-6">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: counts.all, color: 'bg-zinc-100 text-zinc-700' },
          { label: '💡 Ideas', value: counts.idea, color: 'bg-amber-50 text-amber-700' },
          { label: '🔧 En progreso', value: counts.inProgress, color: 'bg-blue-50 text-blue-700' },
          { label: '🎉 Logramos', value: counts.done, color: 'bg-emerald-50 text-emerald-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-2xl p-4 ${color}`}>
            <div className="text-2xl font-black">{value}</div>
            <div className="text-xs font-semibold mt-0.5 opacity-80">{label}</div>
          </div>
        ))}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por título, proceso o persona..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Team filter */}
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos los equipos</option>
            {Object.values(Team).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas las prioridades</option>
            {Object.values(Priority).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Sort */}
          <button
            onClick={() => setSortBy(sortBy === 'date' ? 'priority' : 'date')}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-600 hover:bg-zinc-100 transition-all whitespace-nowrap"
          >
            <SortAsc size={14} />
            {sortBy === 'date' ? 'Por fecha' : 'Por prioridad'}
          </button>
        </div>

        {/* Status tabs */}
        <div className="flex gap-2 mt-3">
          {STATUS_TABS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                statusFilter === value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {Icon && <Icon size={11} />}
              {label}
            </button>
          ))}

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-500 hover:bg-red-100 transition-all ml-auto"
            >
              <X size={11} /> Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-zinc-400">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm">Cargando solicitudes...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Filter size={28} className="text-zinc-300" />
            </div>
            <p className="text-zinc-500 font-semibold">
              {hasFilters ? 'No hay resultados con esos filtros' : 'Todavía no hay solicitudes'}
            </p>
            {!hasFilters && (
              <p className="text-xs text-zinc-400 mt-2">Cargá la primera idea usando el botón "Nueva idea"</p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-8">
          <AnimatePresence>
            {filtered.map((r) => (
              <RequestCard key={r.id} request={r} onClick={onOpenDetail} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
