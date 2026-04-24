import React from 'react';
import { Status } from '../../types';
import { Lightbulb, Wrench, PartyPopper } from 'lucide-react';

const CONFIG: Record<Status, { label: string; icon: React.FC<{ size?: number }>; classes: string }> = {
  [Status.IDEA]: {
    label: 'Tengo una idea',
    icon: Lightbulb,
    classes: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  [Status.IN_PROGRESS]: {
    label: 'Lo estamos laburando',
    icon: Wrench,
    classes: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  [Status.DONE]: {
    label: '¡Lo logramos!',
    icon: PartyPopper,
    classes: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
};

interface Props {
  status: Status;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const { label, icon: Icon, classes } = CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold rounded-full whitespace-nowrap ${classes} ${
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      <Icon size={size === 'sm' ? 10 : 12} />
      {label}
    </span>
  );
};
