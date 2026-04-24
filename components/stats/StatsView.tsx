import React, { useEffect, useState, useMemo } from 'react';
import { subscribeToRequests } from '../../services/requestService';
import { IdeaRequest, Status, Priority, Team } from '../../types';
import { BarChart2, Clock, TrendingUp, CheckCircle2, Lightbulb, Wrench, PartyPopper, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';

const TEAM_COLORS: Record<Team, string> = {
  [Team.PLANIFICACION]: '#8b5cf6',
  [Team.CREDITOS]: '#f43f5e',
  [Team.TESORERIA]: '#14b8a6',
  [Team.CUENTAS]: '#f59e0b',
};

const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.URGENT]: '#ef4444',
  [Priority.HIGH]: '#f97316',
  [Priority.MEDIUM]: '#3b82f6',
  [Priority.LOW]: '#94a3b8',
};

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysBetween(start: { toDate?: () => Date } | null | undefined, end: { toDate?: () => Date } | null | undefined): number | null {
  if (!start?.toDate || !end?.toDate) return null;
  return Math.round((end.toDate().getTime() - start.toDate().getTime()) / 86400000);
}

// Simple horizontal bar chart component
const BarChart: React.FC<{ data: { label: string; value: number; color: string }[]; max: number }> = ({ data, max }) => (
  <div className="space-y-2.5">
    {data.map(({ label, value, color }) => (
      <div key={label} className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-36 text-right truncate">{label}</span>
        <div className="flex-1 h-6 bg-zinc-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: max > 0 ? `${(value / max) * 100}%` : '0%' }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full flex items-center justify-end pr-2"
            style={{ backgroundColor: color }}
          >
            {value > 0 && <span className="text-[10px] font-bold text-white">{value}</span>}
          </motion.div>
        </div>
        <span className="text-xs font-bold text-zinc-700 w-5">{value}</span>
      </div>
    ))}
  </div>
);

