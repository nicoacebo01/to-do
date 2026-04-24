import React from 'react';
import { IdeaRequest } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { PriorityBadge } from '../ui/PriorityBadge';
import { TeamBadge } from '../ui/TeamBadge';
import { Clock, Paperclip, User, ChevronRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  request: IdeaRequest;
  onClick: (id: string) => void;
}

function formatDate(ts: { toDate?: () => Date } | null | undefined): string {
  if (!ts || typeof ts.toDate !== 'function') return '';
  return ts.toDate().toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const RequestCard: React.FC<Props> = ({ request, onClick }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={() => onClick(request.id)}
      className="bg-white rounded-2xl border border-zinc-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer p-5 group"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-zinc-900 text-sm leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2">
            {request.title}
          </h3>
        </div>
        <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mt-3">
        <StatusBadge status={request.status} size="sm" />
        <PriorityBadge priority={request.priority} />
        <TeamBadge team={request.team} />
      </div>

      {/* Current process preview */}
      <p className="mt-3 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
        {request.currentProcess}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-50">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="flex items-center gap-1">
            <User size={11} />
            {request.submittedBy.name}
          </span>
          {request.hoursPerWeek > 0 && (
            <span className="flex items-center gap-1 text-amber-600 font-semibold">
              <Clock size={11} />
              ~{request.hoursPerWeek}hs/sem
            </span>
          )}
          {request.attachments.length > 0 && (
            <span className="flex items-center gap-1">
              <Paperclip size={11} />
              {request.attachments.length}
            </span>
          )}
          {(request.commentCount ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-indigo-500">
              <MessageCircle size={11} />
              {request.commentCount}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-400">{formatDate(request.createdAt)}</span>
      </div>
    </motion.div>
  );
};
