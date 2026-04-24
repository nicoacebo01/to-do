import { Timestamp } from 'firebase/firestore';

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
  timeSpent: string;
  hoursPerWeek: number;
  desiredProcess: string;
  expectedBenefit: string;
  priority: Priority;
  status: Status;
  attachments: Attachment[];
  ambassadorNotes: string;
  statusHistory: StatusChange[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
}

export interface Comment {
  id: string;
  authorEmail: string;
  authorName: string;
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
