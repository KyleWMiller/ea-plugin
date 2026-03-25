import type { LociMemory, Domain } from '../shared/types.ts';
import { loadConfig } from './config.ts';

let cachedExport: LociMemory[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getLociMemories(forceRefresh = false): Promise<LociMemory[]> {
  const now = Date.now();
  if (!forceRefresh && cachedExport && now - cacheTime < CACHE_TTL) {
    return cachedExport;
  }

  try {
    const proc = Bun.spawn(['loci', 'export'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    const data = JSON.parse(output);
    cachedExport = data.memories ?? [];
    cacheTime = now;
    return cachedExport!;
  } catch (err) {
    console.error('Failed to export from loci:', err);
    return cachedExport ?? [];
  }
}

export async function getEntityMemories(): Promise<LociMemory[]> {
  const all = await getLociMemories();
  return all.filter(m => m.type === 'entity');
}

export async function getProjectEntities(): Promise<LociMemory[]> {
  const entities = await getEntityMemories();
  const config = loadConfig();
  const exclusions = (config.entityExclusions ?? []).map((e: string) => e.toLowerCase());

  return entities.filter(m => {
    const content = m.content.toLowerCase();

    // Check user-configured exclusions
    if (exclusions.some((e: string) => content.includes(e))) return false;

    // Exclude people — names with roles, titles, or relationship descriptors
    const isPerson = /\b(manager|director|team lead|team member|colleague|wife|husband|son|daughter|friend|benefactor|sponsor)\b/.test(content);
    if (isPerson) return false;

    // Exclude companies/employers (where someone works, not a project)
    const isOrg = /\b(streaming company|employer|corporation)\b/.test(content) &&
      !content.includes('framework') && !content.includes('platform') && !content.includes('app');
    if (isOrg) return false;

    // Include things that look like projects, products, or initiatives
    return /\b(project|framework|platform|app|server|site|consultancy|tool|library|initiative|mcp server)\b/.test(content) ||
      (m.tags && m.tags.some(t => ['project'].includes(t)));
  });
}

export async function storeDomainCorrection(cardTitle: string, oldDomain: Domain, newDomain: Domain, lociEntityId: string | null): Promise<void> {
  const content = `Domain classification correction: "${cardTitle}" should be "${newDomain}" not "${oldDomain}".${lociEntityId ? ` Loci entity: ${lociEntityId}` : ''} Keywords from this item should map to the "${newDomain}" domain.`;
  try {
    const proc = Bun.spawn(['loci', 'store', '--type', 'semantic', '--tags', `domain-correction,${newDomain}`, '--content', content], {
      stdout: 'pipe',
      stderr: 'pipe',
    });
    await proc.exited;
  } catch (err) {
    console.error('Failed to store domain correction in loci:', err);
  }
}

export async function getDomainCorrections(): Promise<Map<string, Domain>> {
  const all = await getLociMemories();
  const corrections = new Map<string, Domain>();
  for (const m of all) {
    if (m.tags?.includes('domain-correction')) {
      const entityMatch = m.content.match(/Loci entity: ([a-f0-9-]+)/);
      const domainMatch = m.content.match(/should be "(\w+)"/);
      if (entityMatch && domainMatch) {
        corrections.set(entityMatch[1]!, domainMatch[1] as Domain);
      }
    }
  }
  return corrections;
}

export async function getLociStats(): Promise<Record<string, number>> {
  try {
    const proc = Bun.spawn(['loci', 'stats'], {
      stdout: 'pipe',
      stderr: 'pipe',
    });

    const output = await new Response(proc.stdout).text();
    await proc.exited;

    const stats: Record<string, number> = {};
    // Skip date/timestamp lines and section headers
    const skipKeys = new Set(['oldest memory', 'newest memory']);
    const skipLines = new Set(['memory statistics', 'by type:', 'by scope:']);

    for (const line of output.split('\n')) {
      const trimmed = line.trim().toLowerCase();
      if (!trimmed || trimmed.startsWith('=') || skipLines.has(trimmed)) continue;

      // Match "key: number" lines (e.g. "Total memories:      107", "Database size: 1847296 bytes")
      const colonMatch = line.match(/^\s*(.+?):\s+(\d+)/);
      if (colonMatch) {
        const key = colonMatch[1]!.trim().toLowerCase();
        if (!skipKeys.has(key)) {
          stats[key] = parseInt(colonMatch[2]!, 10);
        }
        continue;
      }

      // Match non-colon lines like "  episodic     56"
      const spaceMatch = line.match(/^\s+(\w+)\s+(\d+)\s*$/);
      if (spaceMatch) {
        stats[spaceMatch[1]!.toLowerCase()] = parseInt(spaceMatch[2]!, 10);
      }
    }
    return stats;
  } catch {
    return {};
  }
}
