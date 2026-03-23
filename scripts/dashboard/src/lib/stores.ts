import { writable } from 'svelte/store';
import type { KanbanState, BriefMeta } from '../../shared/types.ts';

export type TabId = 'dashboard' | 'kanban' | 'briefs' | 'schedule';

export const activeTab = writable<TabId>('dashboard');
export const kanbanState = writable<KanbanState | null>(null);
export const briefsList = writable<BriefMeta[]>([]);
export const stats = writable<Record<string, number>>({});
