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

## Example Workflows

These examples show what a typical day looks like with the EA running. Your setup will adapt to whatever schedule and domains you configure during onboarding.

### Morning Brief (auto-generated daily)

The EA pulls your calendar, Loci memory, and pending items to produce a domain-organized brief:

```markdown
# Morning Brief — Monday, June 9, 2026

## Work
- **Focus: Auth service migration** — swap JWT provider, update middleware tests
- **Sprint standup** — 10:00 AM (15 min)
- **1:1 with Sarah Chen** — 2:00 PM

## Family
- **Anniversary dinner** — 5 days left, still no reservation. Book today
- Pickup Liam from soccer at 4:30 PM

## Learning
- **Rust async chapter** — left off at ch. 12 last session, aim to finish ch. 13 tonight

## Today's Schedule
| Time | Block |
|------|-------|
| 8:00–8:30 AM  | Morning brief + inbox scan |
| 8:30–10:00 AM | Peak focus — auth service migration |
| 10:00–10:15 AM | Sprint standup |
| 10:15 AM–12:00 PM | Deep work — auth migration continued |
| 12:00–1:00 PM | Lunch |
| 2:00–2:30 PM | 1:1 with Sarah Chen |
| 2:30–4:15 PM | Code review + follow-ups |
| 4:30 PM | Pickup Liam from soccer |
| 9:00–10:30 PM | Evening — Rust async chapter 13 |

## Needs Attention
- **Anniversary dinner** — book reservation today
```

Briefs are generated headlessly via `claude -p` and saved to `~/.ea/briefs/`. The dashboard renders them with full markdown support.

### Weekly Plan (auto-generated Monday mornings)

Reviews the previous week across all domains, flags slipping priorities, and sets the plan:

```markdown
# Weekly Plan — June 9–15, 2026

## Last Week in Review

### Work — ON TRACK
Auth migration Phase 1 merged Friday. No blockers from code review.

### Learning — NEEDS FOCUS
> **Accountability note:** Rust book was last week's #1 learning priority but
> only 1 chapter completed. Side project debugging ate into study time.
> This week: chapters 13–15, no detours.

| # | Priority | Est. Hours |
|---|----------|-----------|
| 1 | Rust async — chapters 13, 14, 15 | 4h |
| 2 | Review Sarah's RFC on caching layer | 1h |

Side project is feature-frozen until Rust chapters are done.
**Do not touch it this week** unless something breaks.
```

The EA tracks carry-forward items week to week and calls out when priorities slip — it holds you accountable.

### Brain Dump (nightly)

Throughout the day, jot thoughts into your brain dump file (plain text, any format):

```
Sarah mentioned the caching RFC deadline moved to Friday
Need to renew car registration before the 20th
Idea: use Loci entity relations for dependency mapping at work
Started reading "Designing Data-Intensive Applications"
```

The EA reads the file nightly, classifies each item into the right Loci memory type (entity, episodic, semantic, procedural), checks for duplicates, stores relations, and clears the file. Next morning's brief incorporates everything automatically.

### Interactive Session

```
You: schedule dentist appointment next Tuesday at 2pm
EA:  Created "Dentist appointment" on Tuesday June 10 at 2:00 PM (1 hour).
     Stored as episodic memory.

You: plan my evening
EA:  Based on your priorities and today's progress:
     9:00–10:15 PM — Rust async ch. 13 (continues from last session)
     10:15–10:30 PM — Review tomorrow's calendar, brain dump

You: who is Sarah Chen
EA:  Sarah Chen — Senior engineer on your team. Owns the caching layer.
     Writing an RFC on cache invalidation (due Friday). Weekly 1:1 on Mondays
     at 2 PM. Prefers Slack for async, quick calls for design discussions.
     Related: work domain, auth-migration project.

You: switch to learning mode
EA:  You're in learning mode. Last session you finished Rust async ch. 12.
     This week's goal: chapters 13–15.
     Break reminders active every 45 minutes.
```

### EOD Wrap (auto-generated at end of work)

Compares your morning plan against what actually happened:

```markdown
# EOD Wrap — June 9, 2026

## Planned vs Actual
| Planned | Status |
|---------|--------|
| Auth migration deep work | Done — 3.5 hours, middleware tests passing |
| Sprint standup | Done |
| 1:1 with Sarah Chen | Done — discussed caching RFC timeline |
| Book anniversary dinner | **Not done** — carry forward |
| Rust ch. 13 evening session | Done — finished chapter, started ch. 14 |

## Carry Forward
- Book anniversary dinner (2nd day carried — escalating)

## Tomorrow's Top 3
1. Auth migration — integration tests for the new JWT provider
2. Book anniversary dinner (seriously this time)
3. Review Sarah's caching RFC draft
```

## License

MIT
