import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { KanbanState, KanbanCard, ColumnId } from '../shared/types.ts';
import { getProjectEntities, storeDomainCorrection, getDomainCorrections } from './loci.ts';
import { loadConfig } from './config.ts';

const DATA_PATH = join(process.env.EA_DATA_DIR ?? join(process.env.HOME!, '.ea'), 'dashboard/data/kanban.json');

function defaultState(): KanbanState {
  return {
    columns: ['backlog', 'in_progress', 'done', 'blocked'],
    cards: [],
    lastSync: new Date().toISOString(),
  };
}

function migrateCard(card: KanbanCard): KanbanCard {
  return {
    ...card,
    notes: card.notes ?? '',
    dependencies: card.dependencies ?? [],
    blockedBy: card.blockedBy ?? [],
    archived: card.archived ?? false,
  };
}

export async function loadKanban(): Promise<KanbanState> {
  try {
    if (!existsSync(DATA_PATH)) {
      const state = defaultState();
      await saveKanban(state);
      return state;
    }
    const raw = await Bun.file(DATA_PATH).text();
    const state = JSON.parse(raw) as KanbanState;
    state.cards = state.cards.map(migrateCard);
    return state;
  } catch {
    return defaultState();
  }
}

export async function saveKanban(state: KanbanState): Promise<void> {
  await Bun.write(DATA_PATH, JSON.stringify(state, null, 2));
}

export async function updateKanban(update: {
  action: 'move' | 'add' | 'remove' | 'reorder' | 'update';
  cardId?: string;
  column?: ColumnId;
  order?: number;
  card?: Partial<KanbanCard>;
}): Promise<KanbanState> {
  const state = await loadKanban();

  switch (update.action) {
    case 'move': {
      const card = state.cards.find(c => c.id === update.cardId);
      if (card && update.column) {
        card.column = update.column;
        card.lastActivity = new Date().toISOString().split('T')[0]!;
        if (update.order !== undefined) card.order = update.order;
      }
      break;
    }
    case 'add': {
      if (update.card) {
        const newCard: KanbanCard = {
          id: crypto.randomUUID(),
          title: update.card.title ?? 'Untitled',
          domain: update.card.domain ?? 'work',
          column: update.card.column ?? 'backlog',
          description: update.card.description ?? '',
          lociEntityId: update.card.lociEntityId ?? null,
          lastActivity: new Date().toISOString().split('T')[0]!,
          createdAt: new Date().toISOString().split('T')[0]!,
          order: state.cards.filter(c => c.column === (update.card?.column ?? 'backlog')).length,
          notes: update.card.notes ?? '',
          dependencies: update.card.dependencies ?? [],
          blockedBy: update.card.blockedBy ?? [],
          archived: false,
        };
        state.cards.push(newCard);
      }
      break;
    }
    case 'remove': {
      state.cards = state.cards.filter(c => c.id !== update.cardId);
      break;
    }
    case 'reorder': {
      const card = state.cards.find(c => c.id === update.cardId);
      if (card && update.order !== undefined) {
        card.order = update.order;
      }
      break;
    }
    case 'update': {
      const card = state.cards.find(c => c.id === update.cardId);
      if (card && update.card) {
        // Store domain correction in Loci when domain changes
        if (update.card.domain && update.card.domain !== card.domain) {
          storeDomainCorrection(card.title, card.domain, update.card.domain, card.lociEntityId);
        }
        Object.assign(card, update.card);
        card.lastActivity = new Date().toISOString().split('T')[0]!;
      }
      break;
    }
  }

  await saveKanban(state);
  return state;
}

export async function syncFromLoci(): Promise<KanbanState> {
  const state = await loadKanban();
  const entities = await getProjectEntities();
  const corrections = await getDomainCorrections();

  for (const entity of entities) {
    const exists = state.cards.some(c => c.lociEntityId === entity.id);
    if (exists) continue;

    // Use stored correction if available, otherwise infer
    const domain = corrections.get(entity.id) ?? inferDomain(entity.content, entity.tags);
    state.cards.push({
      id: crypto.randomUUID(),
      title: extractTitle(entity.content),
      domain,
      column: 'backlog',
      description: entity.content.slice(0, 200),
      lociEntityId: entity.id,
      lastActivity: new Date().toISOString().split('T')[0]!,
      createdAt: new Date().toISOString().split('T')[0]!,
      order: state.cards.filter(c => c.column === 'backlog').length,
      notes: '',
      dependencies: [],
      blockedBy: [],
      archived: false,
    });
  }

  state.lastSync = new Date().toISOString();
  await saveKanban(state);
  return state;
}

function inferDomain(content: string, tags?: string[]): KanbanCard['domain'] {
  const text = (content + ' ' + (tags ?? []).join(' ')).toLowerCase();
  const config = loadConfig();
  const keywords = config.domains?.keywords ?? {};

  // Check user-configured domain keywords first
  for (const [domain, words] of Object.entries(keywords)) {
    if (Array.isArray(words) && words.some((w: string) => text.includes(w.toLowerCase()))) {
      return domain as KanbanCard['domain'];
    }
  }

  // Generic fallbacks
  if (text.includes('work')) return 'work';
  if (text.includes('family')) return 'family';
  if (text.includes('learn') || text.includes('course') || text.includes('study')) return 'learning';

  // Default to first active domain
  const active = config.domains?.active ?? ['work'];
  return active[0] as KanbanCard['domain'];
}

function extractTitle(content: string): string {
  const firstLine = content.split('\n')[0] ?? content;
  const dashMatch = firstLine.match(/^(.+?)\s*[—–-]\s*/);
  if (dashMatch) return dashMatch[1]!.trim();
  return firstLine.slice(0, 60).trim();
}
