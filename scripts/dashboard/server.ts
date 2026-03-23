import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import { listBriefs, readBrief } from './lib/briefs.ts';
import { loadKanban, updateKanban, syncFromLoci, saveKanban } from './lib/kanban.ts';
import { getLociStats } from './lib/loci.ts';
import { loadConfig } from './lib/config.ts';
import type { KanbanState } from './shared/types.ts';

const config = loadConfig();
const dataDir = process.env.EA_DATA_DIR ?? join(process.env.HOME!, '.ea');
const distDir = join(dataDir, 'dashboard/dist');

const app = new Hono();

app.use('*', cors());

// API routes
app.get('/api/briefs', async (c) => {
  const briefs = await listBriefs();
  return c.json(briefs);
});

app.get('/api/briefs/:filename', async (c) => {
  const filename = c.req.param('filename');
  const brief = await readBrief(filename);
  if (!brief) return c.json({ error: 'Not found' }, 404);
  return c.json(brief);
});

app.get('/api/schedule', async (c) => {
  const briefs = await listBriefs();
  const today = new Date().toISOString().split('T')[0];
  const todayBrief = briefs.find(b => b.date === today && b.type === 'morning-brief');
  if (todayBrief) {
    const content = await readBrief(todayBrief.filename);
    return c.json({ brief: todayBrief, content });
  }
  return c.json({ brief: null, content: null });
});

app.get('/api/kanban', async (c) => {
  const state = await loadKanban();
  return c.json(state);
});

app.post('/api/kanban', async (c) => {
  const body = await c.req.json();

  // Support full state replacement (from drag-drop) or action-based updates
  if (body.cards && body.columns) {
    // Full state replacement
    const state: KanbanState = {
      columns: body.columns,
      cards: body.cards,
      lastSync: body.lastSync ?? new Date().toISOString(),
    };
    await saveKanban(state);
    return c.json(state);
  }

  const state = await updateKanban(body);
  return c.json(state);
});

app.post('/api/kanban/sync', async (c) => {
  const state = await syncFromLoci();
  return c.json(state);
});

app.get('/api/stats', async (c) => {
  const stats = await getLociStats();
  return c.json(stats);
});

app.get('/api/config', (c) => {
  return c.json({
    domains: config.domains ?? { active: ['work', 'family', 'learning'], keywords: {} },
    integrations: config.integrations ?? { googleCalendar: false, gmail: false },
  });
});

// Serve built frontend
const staticRoot = existsSync(distDir) ? distDir : './dist';
app.use('/*', serveStatic({ root: staticRoot }));
app.get('*', serveStatic({ path: join(staticRoot, 'index.html') }));

const PORT = parseInt(process.env.EA_DASHBOARD_PORT ?? String(config.dashboard?.port ?? 3141));
console.log(`EA Dashboard running at http://localhost:${PORT}`);

export default {
  port: PORT,
  fetch: app.fetch,
};
