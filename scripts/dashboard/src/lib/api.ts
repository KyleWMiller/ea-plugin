import type { BriefMeta, KanbanState } from '../../shared/types.ts';

const BASE = '';

export async function fetchBriefs(): Promise<BriefMeta[]> {
  const res = await fetch(`${BASE}/api/briefs`);
  return res.json();
}

export async function fetchBrief(filename: string): Promise<{ html: string; raw: string }> {
  const res = await fetch(`${BASE}/api/briefs/${filename}`);
  return res.json();
}

export async function fetchSchedule(): Promise<{ brief: BriefMeta | null; content: { html: string } | null }> {
  const res = await fetch(`${BASE}/api/schedule`);
  return res.json();
}

export async function fetchKanban(): Promise<KanbanState> {
  const res = await fetch(`${BASE}/api/kanban`);
  return res.json();
}

export async function saveKanban(state: KanbanState): Promise<KanbanState> {
  const res = await fetch(`${BASE}/api/kanban`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  return res.json();
}

export async function syncKanban(): Promise<KanbanState> {
  const res = await fetch(`${BASE}/api/kanban/sync`, { method: 'POST' });
  return res.json();
}

export async function fetchStats(): Promise<Record<string, number>> {
  const res = await fetch(`${BASE}/api/stats`);
  return res.json();
}

export async function fetchConfig(): Promise<{
  domains: { active: string[]; keywords: Record<string, string[]> };
  integrations: { googleCalendar: boolean; gmail: boolean };
} | null> {
  try {
    const res = await fetch(`${BASE}/api/config`);
    return res.json();
  } catch {
    return null;
  }
}
