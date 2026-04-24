import React, { useEffect, useState } from 'react';
import {
  subscribeToRequests,
  subscribeToComments,
  addCommentToRequest,
  updateRequestStatus,
  updateAmbassadorNotes,
  updateRequestPriority,
  deleteRequest,
} from '../../services/requestService';
import { IdeaRequest, Comment, Status, Priority, FREQUENCY_LABELS, computeSavings, computeWeeklyHours } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { TeamBadge } from '../ui/TeamBadge';
import {
  ArrowLeft, Clock, Paperclip, Send, Loader2, Lightbulb, Wrench,
  PartyPopper, FileText, Image, CheckCircle2, ChevronRight,
  StickyNote, Trash2, AlertTriangle, MessageCircle, Shield,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize, isImageType } from '../../services/storageService';

interface Props {
  requestId: string;
  onBack: () => void;
}

function formatDate(ts: { toDate?: () => Date } | null | undefined, long = false): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: long ? 'long' : 'short',
    year: 'numeric',
    hour: long ? '2-digit' : undefined,
    minute: long ? '2-digit' : undefined,
  });
}

function daysBetween(start: { toDate?: () => Date } | null | undefined, end: { toDate?: () => Date } | null | undefined): number | null {
  if (!start?.toDate || !end?.toDate) return null;
  const diff = end.toDate().getTime() - start.toDate().getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

const STATUS_FLOW: Status[] = [Status.IDEA, Status.IN_PROGRESS, Status.DONE];

const STATUS_ICONS: Record<Status, React.FC<{ size?: number; className?: string }>> = {
  [Status.IDEA]: Lightbulb,
  [Status.IN_PROGRESS]: Wrench,
  [Status.DONE]: PartyPopper,
};

export const RequestDetail: React.FC<Props> = ({ requestId, onBack }) => {
  const { appUser, isAmbassador } = useAuth();
  const [request, setRequest] = useState<IdeaRequest | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [ambassadorNotes, setAmbassadorNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToRequests((reqs) => {
      const found = reqs.find((r) => r.id === requestId);
      if (found) {
        setRequest(found);
        setAmbassadorNotes(found.ambassadorNotes || '');
      }
    });
    return unsub;
  }, [requestId]);

  useEffect(() => {
    const unsub = subscribeToComments(requestId, setComments);
    return unsub;
  }, [requestId]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !appUser) return;
    setSendingComment(true);
    await addCommentToRequest(requestId, {
      authorEmail: appUser.email,
      authorName: appUser.name,
      authorRole: appUser.role,
      text: newComment.trim(),
    });
    setNewComment('');
    setSendingComment(false);
  };

  const handleStatusChange = async (newStatus: Status) => {
    if (!request || !appUser) return;
    setChangingStatus(true);
    await updateRequestStatus(
      requestId,
      newStatus,
      appUser.email,
      appUser.name,
      request.statusHistory ?? [],
      request.status,
      ambassadorNotes
    );
    setChangingStatus(false);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    await updateAmbassadorNotes(requestId, ambassadorNotes);
    setSavingNotes(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deleteRequest(requestId);
    onBack();
  };

  if (!request) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-600" size={36} />
      </div>
    );
  }

  const currentStatusIndex = STATUS_FLOW.indexOf(request.status);
  const nextStatus = STATUS_FLOW[currentStatusIndex + 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto pb-12"
    >
      {/* Back + header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 rounded-xl transition-all mt-0.5"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-zinc-900 leading-tight">{request.title}</h1>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
            <TeamBadge team={request.team} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Proceso actual */}
          <Section title="Proceso actual" icon={Clock}>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{request.currentProcess}</p>
            {(() => {
              const hasNewFormat = request.timeSpentHours !== undefined && request.timeSpentFrequency !== undefined;
              const weeklyHours = hasNewFormat
                ? computeWeeklyHours(request.timeSpentHours!, request.timeSpentFrequency!)
                : request.hoursPerWeek;
              const savings = weeklyHours > 0 ? computeSavings(weeklyHours) : null;
              return (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Clock size={11} />
                    {hasNewFormat
                      ? <span><strong className="text-zinc-700">{request.timeSpentHours}hs</strong> {FREQUENCY_LABELS[request.timeSpentFrequency!]}</span>
                      : <span>{request.timeSpent || `${request.hoursPerWeek}hs/semana`}</span>
                    }
                  </div>
                  {savings && (
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold">~{savings.weekly}hs/sem</span>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">~{savings.monthly}hs/mes</span>
                      <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-xs font-semibold">~{savings.annual}hs/año</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </Section>

          {/* Automatización deseada */}
          <Section title="Automatización deseada" icon={Lightbulb}>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{request.desiredProcess}</p>
          </Section>

          {/* Beneficio esperado */}
          <Section title="Beneficio esperado" icon={CheckCircle2}>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">{request.expectedBenefit}</p>
          </Section>

          {/* Adjuntos */}
          {request.attachments.length > 0 && (
            <Section title={`Adjuntos (${request.attachments.length})`} icon={Paperclip}>
              <div className="space-y-2">
                {request.attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-2.5">
                    {isImageType(att.contentType)
                      ? <Image size={16} className="text-indigo-400 flex-shrink-0" />
                      : <FileText size={16} className="text-zinc-400 flex-shrink-0" />}
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-indigo-600 hover:underline flex-1 truncate"
                    >
                      {att.name}
                    </a>
                    <span className="text-xs text-zinc-400">{formatFileSize(att.size)}</span>
                  </div>
                ))}
              </div>
              {/* Image previews */}
              {request.attachments.some((a) => isImageType(a.contentType)) && (
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {request.attachments.filter((a) => isImageType(a.contentType)).map((att, i) => (
                    <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={att.url}
                        alt={att.name}
                        className="w-full h-32 object-cover rounded-xl border border-zinc-200 hover:opacity-90 transition-opacity"
                      />
                    </a>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Messages */}
          <Section title={`Mensajes y aclaraciones${comments.length > 0 ? ` (${comments.length})` : ''}`} icon={MessageCircle}>
            {comments.length === 0 ? (
              <p className="text-sm text-zinc-400 text-center py-6">
                Sin mensajes aún. Usá este espacio para hacer consultas o aclaraciones.
              </p>
            ) : (
              <div className="space-y-2.5 mb-4">
                {comments.map((c) => {
                  const isAmbassadorMsg = c.authorRole === 'AMBASSADOR';
                  const isSelf = c.authorEmail === appUser?.email;
                  return (
                    <div
                      key={c.id}
                      className={`rounded-xl p-3 border ${
                        isAmbassadorMsg
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-zinc-50 border-zinc-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                          isAmbassadorMsg ? 'bg-amber-200 text-amber-800' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {c.authorName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-zinc-900">{c.authorName}</span>
                        {isAmbassadorMsg && (
                          <span className="flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold border border-amber-200">
                            <Shield size={9} /> Embajador
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-[10px] text-zinc-400 italic">vos</span>
                        )}
                        <span className="text-[10px] text-zinc-400 ml-auto">{formatDate(c.createdAt, true)}</span>
                      </div>
                      <p className="text-sm text-zinc-700 leading-relaxed mt-1.5 pl-8">{c.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {appUser && (
              <div className="flex gap-2 mt-3 items-start">
                <div className="flex-1">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
                    placeholder={
                      isAmbassador
                        ? 'Escribí una respuesta, aclaración o pedido...'
                        : 'Escribí una consulta o aclaración al embajador...'
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">Enter para enviar · Shift+Enter para nueva línea</p>
                </div>
                <button
                  onClick={handleSendComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl transition-all mt-0.5"
                >
                  {sendingComment ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            )}
          </Section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status timeline */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Timeline</h3>
            <div className="space-y-0">
              {STATUS_FLOW.map((s, i) => {
                const change = request.statusHistory?.find((h) => h.to === s);
                const isDone = i <= currentStatusIndex;
                const isCurrent = i === currentStatusIndex;
                const Icon = STATUS_ICONS[s];

                return (
                  <div key={s} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                        isDone
                          ? isCurrent
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30'
                            : 'bg-emerald-500 text-white'
                          : 'bg-zinc-100 text-zinc-400'
                      }`}>
                        <Icon size={14} />
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 ${isDone && i < currentStatusIndex ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
                      )}
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-semibold leading-none mt-1.5 ${isDone ? 'text-zinc-800' : 'text-zinc-400'}`}>
                        {s}
                      </p>
                      {change && (
                        <>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{formatDate(change.changedAt)}</p>
                          <p className="text-[10px] text-zinc-400">por {change.changedByName}</p>
                          {i > 0 && request.statusHistory?.[i - 1] && (
                            <p className="text-[10px] text-indigo-500 mt-0.5">
                              {(() => {
                                const days = daysBetween(request.statusHistory[i - 1]?.changedAt, change.changedAt);
                                return days !== null ? `${days} día${days !== 1 ? 's' : ''} después` : '';
                              })()}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total resolution time */}
            {request.status === Status.DONE && request.resolvedAt && (
              <div className="bg-emerald-50 rounded-xl p-3 mt-2 text-center">
                <p className="text-xs text-emerald-700 font-semibold">
                  ✅ Resuelto en {daysBetween(request.createdAt, request.resolvedAt)} días
                </p>
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5 space-y-3">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Información</h3>
            <InfoRow label="Solicitante" value={request.submittedBy.name} />
            <InfoRow label="Email" value={request.submittedBy.email} />
            <InfoRow label="Creado" value={formatDate(request.createdAt)} />
            <InfoRow label="Actualizado" value={formatDate(request.updatedAt)} />
            {request.hoursPerWeek > 0 && (() => {
              const s = computeSavings(request.hoursPerWeek);
              return (
                <>
                  <InfoRow label="Hs/semana" value={`~${s.weekly}hs`} highlight />
                  <InfoRow label="Hs/mes" value={`~${s.monthly}hs`} highlight />
                  <InfoRow label="Hs/año" value={`~${s.annual}hs`} highlight />
                </>
              );
            })()}
          </div>

          {/* Ambassador panel */}
          {isAmbassador && (
            <>
              {/* Advance status */}
              {nextStatus && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                  <h3 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3">Avanzar estado</h3>
                  <button
                    onClick={() => handleStatusChange(nextStatus)}
                    disabled={changingStatus}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all text-sm flex items-center justify-center gap-2 shadow-md shadow-indigo-500/20"
                  >
                    {changingStatus ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        {nextStatus} <ChevronRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Priority */}
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3">Prioridad</h3>
                <select
                  value={request.priority}
                  onChange={(e) => updateRequestPriority(requestId, e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(Priority).map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {/* Ambassador notes */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <h3 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <StickyNote size={12} /> Notas internas
                </h3>
                <textarea
                  rows={4}
                  value={ambassadorNotes}
                  onChange={(e) => setAmbassadorNotes(e.target.value)}
                  placeholder="Notas privadas del embajador (no visibles para el solicitante)..."
                  className="w-full px-3 py-2.5 rounded-xl border border-amber-200 bg-white text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mt-2 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                >
                  {savingNotes ? <Loader2 size={12} className="animate-spin" /> : 'Guardar notas'}
                </button>
              </div>

              {/* Delete */}
              <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
                <AnimatePresence>
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2.5 border border-red-200 text-red-500 hover:bg-red-50 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Eliminar solicitud
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                        <AlertTriangle size={14} /> ¿Seguro? Esta acción no se puede deshacer.
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 bg-zinc-100 text-zinc-600 font-bold rounded-xl text-xs"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleDelete}
                          disabled={deleting}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1"
                        >
                          {deleting ? <Loader2 size={12} className="animate-spin" /> : 'Sí, eliminar'}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Section: React.FC<{
  title: string;
  icon: React.FC<{ size?: number; className?: string }>;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-5">
    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
      <Icon size={12} /> {title}
    </h3>
    {children}
  </div>
);

const InfoRow: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center text-xs">
    <span className="text-zinc-400 font-medium">{label}</span>
    <span className={`font-semibold ${highlight ? 'text-indigo-600' : 'text-zinc-700'}`}>{value}</span>
  </div>
);
