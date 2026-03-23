import { join } from 'node:path';
import { existsSync } from 'node:fs';

export interface EAConfig {
  version: number;
  os: string;
  domains: {
    active: string[];
    keywords: Record<string, string[]>;
  };
  dashboard: {
    port: number;
  };
  schedule: {
    morningBriefTime: string | null;
    eodWrapTime: string | null;
    brainDumpTime: string | null;
    weeklyPlanTime: string | null;
  };
  brainDumpPath: string | null;
  entityExclusions: string[];
  integrations: {
    googleCalendar: boolean;
    gmail: boolean;
  };
}

const DEFAULT_CONFIG: EAConfig = {
  version: 1,
  os: 'unknown',
  domains: {
    active: ['work', 'family', 'learning'],
    keywords: { work: [], family: [], learning: [] },
  },
  dashboard: { port: 3141 },
  schedule: {
    morningBriefTime: null,
    eodWrapTime: null,
    brainDumpTime: null,
    weeklyPlanTime: null,
  },
  brainDumpPath: null,
  entityExclusions: [],
  integrations: { googleCalendar: false, gmail: false },
};

let cachedConfig: EAConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 1000; // 30 seconds

export function loadConfig(): EAConfig {
  const now = Date.now();
  if (cachedConfig && now - cacheTime < CACHE_TTL) {
    return cachedConfig;
  }

  const configPath = join(
    process.env.EA_DATA_DIR ?? join(process.env.HOME!, '.ea'),
    'config.json'
  );

  try {
    if (!existsSync(configPath)) return DEFAULT_CONFIG;
    const raw = Bun.file(configPath).text();
    // Bun.file().text() returns a promise in some contexts, handle sync read
    if (typeof raw === 'string') {
      cachedConfig = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    } else {
      // Fallback for async context — return default and cache will update next call
      return cachedConfig ?? DEFAULT_CONFIG;
    }
  } catch {
    return DEFAULT_CONFIG;
  }

  cacheTime = now;
  return cachedConfig!;
}

// Color palette for dynamic domains
const DOMAIN_PALETTE = [
  '#58a6ff', // blue
  '#d29922', // amber
  '#bc8cff', // purple
  '#3fb950', // green
  '#f0883e', // orange
  '#f85149', // red
  '#79c0ff', // light blue
  '#56d364', // light green
  '#e3b341', // gold
  '#db61a2', // pink
];

// Stable color assignments for well-known domains
const KNOWN_DOMAIN_COLORS: Record<string, string> = {
  work: '#58a6ff',
  family: '#d29922',
  learning: '#bc8cff',
  business: '#3fb950',
  house: '#f0883e',
  health: '#56d364',
  fitness: '#f85149',
};

export function getDomainColor(domain: string): string {
  if (KNOWN_DOMAIN_COLORS[domain]) return KNOWN_DOMAIN_COLORS[domain];

  // Hash-based stable color for unknown domains
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return DOMAIN_PALETTE[Math.abs(hash) % DOMAIN_PALETTE.length]!;
}
