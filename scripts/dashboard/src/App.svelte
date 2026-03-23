<script lang="ts">
  import TabNav from './components/TabNav.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import KanbanBoard from './components/KanbanBoard.svelte';
  import BriefList from './components/BriefList.svelte';
  import Schedule from './components/Schedule.svelte';
  import { activeTab } from './lib/stores';

  let tab = $derived($activeTab);
</script>

<div class="app">
  <header class="app-header">
    <div class="header-content">
      <h1 class="logo">EA</h1>
      <span class="logo-sub">Executive Assistant</span>
    </div>
    <TabNav />
  </header>

  <main class="app-main">
    {#if tab === 'dashboard'}
      <Dashboard />
    {:else if tab === 'kanban'}
      <KanbanBoard />
    {:else if tab === 'briefs'}
      <BriefList />
    {:else if tab === 'schedule'}
      <Schedule />
    {/if}
  </main>
</div>

<style>
  .app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    position: sticky;
    top: 0;
    z-index: 100;
  }

  .header-content {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
  }

  .logo {
    font-size: 1.5rem;
    font-weight: 700;
    color: #58a6ff;
    margin: 0;
    letter-spacing: -0.02em;
  }

  .logo-sub {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    font-weight: 400;
  }

  .app-main {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    margin: 0 auto;
    width: 100%;
  }
</style>
