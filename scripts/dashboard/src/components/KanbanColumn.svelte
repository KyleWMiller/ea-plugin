<script lang="ts">
  import { flip } from 'svelte/animate';
  import { dndzone } from 'svelte-dnd-action';
  import KanbanCard from './KanbanCard.svelte';
  import { COLUMN_LABELS } from '../../shared/types';
  import type { KanbanCard as KanbanCardType, ColumnId } from '../../shared/types';

  let {
    columnId,
    cards,
    onCardsUpdate,
    onCardClick,
  }: {
    columnId: ColumnId;
    cards: KanbanCardType[];
    onCardsUpdate: (columnId: ColumnId, cards: KanbanCardType[]) => void;
    onCardClick?: (id: string) => void;
  } = $props();

  const label = $derived(COLUMN_LABELS[columnId] ?? columnId);
  const count = $derived(cards.length);

  // Items for dnd-zone need an `id` field
  let items = $derived(cards.map(c => ({ ...c, id: c.id })));

  let dragInProgress = $state(false);

  function handleConsider(e: CustomEvent<{ items: KanbanCardType[]; info: { trigger: string } }>) {
    dragInProgress = e.detail.info?.trigger === 'draggedEntered' || e.detail.info?.trigger === 'draggedOver';
    onCardsUpdate(columnId, e.detail.items);
  }

  function handleFinalize(e: CustomEvent<{ items: KanbanCardType[]; info: { trigger: string } }>) {
    dragInProgress = false;
    const updated = e.detail.items.map((card, i) => ({
      ...card,
      column: columnId,
      order: i,
    }));
    onCardsUpdate(columnId, updated);
  }

  function handleItemClick(cardId: string) {
    if (!dragInProgress && onCardClick) {
      onCardClick(cardId);
    }
  }

  const columnClass = $derived(`column-${columnId}`);
</script>

<div class="kanban-column {columnClass}">
  <div class="column-header">
    <h3 class="column-title">{label}</h3>
    <span class="column-count">{count}</span>
  </div>

  <div
    class="column-cards"
    use:dndzone={{
      items,
      flipDurationMs: 200,
      dropTargetStyle: { outline: '1px solid rgba(88, 166, 255, 0.3)', borderRadius: '8px' },
    }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each items as card (card.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <div animate:flip={{ duration: 200 }} onclick={() => handleItemClick(card.id)}>
        <KanbanCard {card} />
      </div>
    {/each}
  </div>
</div>

<style>
  .kanban-column {
    background: rgba(255, 255, 255, 0.02);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1rem;
    min-height: 400px;
    display: flex;
    flex-direction: column;
  }

  .column-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .column-title {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .column-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.3);
    background: rgba(255, 255, 255, 0.05);
    padding: 0.15rem 0.5rem;
    border-radius: 10px;
  }

  .column-cards {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    min-height: 100px;
  }

  .column-in_progress {
    border-top: 2px solid #58a6ff;
  }

  .column-blocked {
    border-top: 2px solid #f85149;
  }

  .column-done {
    border-top: 2px solid #3fb950;
  }

  .column-backlog {
    border-top: 2px solid rgba(255, 255, 255, 0.2);
  }
</style>
