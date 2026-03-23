<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchSchedule, fetchBriefs, fetchStats } from '../lib/api';
  import { briefsList, stats } from '../lib/stores';
  import type { BriefMeta } from '../../shared/types';

  let todayHtml = $state('');
  let todayBrief = $state<BriefMeta | null>(null);
  let lociStats = $state<Record<string, number>>({});
  let recentBriefs = $state<BriefMeta[]>([]);
  let loading = $state(true);

  onMount(async () => {
    const [schedule, briefs, st] = await Promise.all([
      fetchSchedule(),
      fetchBriefs(),
      fetchStats(),
    ]);

    todayBrief = schedule.brief;
    todayHtml = schedule.content?.html ?? '';
    briefsList.set(briefs);
    recentBriefs = briefs.slice(0, 5);
    lociStats = st;
    stats.set(st);
    loading = false;
  });

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  function formatStat(key: string, val: number): string {
    if (key === 'database size') return formatBytes(val);
    return String(val);
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
</script>

<div class="dashboard">
  <div class="dashboard-grid">
    <!-- Main brief panel -->
    <div class="glass-panel brief-panel">
      <div class="panel-header">
        <h2>Today's Brief</h2>
        <span class="date">{today}</span>
      </div>
      {#if loading}
        <div class="loading">Loading...</div>
      {:else if todayHtml}
        <div class="brief-content">{@html todayHtml}</div>
      {:else}
        <div class="empty-state">
          <p>No morning brief yet for today.</p>
          <p class="hint">Briefs run automatically via cron.</p>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="sidebar">
      <!-- Stats -->
      <div class="glass-panel stats-panel">
        <h3>Memory Stats</h3>
        <div class="stats-grid">
          {#each Object.entries(lociStats) as [key, val]}
            <div class="stat">
              <span class="stat-value">{formatStat(key, val)}</span>
              <span class="stat-label">{key}</span>
            </div>
          {/each}
        </div>
      </div>

      <!-- Recent briefs -->
      <div class="glass-panel recent-panel">
        <h3>Recent Briefs</h3>
        {#if recentBriefs.length === 0}
          <p class="empty-hint">No briefs yet.</p>
        {:else}
          <ul class="recent-list">
            {#each recentBriefs as brief}
              <li class="recent-item">
                <span class="brief-type type-{brief.type}">{brief.title}</span>
                <span class="brief-date">{brief.date}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 1.5rem;
    align-items: start;
  }

  .glass-panel {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 1.25rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .panel-header h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #e6edf3;
  }

  .date {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .brief-content {
    color: #c9d1d9;
    line-height: 1.7;
    font-size: 0.9rem;
  }

  .brief-content :global(h1),
  .brief-content :global(h2),
  .brief-content :global(h3) {
    color: #e6edf3;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .brief-content :global(ul),
  .brief-content :global(ol) {
    padding-left: 1.25rem;
  }

  .brief-content :global(li) {
    margin-bottom: 0.25rem;
  }

  .brief-content :global(strong) {
    color: #58a6ff;
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: rgba(255, 255, 255, 0.4);
  }

  .hint {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.25);
    margin-top: 0.5rem;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  h3 {
    margin: 0 0 1rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: #e6edf3;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 8px;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #58a6ff;
  }

  .stat-label {
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.4);
    text-transform: capitalize;
    margin-top: 0.25rem;
  }

  .recent-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .recent-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  }

  .recent-item:last-child {
    border-bottom: none;
  }

  .brief-type {
    font-size: 0.8rem;
    font-weight: 500;
  }

  .brief-date {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .type-morning-brief { color: #58a6ff; }
  .type-eod-wrap { color: #d29922; }
  .type-weekly-plan { color: #3fb950; }
  .type-inbox-triage { color: #f0883e; }
  .type-project-pulse { color: #bc8cff; }

  .loading {
    text-align: center;
    padding: 2rem;
    color: rgba(255, 255, 255, 0.3);
  }

  .empty-hint {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.85rem;
  }

  @media (max-width: 900px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
