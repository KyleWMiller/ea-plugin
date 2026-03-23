<script lang="ts">
  import { DOMAIN_COLORS } from '../../shared/types';
  import type { KanbanCard } from '../../shared/types';

  let { card }: { card: KanbanCard } = $props();

  const domainColor = $derived(DOMAIN_COLORS[card.domain] ?? '#58a6ff');
  const linkCount = $derived(((card.dependencies ?? []).length) + ((card.blockedBy ?? []).length));
</script>

<div class="kanban-card" style="--domain-color: {domainColor}">
  <div class="card-header">
    <span class="domain-tag" style="background: {domainColor}20; color: {domainColor}">
      {card.domain}
    </span>
  </div>
  <h4 class="card-title">{card.title}</h4>
  {#if card.description}
    <p class="card-desc">{card.description.slice(0, 100)}{card.description.length > 100 ? '...' : ''}</p>
  {/if}
  <div class="card-footer">
    {#if linkCount > 0}
      <span class="link-count">&#128279; {linkCount}</span>
    {/if}
    <span class="card-date">{card.lastActivity}</span>
  </div>
</div>

<style>
  .kanban-card {
    background: rgba(22, 27, 34, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-left: 3px solid var(--domain-color);
    border-radius: 8px;
    padding: 0.875rem;
    cursor: grab;
    transition: all 0.2s ease;
  }

  .kanban-card:hover {
    background: rgba(22, 27, 34, 0.9);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3),
      0 0 20px color-mix(in srgb, var(--domain-color) 10%, transparent);
    transform: translateY(-1px);
  }

  .kanban-card:active {
    cursor: grabbing;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .domain-tag {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .card-title {
    margin: 0 0 0.375rem 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e6edf3;
    line-height: 1.3;
  }

  .card-desc {
    margin: 0 0 0.5rem 0;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.4);
    line-height: 1.4;
  }

  .card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .link-count {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .card-date {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.25);
    margin-left: auto;
  }
</style>
