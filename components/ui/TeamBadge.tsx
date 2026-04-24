import React from 'react';
import { Team } from '../../types';

const COLORS: Record<Team, string> = {
  [Team.PLANIFICACION]: 'bg-violet-100 text-violet-700',
  [Team.CREDITOS]: 'bg-rose-100 text-rose-700',
  [Team.TESORERIA]: 'bg-teal-100 text-teal-700',
  [Team.CUENTAS]: 'bg-amber-100 text-amber-700',
};

interface Props {
  team: Team;
}

export const TeamBadge: React.FC<Props> = ({ team }) => (
  <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full ${COLORS[team]}`}>
    {team}
  </span>
);
