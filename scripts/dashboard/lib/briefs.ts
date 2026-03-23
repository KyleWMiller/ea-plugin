import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { marked } from 'marked';
import type { BriefMeta } from '../shared/types.ts';

const BRIEFS_DIR = join(process.env.EA_DATA_DIR ?? join(process.env.HOME!, '.ea'), 'briefs');

const BRIEF_TYPES: Record<string, BriefMeta['type']> = {
  'morning-brief': 'morning-brief',
  'eod-wrap': 'eod-wrap',
  'weekly-plan': 'weekly-plan',
  'inbox-triage': 'inbox-triage',
  'relationship-check': 'relationship-check',
  'project-pulse': 'project-pulse',
};

function classifyBrief(filename: string): { type: BriefMeta['type']; date: string; title: string } {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!match) return { type: 'unknown', date: '', title: filename };

  const date = match[1]!;
  const slug = match[2]!;
  const type = BRIEF_TYPES[slug] ?? 'unknown';
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return { type, date, title };
}

export async function listBriefs(): Promise<BriefMeta[]> {
  const files = await readdir(BRIEFS_DIR);
  const briefs: BriefMeta[] = [];

  for (const f of files) {
    if (!f.endsWith('.md') || f === 'brain-dump.md') continue;
    const match = f.match(/^\d{4}-\d{2}-\d{2}/);
    if (!match) continue;

    const { type, date, title } = classifyBrief(f);
    briefs.push({ filename: f, date, type, title });
  }

  return briefs.sort((a, b) => b.date.localeCompare(a.date));
}

export async function readBrief(filename: string): Promise<{ html: string; raw: string } | null> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filepath = join(BRIEFS_DIR, safeName);

  try {
    const raw = await Bun.file(filepath).text();
    const html = await marked(raw);
    return { html, raw };
  } catch {
    return null;
  }
}
