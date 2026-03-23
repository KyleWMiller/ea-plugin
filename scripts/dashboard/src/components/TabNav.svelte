<script lang="ts">
  import { activeTab, type TabId } from '../lib/stores';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'kanban', label: 'Kanban' },
    { id: 'briefs', label: 'Briefs' },
    { id: 'schedule', label: 'Schedule' },
  ];

  let current = $derived($activeTab);

  function setTab(id: TabId) {
    activeTab.set(id);
  }
</script>

<nav class="tab-nav">
  {#each tabs as tab}
    <button
      class="tab-btn"
      class:active={current === tab.id}
      onclick={() => setTab(tab.id)}
    >
      {tab.label}
    </button>
  {/each}
</nav>

<style>
  .tab-nav {
    display: flex;
    gap: 0.25rem;
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    padding: 3px;
  }

  .tab-btn {
    padding: 0.5rem 1.25rem;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.04);
  }

  .tab-btn.active {
    color: #fff;
    background: rgba(88, 166, 255, 0.15);
    box-shadow: 0 0 12px rgba(88, 166, 255, 0.1);
  }
</style>
