<script lang="ts">
  import { onMount } from 'svelte';
  import { DOMAIN_COLORS, COLUMN_LABELS } from '../../shared/types';
  import type { KanbanCard, LinkType, Domain } from '../../shared/types';

  const DOMAINS: Domain[] = ['work', 'business', 'family', 'house', 'learning'];

  let {
    card,
    allCards,
    onUpdate,
    onArchive,
    onClose,
  }: {
    card: KanbanCard;
    allCards: KanbanCard[];
    onUpdate: (card: KanbanCard) => void;
    onArchive: (cardId: string) => void;
    onClose: () => void;
  } = $props();

  let editingTitle = $state(false);
  let editingDesc = $state(false);
  let editingNotes = $state(false);
  let showAddLink = $state(false);
  let confirmArchive = $state(false);

  let titleValue = $state(card.title);
  let descValue = $state(card.description);
  let notesValue = $state(card.notes ?? '');

  let linkType = $state<LinkType>('depends_on');
  let searchQuery = $state('');
  let searchFocused = $state(false);

  const domainColor = $derived(DOMAIN_COLORS[card.domain] ?? '#58a6ff');
  const columnLabel = $derived(COLUMN_LABELS[card.column] ?? card.column);

  const allLinks = $derived(() => {
    const deps = (card.dependencies ?? []).map(id => ({ id, type: 'depends_on' as LinkType }));
    const blocks = (card.blockedBy ?? []).map(id => ({ id, type: 'blocks' as LinkType }));
    return [...deps, ...blocks];
  });

  const hasLinks = $derived(allLinks().length > 0);

  const searchResults = $derived(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allCards
      .filter(c => c.id !== card.id && !c.archived && c.title.toLowerCase().includes(q))
      .slice(0, 6);
  });

  function resolveCard(id: string) {
    return allCards.find(c => c.id === id);
  }

  function saveField(field: 'title' | 'description' | 'notes', value: string) {
    const updated = { ...card, [field]: value, lastActivity: new Date().toISOString().split('T')[0]! };
    onUpdate(updated);
  }

  function changeDomain(e: Event) {
    const next = (e.target as HTMLSelectElement).value as Domain;
    const updated = { ...card, domain: next, lastActivity: new Date().toISOString().split('T')[0]! };
    onUpdate(updated);
  }

  function addLink(targetId: string) {
    const updated = { ...card };
    if (linkType === 'depends_on') {
      updated.dependencies = [...(updated.dependencies ?? []), targetId];
    } else {
      updated.blockedBy = [...(updated.blockedBy ?? []), targetId];
    }
    updated.lastActivity = new Date().toISOString().split('T')[0]!;
    onUpdate(updated);

    // Bidirectional: update the target card too
    const target = allCards.find(c => c.id === targetId);
    if (target) {
      const targetUpdated = { ...target };
      if (linkType === 'depends_on') {
        targetUpdated.blockedBy = [...(targetUpdated.blockedBy ?? []), card.id];
      } else {
        targetUpdated.dependencies = [...(targetUpdated.dependencies ?? []), card.id];
      }
      targetUpdated.lastActivity = new Date().toISOString().split('T')[0]!;
      onUpdate(targetUpdated);
    }

    searchQuery = '';
    showAddLink = false;
  }

  function removeLink(targetId: string, type: LinkType) {
    const updated = { ...card };
    if (type === 'depends_on') {
      updated.dependencies = (updated.dependencies ?? []).filter(id => id !== targetId);
    } else {
      updated.blockedBy = (updated.blockedBy ?? []).filter(id => id !== targetId);
    }
    updated.lastActivity = new Date().toISOString().split('T')[0]!;
    onUpdate(updated);

    // Bidirectional removal
    const target = allCards.find(c => c.id === targetId);
    if (target) {
      const targetUpdated = { ...target };
      if (type === 'depends_on') {
        targetUpdated.blockedBy = (targetUpdated.blockedBy ?? []).filter(id => id !== card.id);
      } else {
        targetUpdated.dependencies = (targetUpdated.dependencies ?? []).filter(id => id !== card.id);
      }
      targetUpdated.lastActivity = new Date().toISOString().split('T')[0]!;
      onUpdate(targetUpdated);
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  function handleBackdrop(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) onClose();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-backdrop" onclick={handleBackdrop}>
  <div class="modal-panel" style="--domain-color: {domainColor}">
    <!-- Header -->
    <div class="modal-header">
      <select class="domain-select" style="background: {domainColor}20; color: {domainColor}" onchange={changeDomain} value={card.domain}>
        {#each DOMAINS as d}
          <option value={d} style="background: #161b22; color: {DOMAIN_COLORS[d]}">{d}</option>
        {/each}
      </select>
      <button class="close-btn" onclick={onClose}>&times;</button>
    </div>

    <!-- Title -->
    {#if editingTitle}
      <input
        class="edit-title"
        bind:value={titleValue}
        onblur={() => { editingTitle = false; saveField('title', titleValue); }}
        onkeydown={(e) => { if (e.key === 'Enter') { editingTitle = false; saveField('title', titleValue); } }}
        autofocus
      />
    {:else}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <h2 class="card-title" onclick={() => { editingTitle = true; }}>{card.title}</h2>
    {/if}

    <!-- Meta -->
    <div class="meta-row">
      <span class="meta-item">
        <span class="meta-label">Status</span>
        <span class="meta-value status-{card.column}">{columnLabel}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Created</span>
        <span class="meta-value">{card.createdAt}</span>
      </span>
      <span class="meta-item">
        <span class="meta-label">Last Activity</span>
        <span class="meta-value">{card.lastActivity}</span>
      </span>
    </div>

    <div class="divider"></div>

    <!-- Description -->
    <div class="section">
      <h3>Description</h3>
      {#if editingDesc}
        <textarea
          class="edit-area"
          bind:value={descValue}
          onblur={() => { editingDesc = false; saveField('description', descValue); }}
          rows="3"
        ></textarea>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="editable-text" onclick={() => { editingDesc = true; }}>
          {card.description || 'Click to add description...'}
        </div>
      {/if}
    </div>

    <div class="divider"></div>

    <!-- Notes -->
    <div class="section">
      <h3>Notes</h3>
      {#if editingNotes}
        <textarea
          class="edit-area notes-area"
          bind:value={notesValue}
          onblur={() => { editingNotes = false; saveField('notes', notesValue); }}
          rows="5"
          placeholder="Markdown supported..."
        ></textarea>
      {:else}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="editable-text" onclick={() => { editingNotes = true; }}>
          {#if notesValue}
            <div class="notes-rendered">{notesValue}</div>
          {:else}
            <span class="placeholder">Click to add notes...</span>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Links (only show if links exist or adding) -->
    {#if hasLinks || showAddLink}
      <div class="divider"></div>
      <div class="section">
        <div class="section-header">
          <h3>Links</h3>
          {#if !showAddLink}
            <button class="add-link-btn" onclick={() => { showAddLink = true; }}>+ Add Link</button>
          {/if}
        </div>

        <!-- Existing links -->
        {#if hasLinks}
          <div class="link-pills">
            {#each allLinks() as link}
              {@const target = resolveCard(link.id)}
              {#if target}
                {@const targetColor = DOMAIN_COLORS[target.domain] ?? '#58a6ff'}
                <span class="link-pill" style="border-color: {targetColor}40">
                  <span class="link-type">{link.type === 'depends_on' ? 'depends on' : 'blocks'}</span>
                  <span class="link-title" style="color: {targetColor}">{target.title}</span>
                  <button class="link-remove" onclick={() => removeLink(link.id, link.type)}>&times;</button>
                </span>
              {/if}
            {/each}
          </div>
        {/if}

        <!-- Add link form -->
        {#if showAddLink}
          <div class="add-link-form">
            <select class="link-type-select" bind:value={linkType}>
              <option value="depends_on">depends on</option>
              <option value="blocks">blocks</option>
            </select>
            <div class="search-container">
              <input
                class="search-input"
                type="text"
                placeholder="Search cards..."
                bind:value={searchQuery}
                onfocus={() => { searchFocused = true; }}
                onblur={() => { setTimeout(() => { searchFocused = false; }, 200); }}
              />
              {#if searchFocused && searchResults().length > 0}
                <div class="search-dropdown">
                  {#each searchResults() as result}
                    {@const resultColor = DOMAIN_COLORS[result.domain] ?? '#58a6ff'}
                    <button class="search-result" onclick={() => addLink(result.id)}>
                      <span class="result-domain" style="color: {resultColor}">{result.domain}</span>
                      <span class="result-title">{result.title}</span>
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <button class="cancel-link-btn" onclick={() => { showAddLink = false; searchQuery = ''; }}>Cancel</button>
          </div>
        {/if}
      </div>
    {:else}
      <div class="divider"></div>
      <div class="section">
        <button class="add-link-btn standalone" onclick={() => { showAddLink = true; }}>+ Add Link</button>
      </div>
    {/if}

    <div class="divider"></div>

    <!-- Archive -->
    <div class="section archive-section">
      {#if confirmArchive}
        <span class="archive-confirm-text">Archive this card?</span>
        <button class="archive-confirm-btn" onclick={() => onArchive(card.id)}>Yes, archive</button>
        <button class="archive-cancel-btn" onclick={() => { confirmArchive = false; }}>Cancel</button>
      {:else}
        <button class="archive-btn" onclick={() => { confirmArchive = true; }}>Archive Card</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-panel {
    background: rgba(13, 17, 23, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 2rem;
    width: 600px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5), 0 0 40px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .domain-select {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border: 1px solid transparent;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s;
    appearance: none;
    -webkit-appearance: none;
    padding-right: 1.2rem;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='rgba(255,255,255,0.4)'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.35rem center;
  }

  .domain-select:hover {
    border-color: rgba(255, 255, 255, 0.15);
  }

  .close-btn {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.4);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
    transition: color 0.15s;
  }

  .close-btn:hover {
    color: #fff;
  }

  .card-title {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #e6edf3;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .card-title:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .edit-title {
    width: 100%;
    margin: 0 0 1rem 0;
    padding: 0.35rem;
    font-size: 1.25rem;
    font-weight: 600;
    color: #e6edf3;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(88, 166, 255, 0.3);
    border-radius: 4px;
    outline: none;
    font-family: inherit;
  }

  .meta-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .meta-item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .meta-label {
    font-size: 0.65rem;
    color: rgba(255, 255, 255, 0.35);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meta-value {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .status-in_progress { color: #58a6ff; }
  .status-blocked { color: #f85149; }
  .status-done { color: #3fb950; }
  .status-backlog { color: rgba(255, 255, 255, 0.5); }

  .divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.06);
    margin: 1rem 0;
  }

  .section {
    margin-bottom: 0.5rem;
  }

  .section h3 {
    margin: 0 0 0.5rem 0;
    font-size: 0.8rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editable-text {
    padding: 0.5rem;
    border-radius: 6px;
    cursor: pointer;
    color: #c9d1d9;
    font-size: 0.85rem;
    line-height: 1.6;
    transition: background 0.15s;
    min-height: 2rem;
  }

  .editable-text:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .placeholder {
    color: rgba(255, 255, 255, 0.25);
    font-style: italic;
  }

  .notes-rendered {
    white-space: pre-wrap;
  }

  .edit-area {
    width: 100%;
    padding: 0.5rem;
    font-size: 0.85rem;
    color: #c9d1d9;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(88, 166, 255, 0.2);
    border-radius: 6px;
    outline: none;
    font-family: inherit;
    line-height: 1.6;
    resize: vertical;
  }

  .notes-area {
    font-family: 'SFMono-Regular', 'Consolas', 'Liberation Mono', monospace;
    font-size: 0.8rem;
  }

  /* Links */
  .link-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  .link-pill {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.25rem 0.5rem;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid;
    border-radius: 6px;
    font-size: 0.75rem;
  }

  .link-type {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.65rem;
  }

  .link-title {
    font-weight: 500;
  }

  .link-remove {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    font-size: 0.9rem;
    padding: 0;
    line-height: 1;
  }

  .link-remove:hover {
    color: #f85149;
  }

  .add-link-btn {
    background: none;
    border: 1px solid rgba(88, 166, 255, 0.2);
    color: #58a6ff;
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .add-link-btn:hover {
    background: rgba(88, 166, 255, 0.1);
  }

  .add-link-btn.standalone {
    margin-top: 0;
  }

  .add-link-form {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .link-type-select {
    padding: 0.4rem 0.5rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #c9d1d9;
    border-radius: 6px;
    font-size: 0.8rem;
    font-family: inherit;
    outline: none;
  }

  .search-container {
    position: relative;
    flex: 1;
    min-width: 200px;
  }

  .search-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: #c9d1d9;
    border-radius: 6px;
    font-size: 0.8rem;
    font-family: inherit;
    outline: none;
  }

  .search-input:focus {
    border-color: rgba(88, 166, 255, 0.3);
  }

  .search-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: rgba(22, 27, 34, 0.98);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    z-index: 10;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  .search-result {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: none;
    background: none;
    color: #c9d1d9;
    font-size: 0.8rem;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    transition: background 0.1s;
  }

  .search-result:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .result-domain {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    min-width: 60px;
  }

  .result-title {
    flex: 1;
  }

  .cancel-link-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    padding: 0.35rem 0.6rem;
    border-radius: 4px;
    cursor: pointer;
  }

  .cancel-link-btn:hover {
    color: rgba(255, 255, 255, 0.8);
  }

  /* Archive */
  .archive-section {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .archive-btn {
    background: none;
    border: 1px solid rgba(248, 81, 73, 0.2);
    color: rgba(248, 81, 73, 0.7);
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .archive-btn:hover {
    background: rgba(248, 81, 73, 0.1);
    color: #f85149;
  }

  .archive-confirm-text {
    font-size: 0.85rem;
    color: #f85149;
  }

  .archive-confirm-btn {
    background: rgba(248, 81, 73, 0.15);
    border: 1px solid rgba(248, 81, 73, 0.3);
    color: #f85149;
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
  }

  .archive-cancel-btn {
    background: none;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.8rem;
    padding: 0.35rem 0.7rem;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