// Simple donut chart (SVG)
const DonutChart: React.FC<{ segments: { value: number; color: string; label: string }[]; total: number }> = ({ segments, total }) => {
  const size = 120;
  const r = 45;
  const cx = 60;
  const cy = 60;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = total > 0 ? seg.value / total : 0;
    const dash = pct * circumference;
    const arc = { ...seg, dash, gap: circumference - dash, offset };
    offset += dash;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={16} />
        {arcs.map((arc, i) => (
          arc.value > 0 && (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={16}
              strokeDasharray={`${arc.dash} ${arc.gap}`}
              strokeDashoffset={-arc.offset + circumference / 4}
              strokeLinecap="round"
            />
          )
        ))}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="text-lg font-black" fill="#18181b" fontSize="20" fontWeight="900">
          {total}
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-zinc-600">{seg.label}</span>
            <span className="font-bold text-zinc-800 ml-auto">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatsView: React.FC = () => {
  const [requests, setRequests] = useState<IdeaRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToRequests((data) => {
      setRequests(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const byStatus = {
      [Status.IDEA]: requests.filter((r) => r.status === Status.IDEA).length,
      [Status.IN_PROGRESS]: requests.filter((r) => r.status === Status.IN_PROGRESS).length,
      [Status.DONE]: requests.filter((r) => r.status === Status.DONE).length,
    };

    const completionRate = total > 0 ? Math.round((byStatus[Status.DONE] / total) * 100) : 0;

    // Avg resolution days
    const resolved = requests.filter((r) => r.status === Status.DONE && r.resolvedAt);
    const avgResolutionDays = resolved.length > 0
      ? Math.round(resolved.reduce((acc, r) => acc + (daysBetween(r.createdAt, r.resolvedAt) ?? 0), 0) / resolved.length)
      : null;

    // Total hours saved (from done requests)
    const totalHoursSaved = requests
      .filter((r) => r.status === Status.DONE)
      .reduce((acc, r) => acc + (r.hoursPerWeek || 0), 0);

    // By team
    const byTeam = Object.values(Team).map((team) => ({
      label: team,
      value: requests.filter((r) => r.team === team).length,
      color: TEAM_COLORS[team],
    }));

    // By priority (pending only)
    const pending = requests.filter((r) => r.status !== Status.DONE);
    const byPriority = Object.values(Priority).map((p) => ({
      label: p,
      value: pending.filter((r) => r.priority === p).length,
      color: PRIORITY_COLORS[p],
    }));

    // Unattended for >7 days
    const now = Date.now();
    const stale = requests.filter((r) => {
      if (r.status !== Status.IDEA) return false;
      const created = r.createdAt?.toDate?.()?.getTime?.() ?? now;
      return (now - created) > 7 * 86400000;
    });

    // Recent completions
    const recent = [...resolved]
      .sort((a, b) => {
        const aT = a.resolvedAt?.toDate?.()?.getTime?.() ?? 0;
        const bT = b.resolvedAt?.toDate?.()?.getTime?.() ?? 0;
        return bT - aT;
      })
      .slice(0, 5);

    // Backlog sorted by priority
    const backlog = [...requests.filter((r) => r.status === Status.IDEA)]
      .sort((a, b) => {
        const order = { [Priority.URGENT]: 0, [Priority.HIGH]: 1, [Priority.MEDIUM]: 2, [Priority.LOW]: 3 };
        return order[a.priority] - order[b.priority];
      });

    return { total, byStatus, completionRate, avgResolutionDays, totalHoursSaved, byTeam, byPriority, stale, recent, backlog };
  }, [requests]);

  const handleExport = () => {
    const rows = requests.map((r) => ({
      Título: r.title,
      Equipo: r.team,
      Estado: r.status,
      Prioridad: r.priority,
      Solicitante: r.submittedBy.name,
      'Email solicitante': r.submittedBy.email,
      'Proceso actual': r.currentProcess,
      'Tiempo demanda': r.timeSpent,
      'Hs/semana': r.hoursPerWeek,
      'Automatización deseada': r.desiredProcess,
      'Beneficio esperado': r.expectedBenefit,
      'Fecha creación': formatDate(r.createdAt),
      'Fecha resolución': r.resolvedAt ? formatDate(r.resolvedAt) : '',
      'Días resolución': r.resolvedAt ? daysBetween(r.createdAt, r.resolvedAt) : '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Solicitudes');
    XLSX.writeFile(wb, `ideas_finanzas_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full" /></div>;
  }

  const maxTeam = Math.max(...stats.byTeam.map((t) => t.value), 1);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <BarChart2 className="text-indigo-600" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-zinc-900">Estadísticas</h1>
            <p className="text-xs text-zinc-500">Visión global del proceso</p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50 font-semibold rounded-xl text-sm transition-all shadow-sm"
        >
          <Download size={16} /> Exportar Excel
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Total de solicitudes"
          value={stats.total}
          icon={Lightbulb}
          color="bg-indigo-50 text-indigo-700"
          iconBg="bg-indigo-100"
        />
        <KpiCard
          label="Tasa de resolución"
          value={`${stats.completionRate}%`}
          icon={CheckCircle2}
          color="bg-emerald-50 text-emerald-700"
          iconBg="bg-emerald-100"
          sub={`${stats.byStatus[Status.DONE]} completadas`}
        />
        <KpiCard
          label="Tiempo prom. resolución"
          value={stats.avgResolutionDays !== null ? `${stats.avgResolutionDays} días` : 'N/A'}
          icon={Clock}
          color="bg-blue-50 text-blue-700"
          iconBg="bg-blue-100"
          sub={`sobre ${stats.byStatus[Status.DONE]} casos`}
        />
        <KpiCard
          label="Hs/semana ahorradas"
          value={`~${stats.totalHoursSaved}hs`}
          icon={TrendingUp}
          color="bg-amber-50 text-amber-700"
          iconBg="bg-amber-100"
          sub="en procesos completados"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Donut status */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-zinc-700 mb-4 flex items-center gap-2">
            Distribución por estado
          </h3>
          <DonutChart
            total={stats.total}
            segments={[
              { value: stats.byStatus[Status.IDEA], color: '#f59e0b', label: '💡 Tengo una idea' },
              { value: stats.byStatus[Status.IN_PROGRESS], color: '#3b82f6', label: '🔧 En progreso' },
              { value: stats.byStatus[Status.DONE], color: '#10b981', label: '🎉 Logramos' },
            ]}
          />
        </div>

        {/* Bar by team */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-zinc-700 mb-4">Solicitudes por equipo</h3>
          <BarChart data={stats.byTeam} max={maxTeam} />
        </div>
      </div>

      {/* Priority backlog + stale alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Stale ideas */}
        {stats.stale.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
            <h3 className="text-sm font-black text-amber-800 mb-3 flex items-center gap-2">
              ⚠️ Ideas sin atender (+7 días)
              <span className="ml-auto bg-amber-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                {stats.stale.length}
              </span>
            </h3>
            <div className="space-y-2">
              {stats.stale.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs bg-white rounded-xl px-3 py-2 border border-amber-100">
                  <span className="font-semibold text-zinc-700 truncate flex-1">{r.title}</span>
                  <span className="text-zinc-400 ml-2 flex-shrink-0">{formatDate(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Priority backlog */}
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-zinc-700 mb-3 flex items-center gap-2">
            🎯 Backlog priorizado
            <span className="ml-auto bg-zinc-200 text-zinc-600 text-xs font-black px-2 py-0.5 rounded-full">
              {stats.backlog.length}
            </span>
          </h3>
          {stats.backlog.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-4">No hay ideas pendientes 🎉</p>
          ) : (
            <div className="space-y-2">
              {stats.backlog.slice(0, 8).map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 text-xs bg-zinc-50 rounded-xl px-3 py-2">
                  <span className="text-zinc-400 font-bold w-4">{i + 1}</span>
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PRIORITY_COLORS[r.priority] }}
                  />
                  <span className="font-semibold text-zinc-700 truncate flex-1">{r.title}</span>
                  <span className="text-zinc-400 flex-shrink-0">{r.team.split(' ')[0]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent completions */}
      {stats.recent.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
          <h3 className="text-sm font-black text-zinc-700 mb-4 flex items-center gap-2">
            <PartyPopper size={14} className="text-emerald-500" /> Últimas resoluciones
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-zinc-400 border-b border-zinc-100">
                  <th className="text-left pb-2 font-semibold">Solicitud</th>
                  <th className="text-left pb-2 font-semibold">Equipo</th>
                  <th className="text-center pb-2 font-semibold">Días</th>
                  <th className="text-center pb-2 font-semibold">Hs ahorradas</th>
                  <th className="text-right pb-2 font-semibold">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {stats.recent.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-2 pr-4 font-medium text-zinc-800 max-w-xs truncate">{r.title}</td>
                    <td className="py-2 pr-4 text-zinc-500">{r.team}</td>
                    <td className="py-2 text-center font-bold text-indigo-600">
                      {daysBetween(r.createdAt, r.resolvedAt) ?? '—'}
                    </td>
                    <td className="py-2 text-center font-bold text-emerald-600">
                      {r.hoursPerWeek ? `${r.hoursPerWeek}hs/sem` : '—'}
                    </td>
                    <td className="py-2 text-right text-zinc-400">{formatDate(r.resolvedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const KpiCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.FC<{ size?: number; className?: string }>;
  color: string;
  iconBg: string;
  sub?: string;
}> = ({ label, value, icon: Icon, color, iconBg, sub }) => (
  <div className={`rounded-2xl p-5 ${color}`}>
    <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
      <Icon size={18} />
    </div>
    <div className="text-2xl font-black">{value}</div>
    <div className="text-xs font-semibold mt-0.5 opacity-80">{label}</div>
    {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
  </div>
);
