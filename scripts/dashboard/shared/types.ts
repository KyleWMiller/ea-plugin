export interface KanbanCard {
  id: string;
  title: string;
  domain: Domain;
  column: ColumnId;
  description: string;
  lociEntityId: string | null;
  lastActivity: string;
  createdAt: string;
  order: number;
  notes: string;
  dependencies: string[];
  blockedBy: string[];
  archived: boolean;
}

export type LinkType = 'depends_on' | 'blocks';

export interface CardLink {
  id: string;
  title: string;
  column: ColumnId;
  domain: Domain;
}

export type ColumnId = 'backlog' | 'in_progress' | 'done' | 'blocked';
// Domain is a string to support user-defined domains. Defaults: work, family, learning.
export type Domain = string;

export interface KanbanState {
  columns: ColumnId[];
  cards: KanbanCard[];
  lastSync: string;
}

export interface BriefMeta {
  filename: string;
  date: string;
  type: 'morning-brief' | 'eod-wrap' | 'weekly-plan' | 'inbox-triage' | 'relationship-check' | 'project-pulse' | 'unknown';
  title: string;
}

export interface LociMemory {
  id: string;
  type: string;
  content: string;
  tags?: string[];
  confidence?: number;
  created_at?: string;
  updated_at?: string;
}

export const COLUMN_LABELS: Record<ColumnId, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

// Default colors for well-known domains. For dynamic domains, use getDomainColor() from lib/config.ts.
export const DOMAIN_COLORS: Record<string, string> = {
  work: '#58a6ff',
  business: '#3fb950',
  family: '#d29922',
  house: '#f0883e',
  learning: '#bc8cff',
};
