import { Timestamp } from 'firebase/firestore';

export type FrequencyUnit = 'day' | 'week' | 'month';

export const FREQUENCY_LABELS: Record<FrequencyUnit, string> = {
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
};

export function computeWeeklyHours(hours: number, freq: FrequencyUnit): number {
  if (freq === 'day') return Math.round(hours * 5 * 10) / 10;
  if (freq === 'week') return hours;
  return Math.round((hours / 4.33) * 10) / 10;
}

export function computeSavings(weeklyHours: number): { weekly: number; monthly: number; annual: number } {
  return {
    weekly: Math.round(weeklyHours * 10) / 10,
    monthly: Math.round(weeklyHours * 4.33 * 10) / 10,
    annual: Math.round(weeklyHours * 52),
  };
}

export enum Team {
  PLANIFICACION = 'Planificación Financiera',
  CREDITOS = 'Créditos y Cobranzas',
  TESORERIA = 'Tesorería',
  CUENTAS = 'Gestión de Cuentas',
}

export enum Status {
  IDEA = 'Tengo una idea',
  IN_PROGRESS = 'Lo estamos laburando',
  DONE = '¡Lo logramos!',
}

export enum Priority {
  LOW = 'Baja',
  MEDIUM = 'Media',
  HIGH = 'Alta',
  URGENT = 'Urgente',
}

export type UserRole = 'AMBASSADOR' | 'MEMBER';

export interface Attachment {
  name: string;
  url: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}

export interface StatusChange {
  from: Status | null;
  to: Status;
  changedAt: Timestamp;
  changedBy: string;
  changedByName: string;
}

export interface IdeaRequest {
  id: string;
  title: string;
  team: Team;
  submittedBy: {
    email: string;
    name: string;
  };
  currentProcess: string;
  timeSpent?: string;
  timeSpentHours?: number;
  timeSpentFrequency?: FrequencyUnit;
  hoursPerWeek: number;
  desiredProcess: string;
  expectedBenefit: string;
  priority: Priority;
  status: Status;
  attachments: Attachment[];
  ambassadorNotes: string;
  commentCount?: number;
  statusHistory: StatusChange[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface Comment {
  id: string;
  authorEmail: string;
  authorName: string;
  authorRole?: UserRole;
  text: string;
  createdAt: Timestamp;
}

export interface AppUser {
  email: string;
  name: string;
  team: Team;
  role: UserRole;
  addedAt: Timestamp;
}

export type AppView = 'dashboard' | 'new' | 'detail' | 'stats' | 'admin';
