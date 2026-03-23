<script lang="ts">
  let { html, filename }: { html: string; filename: string } = $props();
</script>

<div class="brief-view glass-panel">
  <div class="brief-header">
    <span class="brief-filename">{filename}</span>
  </div>
  <div class="brief-body">
    {@html html}
  </div>
</div>

<style>
  .glass-panel {
    background: rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .brief-header {
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .brief-filename {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.4);
    font-family: monospace;
  }

  .brief-body {
    color: #c9d1d9;
    line-height: 1.7;
    font-size: 0.9rem;
  }

  .brief-body :global(h1),
  .brief-body :global(h2),
  .brief-body :global(h3) {
    color: #e6edf3;
    margin-top: 1.25rem;
    margin-bottom: 0.5rem;
  }

  .brief-body :global(h1) { font-size: 1.3rem; }
  .brief-body :global(h2) { font-size: 1.1rem; }
  .brief-body :global(h3) { font-size: 0.95rem; }

  .brief-body :global(ul),
  .brief-body :global(ol) {
    padding-left: 1.25rem;
  }

  .brief-body :global(li) {
    margin-bottom: 0.25rem;
  }

  .brief-body :global(strong) {
    color: #58a6ff;
  }

  .brief-body :global(code) {
    background: rgba(255, 255, 255, 0.06);
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    font-size: 0.85em;
  }

  .brief-body :global(hr) {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.06);
    margin: 1.25rem 0;
  }

  .brief-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }

  .brief-body :global(th),
  .brief-body :global(td) {
    padding: 0.5rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.06);
    text-align: left;
    font-size: 0.85rem;
  }

  .brief-body :global(th) {
    background: rgba(255, 255, 255, 0.04);
    color: #e6edf3;
    font-weight: 600;
  }
</style>
