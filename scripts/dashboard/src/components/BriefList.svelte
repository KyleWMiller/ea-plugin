<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchBriefs, fetchBrief } from '../lib/api';
  import { briefsList } from '../lib/stores';
  import BriefView from './BriefView.svelte';
  import type { BriefMeta } from '../../shared/types';

  let briefs = $state<BriefMeta[]>([]);
  let selectedBrief = $state<string | null>(null);
  let briefHtml = $state('');
  let filterType = $state<string>('all');
  let loading = $state(true);

  const types = ['all', 'morning-brief', 'eod-wrap', 'weekly-plan', 'inbox-triage', 'project-pulse'];

  onMount(async () => {
    briefs = await fetchBriefs();
    briefsList.set(briefs);
    loading = false;
  });

  const filteredBriefs = $derived(
    filterType === 'all' ? briefs : briefs.filter(b => b.type === filterType)
  );

  async function selectBrief(filename: string) {
    selectedBrief = filename;
    const data = await fetchBrief(filename);
    briefHtml = data.html;
  }

  function goBack() {
    selectedBrief = null;
    briefHtml = '';
  }

  function formatType(type: string): string {
    return type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
</script>

<div class="briefs">
  {#if selectedBrief}
    <button class="back-btn" onclick={goBack}>&larr; Back to list</button>
    <BriefView html={briefHtml} filename={selectedBrief} />
  {:else}
    <div class="briefs-toolbar">
      <h2>Briefs Archive</h2>
      <div class="filter-group">
        {#each types as t}
          <button
            class="filter-btn"
            class:active={filterType === t}
            onclick={() => (filterType = t)}
          >
            {t === 'all' ? 'All' : formatType(t)}
          </button>
        {/each}
      </div>
    </div>

    {#if loading}
      <div class="loading">Loading briefs...</div>
    {:else if filteredBriefs.length === 0}
      <div class="empty">No briefs found.</div>
    {:else}
      <div class="briefs-list">
        {#each filteredBriefs as brief}
          <button class="brief-row" onclick={() => selectBrief(brief.filename)}>
            <span class="brief-title">{brief.title}</span>
            <span class="brief-type type-{brief.type}">{formatType(brief.type)}</span>
            <span class="brief-date">{brief.date}</span>
          </button>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .briefs {
    max-width: 900px;
  }

  .briefs-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
    color: #e6edf3;
  }

  .filter-group {
    display: flex;
    gap: 0.25rem;
  }

  .filter-btn {
    padding: 0.3rem 0.6rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: transparent;
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .filter-btn:hover {
    color: rgba(255, 255, 255, 0.7);
    border-color: rgba(255, 255, 255, 0.15);
  }

  .filter-btn.active {
    background: rgba(88, 166, 255, 0.15);
    border-color: rgba(88, 166, 255, 0.3);
    color: #58a6ff;
  }

  .briefs-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .brief-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1.25rem;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    width: 100%;
    color: inherit;
    font-family: inherit;
  }

  .brief-row:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .brief-title {
    flex: 1;
    font-size: 0.9rem;
    font-weight: 500;
    color: #e6edf3;
  }

  .brief-type {
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.15rem 0.5rem;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.05);
  }

  .type-morning-brief { color: #58a6ff; }
  .type-eod-wrap { color: #d29922; }
  .type-weekly-plan { color: #3fb950; }
  .type-inbox-triage { color: #f0883e; }
  .type-project-pulse { color: #bc8cff; }

  .brief-date {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.3);
    min-width: 80px;
    text-align: right;
  }

  .back-btn {
    display: inline-block;
    margin-bottom: 1rem;
    padding: 0.4rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.8rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .back-btn:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }

  .loading, .empty {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.3);
  }
</style>
