<script lang="ts">
  import { onMount } from 'svelte';
  import KanbanColumn from './KanbanColumn.svelte';
  import CardModal from './CardModal.svelte';
  import { fetchKanban, saveKanban, syncKanban, fetchConfig } from '../lib/api';
  import { kanbanState } from '../lib/stores';
  import type { KanbanCard, ColumnId, Domain, KanbanState } from '../../shared/types';
  import { DOMAIN_COLORS } from '../../shared/types';

  let state = $state<KanbanState | null>(null);
  let loading = $state(true);
  let syncing = $state(false);
  let filterDomain = $state<string>('all');
  let selectedCardId = $state<string | null>(null);
  let saveTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeDomains = $state<string[]>(['work', 'family', 'learning']);
  let domainColors = $state<Record<string, string>>({ ...DOMAIN_COLORS });

  onMount(async () => {
    const [kanban, config] = await Promise.all([fetchKanban(), fetchConfig()]);
    state = kanban;
    kanbanState.set(state);
    if (config?.domains?.active) {
      activeDomains = config.domains.active;
      // Build color map for active domains
      const palette = ['#58a6ff', '#d29922', '#bc8cff', '#3fb950', '#f0883e', '#f85149', '#79c0ff', '#56d364'];
      const known: Record<string, string> = { work: '#58a6ff', family: '#d29922', learning: '#bc8cff', business: '#3fb950', house: '#f0883e' };
      const colors: Record<string, string> = {};
      activeDomains.forEach((d, i) => { colors[d] = known[d] ?? palette[i % palette.length]!; });
      domainColors = colors;
    }
    loading = false;
  });

  const columns: ColumnId[] = ['backlog', 'in_progress', 'done', 'blocked'];
  const domains = $derived(['all', ...activeDomains]);

  function getColumnCards(columnId: ColumnId): KanbanCard[] {
    if (!state) return [];
    let cards = state.cards.filter(c => c.column === columnId && !c.archived);
    if (filterDomain !== 'all') {
      cards = cards.filter(c => c.domain === filterDomain);
    }
    return cards.sort((a, b) => a.order - b.order);
  }

  const selectedCard = $derived(
    state && selectedCardId ? state.cards.find(c => c.id === selectedCardId) ?? null : null
  );

  function handleCardClick(id: string) {
    selectedCardId = id;
  }

  function handleCardUpdate(updated: KanbanCard) {
    if (!state) return;
    state = {
      ...state,
      cards: state.cards.map(c => c.id === updated.id ? updated : c),
    };
    kanbanState.set(state);
    debounceSave();
  }

  function handleArchive(cardId: string) {
    if (!state) return;
    state = {
      ...state,
      cards: state.cards.map(c => c.id === cardId ? { ...c, archived: true } : c),
    };
    kanbanState.set(state);
    selectedCardId = null;
    debounceSave();
  }

  function debounceSave() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      if (state) await saveKanban(state);
    }, 500);
  }

  function handleCardsUpdate(columnId: ColumnId, updatedCards: KanbanCard[]) {
    if (!state) return;

    // Replace cards for this column, keep others
    const otherCards = state.cards.filter(c => c.column !== columnId);
    const newCards = updatedCards.map((card, i) => ({
      ...card,
      column: columnId,
      order: i,
    }));

    state = {
      ...state,
      cards: [...otherCards, ...newCards],
    };
    kanbanState.set(state);
    debounceSave();
  }

  async function handleSync() {
    syncing = true;
    state = await syncKanban();
    kanbanState.set(state);
    syncing = false;
  }
</script>

<div class="kanban">
  <div class="kanban-toolbar">
    <div class="filter-group">
      <span class="filter-label">Filter:</span>
      {#each domains as d}
        <button
          class="filter-btn"
          class:active={filterDomain === d}
          style={d !== 'all' ? `--btn-color: ${domainColors[d] ?? '#58a6ff'}` : ''}
          onclick={() => (filterDomain = d)}
        >
          {d === 'all' ? 'All' : d.charAt(0).toUpperCase() + d.slice(1)}
        </button>
      {/each}
    </div>
    <button class="sync-btn" onclick={handleSync} disabled={syncing}>
      {syncing ? 'Syncing...' : 'Sync from Loci'}
    </button>
  </div>

  {#if loading}
    <div class="loading">Loading kanban board...</div>
  {:else}
    <div class="kanban-grid">
      {#each columns as col}
        <KanbanColumn
          columnId={col}
          cards={getColumnCards(col)}
          onCardsUpdate={handleCardsUpdate}
          onCardClick={handleCardClick}
        />
      {/each}
    </div>
  {/if}

  {#if selectedCard && state}
    <CardModal
      card={selectedCard}
      allCards={state.cards.filter(c => !c.archived)}
      onUpdate={handleCardUpdate}
      onArchive={handleArchive}
      onClose={() => { selectedCardId = null; }}
    />
  {/if}
</div>

<style>
  .kanban {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .kanban-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 10px;
    padding: 0.75rem 1.25rem;
  }

  .filter-group {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .filter-label {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    margin-right: 0.5rem;
  }

  .filter-btn {
    padding: 0.3rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-btn:hover {
    border-color: var(--btn-color, rgba(255, 255, 255, 0.2));
    color: var(--btn-color, rgba(255, 255, 255, 0.8));
  }

  .filter-btn.active {
    background: color-mix(in srgb, var(--btn-color, #58a6ff) 15%, transparent);
    border-color: var(--btn-color, #58a6ff);
    color: var(--btn-color, #58a6ff);
  }

  .sync-btn {
    padding: 0.4rem 1rem;
    border: 1px solid rgba(88, 166, 255, 0.3);
    background: rgba(88, 166, 255, 0.1);
    color: #58a6ff;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .sync-btn:hover:not(:disabled) {
    background: rgba(88, 166, 255, 0.2);
  }

  .sync-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .kanban-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .loading {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.3);
  }

  @media (max-width: 1100px) {
    .kanban-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 600px) {
    .kanban-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
