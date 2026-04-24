import React from 'react';
import { Priority } from '../../types';

const CONFIG: Record<Priority, { classes: string; dot: string }> = {
  [Priority.LOW]: { classes: 'bg-zinc-100 text-zinc-500', dot: 'bg-zinc-400' },
  [Priority.MEDIUM]: { classes: 'bg-sky-100 text-sky-600', dot: 'bg-sky-400' },
  [Priority.HIGH]: { classes: 'bg-orange-100 text-orange-600', dot: 'bg-orange-400' },
  [Priority.URGENT]: { classes: 'bg-red-100 text-red-600', dot: 'bg-red-500' },
};

interface Props {
  priority: Priority;
}

export const PriorityBadge: React.FC<Props> = ({ priority }) => {
  const { classes, dot } = CONFIG[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${classes}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {priority}
    </span>
  );
};
