# Executive Assistant Plugin for Claude Code

A personal executive assistant powered by [Loci](https://github.com/jasonjmcghee/loci) memory, system crontab automation, and an interactive dashboard. Manages your life across customizable domains (work, family, learning, and any others you define) with daily briefs, end-of-day wraps, weekly planning, and a kanban board.

## What It Does

- **Onboarding interview** — Captures your life domains, schedule, contacts, and preferences into structured Loci memory
- **Automated daily briefs** — Morning briefing and end-of-day wrap-up generated via cron
- **Weekly planning** — Reviews the past week, sets priorities, creates time blocks
- **Brain dump processing** — Nightly capture of random thoughts into structured memory
- **Kanban dashboard** — Web UI with drag-drop task board, brief viewer, and memory stats
- **Calendar integration** — Schedule, reschedule, and find free time via Google Calendar
- **Domain mode switching** — Context-aware loops for focused work sessions

## Prerequisites

### Required

- **[Loci MCP](https://github.com/jasonjmcghee/loci)** — Cognitive memory server. Install the `loci` binary and register it in your `~/.claude/.mcp.json`. This is the backbone of the EA — all memory storage, recall, and maintenance depends on it.

### Recommended

- **[Bun](https://bun.sh)** — JavaScript runtime for the dashboard. Install with `curl -fsSL https://bun.sh/install | bash`. Required only if you want the web dashboard.

- **Google Calendar MCP** — Enables calendar-aware briefs, event creation, and free-time finding. The EA works without it, but you lose all calendar features.

### Optional

- **Gmail MCP** — Enables inbox triage and VIP email alerts in briefs. Fully optional.

## Installation

```
/plugin marketplace add KyleWMiller/ea-plugin
/plugin install ea@KyleWMiller/ea-plugin
```

Or test locally:
```bash
claude --plugin-dir /path/to/ea-plugin
```

## Getting Started

After installation, run:

```
/ea:ea
```

This starts the onboarding interview which:

1. **Checks prerequisites** — Verifies Loci is available, tests Google Calendar and Gmail if present
2. **Discovers your domains** — Asks what areas of life you want to track (defaults: work, family, learning — you can add any custom domains)
3. **Interviews you** — Collects contacts, projects, schedule preferences, and workflows per domain
4. **Seeds Loci memory** — Stores everything as typed memories (entity, semantic, procedural, episodic) with relations
5. **Writes your config** — Saves preferences to `~/.ea/config.json`
6. **Registers cron tasks** — Sets up morning brief, EOD wrap, brain dump, weekly plan, and Loci maintenance

## Data Directory

All EA data lives at `~/.ea/` (a symlink managed by the plugin):

```
~/.ea/
├── config.json          # Your preferences and domain configuration
├── briefs/              # Generated briefs (morning, EOD, weekly)
├── dashboard/
│   └── data/
│       └── kanban.json  # Kanban board state
├── logs/
│   └── maintenance.log  # Loci maintenance logs
└── scripts/             # Helper scripts (symlinked from plugin)
```

## Dashboard

Launch the web dashboard:

```
/ea:dashboard
```

Features:
- **Today's brief** — Rendered morning brief with memory stats
- **Kanban board** — Drag-drop task management across your domains
- **Brief archive** — Browse all past briefs by type and date
- **Loci sync** — Pull new projects from Loci entities into the kanban

Default port: `3141` (configurable in `~/.ea/config.json`).

## Cron Tasks

The EA registers these automated tasks via `crontab`:

| Task | Schedule | What It Does |
|------|----------|--------------|
| morning-brief | Daily (your wake time + 30m) | Generates domain-organized daily brief |
| eod-wrap | Daily (your stop time) | Compares plan vs actual, carries forward items |
| brain-dump | Nightly | Processes brain dump file into structured memory |
| weekly-plan | Weekly (your planning day) | Reviews week, sets priorities, creates time blocks |
| loci-maintenance | Daily at 2am | Compacts memory, runs cleanup dry-run |

Optional: inbox-triage (hourly), relationship-check (weekly), project-pulse (weekly).

## Configuration

`~/.ea/config.json` reference:

```json
{
  "version": 1,
  "os": "linux",
  "domains": {
    "active": ["work", "family", "learning"],
    "keywords": {
      "work": ["acme", "project-x"],
      "family": [],
      "learning": ["rust", "ml-course"]
    }
  },
  "dashboard": { "port": 3141 },
  "schedule": {
    "morningBriefTime": "07:00",
    "eodWrapTime": "17:30",
    "brainDumpTime": "23:00",
    "weeklyPlanTime": "09:00"
  },
  "brainDumpPath": "~/brain-dump.md",
  "entityExclusions": ["my name"],
  "integrations": {
    "googleCalendar": true,
    "gmail": false
  }
}
```

## Operations Mode

After onboarding, `/ea:ea` becomes your interactive assistant:

- **"schedule meeting with Bob on Friday at 2pm"** — Creates calendar event
- **"plan my day"** — Generates time-blocked plan from calendar + priorities
- **"check on project X"** — Recalls entity and episodic memories
- **"switch to learning mode"** — Activates domain-specific monitoring loops
- **"open dashboard"** — Launches the web UI
- **"who is [name]"** — Full entity recall with relation traversal

## License

MIT
