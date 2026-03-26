---
name: ea
description: >
  Personal executive assistant powered by Loci memory and system crontab.
  Use this skill whenever the user mentions scheduling, planning, daily routine,
  time management, morning brief, weekly planning, brain dump, life domains,
  work-life balance, or wants to set up automated EA workflows. Also use when the
  user says "ea", "assistant", "schedule my day", "plan my week", "onboard",
  "set up my EA", or references any of their life domains. This skill manages
  onboarding interviews, schedule creation, and ongoing EA operations.
---

# Executive Assistant Skill

A personal EA system for Claude Code CLI. Uses Loci MCP for structured memory
and system crontab for persistent cron-based automation.

## Prerequisites

Before running, verify these are available:

1. **Loci MCP** (required) — `loci` binary in PATH. If missing, direct the user to
   install Loci: https://github.com/jasonjmcghee/loci — then stop.
2. **Google Calendar MCP** (recommended) — enables calendar-aware briefs, event
   creation, and free-time finding. If `gcal_list_events` tool is not available:
   - Explain what it enables
   - Ask if the user wants to set it up now or skip
   - EA works without it, just no calendar features
3. **Gmail MCP** (optional) — enables inbox triage and VIP email alerts in briefs.
   Fully optional — most EA features work without it.

If Loci is missing, stop. For Google Calendar and Gmail, note their status and
continue — the system degrades gracefully.

---

## Data Directory

All EA data lives in `~/.ea/` (a symlink managed by the plugin's SessionStart hook).

- `~/.ea/briefs/` — Generated briefs (morning, EOD, weekly)
- `~/.ea/dashboard/data/` — Kanban board state
- `~/.ea/logs/` — Maintenance logs
- `~/.ea/config.json` — User configuration (domains, schedule, integrations)
- `~/.ea/scripts/` — Helper scripts (symlinked from plugin)

---

## Modes

This skill operates in two modes based on Loci memory state.

### Detecting mode

At invocation, run:
```
recall_memory(query: "ea onboarding complete", type: "semantic", max_results: 1)
```

- **No result or empty** → Run **Onboarding Mode**
- **Result found with content confirming onboarding** → Run **Operations Mode**

---

## Onboarding Mode

The goal is to interview the user, seed Loci with structured memory, configure
their domains, verify MCP integrations, and set up scheduled tasks via crontab.

### Phase 1: MCP Verification

Check which integrations are available:
- Test Loci: `recall_memory(query: "test", max_results: 1)` — if this fails, stop.
- Test Google Calendar: try `gcal_list_events` — note if available.
- Test Gmail: try listing recent messages — note if available.

Record results for Phase 3.5.

### Phase 2: Life Domain Discovery

Ask the user: **"What areas of your life do you want to track?"**

Suggest the defaults (work, family, learning) but let them define their own.
They might add "business", "house", "health", "fitness", "side-project", etc.

For each domain they choose, collect:

**For any work/career domain:**
- Job title, company, team
- Key projects and deadlines
- Important colleagues and stakeholders (names, roles, relationship)
- Communication tools (Slack channels, email lists)
- Typical work hours and meeting patterns
- Current priorities and pain points

**For any personal/business domain:**
- What the business is (product/service, stage)
- Key clients or partners
- Revenue goals or milestones
- Tools and platforms used

**For family:**
- Family members and ages (only what user volunteers)
- Regular commitments (school pickup, family dinner, date night)
- Upcoming events (birthdays, trips, holidays)
- Hard boundaries (e.g., "no work after 6pm", "weekends are family time")

**For any house/property domain:**
- Active projects (renovations, repairs, maintenance)
- Contractors or service providers
- Recurring tasks and upcoming deadlines

**For learning:**
- What they're currently studying or want to learn
- Format preferences (books, courses, videos, hands-on)
- Time allocated for learning
- Current progress on any courses or certifications

**For any custom domain:**
- What it encompasses
- Key people, projects, or commitments
- How often they want updates

Do NOT rush — ask one domain at a time, confirm before moving on.

### Phase 2.5: Schedule Preferences

After all domains are captured, ask about scheduling:

- What time do you wake up? When do you start work?
- When do you stop work? Hard boundaries?
- When are your most productive/creative hours?
- Do you prefer time-blocking or flexible scheduling?
- How often should I check your inbox? (every 15m? hourly? twice a day?)
- Do you want a morning briefing? What time?
- Do you want an end-of-day wrap-up? What time?
- Weekly planning — which day and what time?
- How do you capture random thoughts throughout the day?
  (brain-dump.md? voice notes? specific app?)
- What's the path to your brain dump file?

### Phase 3: Store Everything in Loci

After the interview, store all collected information. Follow this pattern exactly:

**Entity memories** — one per person, project, company, system:
```
store_memory(content: "John Smith — VP Engineering at Acme Corp. Direct manager.
Prefers async communication via Slack. Weekly 1:1 on Tuesdays at 10am.",
type: "entity", tags: ["work", "people"])
```
Then connect entities:
```
store_relation(source: "<john_id>", predicate: "manages", target: "<user_entity_id>")
store_relation(source: "<john_id>", predicate: "works_at", target: "<acme_id>")
```

**Semantic memories** — preferences, facts, standing rules:
```
store_memory(content: "User wakes at 6:30am. Most productive hours are 7-11am.
Hard stop at 5:30pm for family time. No meetings before 9am.",
type: "semantic", tags: ["schedule", "preferences"])
```

**Procedural memories** — workflows the user described:
```
store_memory(content: "Morning routine: check calendar → triage inbox →
identify top 3 priorities → time-block the day. Takes ~20 minutes.",
type: "procedural", tags: ["schedule", "morning"])
```

**Episodic memory** — record the onboarding itself:
```
store_memory(content: "EA onboarding completed on [DATE]. Domains configured:
[list domains]. [N] entities stored, [N] semantic facts, [N] procedural
workflows. Schedule preferences captured.",
type: "episodic", tags: ["ea", "onboarding"])
```

**Onboarding flag** — so future invocations skip to Operations Mode:
```
store_memory(content: "EA onboarding complete. System configured with [N] life
domains, scheduled tasks running via system crontab.",
type: "semantic", tags: ["ea", "system"])
```

### Phase 3.5: Write Plugin Configuration

Based on the interview, update `~/.ea/config.json`:

1. Read the existing `~/.ea/config.json`
2. Set `domains.active` to the user's chosen domain list
3. Set `domains.keywords` — for each domain, add relevant keywords:
   - Keywords from their employer name, team name, project names
   - Business name, client names
   - Family member names (if volunteered)
   - Any domain-specific keywords
4. Set `schedule.morningBriefTime` to their preferred brief time
5. Set `schedule.eodWrapTime` to their end-of-day time
6. Set `schedule.brainDumpTime` to their brain dump processing time
7. Set `schedule.weeklyPlanTime` to their weekly planning time
8. Set `brainDumpPath` to their brain dump file path
9. Set `entityExclusions` to the user's own name and identity strings
10. Set `integrations.googleCalendar` and `integrations.gmail` based on Phase 1 results
11. Write the updated config back

Also store the data path in Loci for redundancy:
```
store_memory(content: "EA data directory is ~/.ea. Briefs are in ~/.ea/briefs/.
Dashboard data is in ~/.ea/dashboard/data/. Config is ~/.ea/config.json.",
type: "semantic", tags: ["ea", "system", "paths"])
```

### Phase 4: Verify Scheduled Tasks

Tasks are managed via system crontab. Verify with `crontab -l`. If any are
missing, add them using the prompts from `task-prompts.md`, customized with
the user's actual times and preferences.

Use `which claude` to find the claude binary path for cron entries.

**Required tasks:**
1. **morning-brief** — daily at user's wake time + 30min
2. **eod-wrap** — daily at user's stop time
3. **brain-dump** — nightly at 11pm (or user's bedtime - 30min)
4. **weekly-plan** — at user's preferred planning day and time
5. **loci-maintenance** — daily at 2am: `EA_DATA_DIR=~/.ea ~/.ea/scripts/ea-loci-maintenance.sh`

**Optional tasks:**
6. **inbox-triage** — every N hours during work hours
7. **relationship-check** — periodic, surfaces contacts not engaged in 30+ days
8. **project-pulse** — weekly, checks all active projects for stalled items

### Phase 5: Confirm and Summarize

After all tasks are registered, present a summary:

```
EA Setup Complete
─────────────────
Domains: [N] configured ([list])
Entities stored: [N] people, [N] projects, [N] systems
Preferences stored: [N] semantic memories
Workflows stored: [N] procedural memories
Scheduled tasks: [N] registered
Integrations: Google Calendar [yes/no], Gmail [yes/no]

Schedule:
  [TIME] — Morning brief (daily)
  [TIME] — End-of-day wrap (weekdays)
  [TIME] — Brain dump processing (nightly)
  [TIME] — Weekly planning ([day])
  02:00  — Loci maintenance (daily)

To check task status: crontab -l
To check memory stats: run `loci stats` in terminal
To open the dashboard: /ea:dashboard
To re-run onboarding: supersede the onboarding flag in Loci, then /ea:ea
```

---

## Operations Mode

When onboarding is already complete, this skill acts as the interactive EA.

### Session Start Protocol

Every time this skill is invoked in Operations Mode:

1. Recall active context:
   ```
   recall_memory(query: "schedule preferences domains priorities",
                 type: "semantic", summary_only: true, max_results: 10)
   ```

2. Recall recent events:
   ```
   recall_memory(query: "recent events decisions today",
                 type: "episodic", summary_only: true, max_results: 5)
   ```

3. Check for today's brief:
   - Look for `~/.ea/briefs/[TODAY'S DATE]-morning-brief.md`
   - If it exists, read it and use it as context

4. Greet the user with a quick status — don't dump everything, just the
   most relevant items. Example:
   ```
   Good morning. Your brief is ready — 3 meetings today, the plumber
   is confirmed for 2pm, and your deploy from yesterday passed.
   What would you like to focus on?
   ```

### Available Operations

In Operations Mode, respond to these patterns:

**"schedule [event] on [day] at [time]" / "add [event] to my calendar"**
→ Use gcal_create_event to create the event on the primary calendar.
  Infer defaults: 30min for meetings, 60min for focus blocks, unless stated.
  Confirm creation with event title, time, and link.
  Store as episodic memory: "Scheduled [event] for [date/time]"

**"move [event] to [day/time]" / "reschedule [event]"**
→ Use gcal_list_events to find the matching event by title/time,
  then gcal_update_event with the new time. Confirm the change.
  Store as episodic: "Rescheduled [event] from [old] to [new]"

**"cancel [event]" / "delete [event] on [day]"**
→ Use gcal_list_events to find the event, then gcal_delete_event.
  Confirm deletion. Store as episodic.

**"block [time range] for [activity]" / "time block my day"**
→ Create calendar events for time blocks via gcal_create_event.
  Can batch-create multiple blocks across the day.

**"find time for [activity] this week"**
→ Use gcal_find_my_free_time to identify open slots, suggest options.

**"respond [yes/no/maybe] to [event invitation]"**
→ Use gcal_respond_to_event.

**"open dashboard" / "launch dashboard"**
→ Start the EA dashboard: `bash ~/.ea/scripts/start-dashboard.sh`
  Open in browser: `bash ~/.ea/scripts/open-browser.sh`

**"plan my day" / "what's today look like"**
→ Recall today's calendar, active projects, pending items from last EOD wrap.
  Propose time blocks organized by domain. Store the plan as episodic memory.

**"plan my week" / "weekly review"**
→ Recall this week's episodic memories, semantic goals, procedural planning
  workflow. Generate the full weekly plan. Store as episodic.

**"check on [project/person/domain]"**
→ Recall entity and episodic memories for that topic. Summarize current state.

**"add [item] to brain dump"**
→ Append to the user's brain dump file (path from config or semantic memory).

**"who is [name]" / "what do I know about [entity]"**
→ Recall entity memory, traverse relations, show full context.

**"update [anything]"**
→ Recall the existing memory, supersede with new information. Never stack
  contradictory facts.

**"what did I do [today/this week/on DATE]"**
→ Recall episodic memories for that time range.

**"switch to [domain] mode"**
→ Set up /loop tasks relevant to that domain. See references/domain-loops.md
  for the loop configurations per domain.

### Item Completion Tracking

**CRITICAL — this is the #1 source of user frustration when missed.**

When the user says an item is done, handled, completed, responded to, or
otherwise resolved — **immediately store an episodic memory in that same
conversation turn.** Do not defer this to a future session.

Format:
```
store_memory(
  content: "[Item name] — completed/resolved as of [YYYY-MM-DD]. Remove from future briefs.",
  type: "episodic",
  group: "ea"
)
```

**Detection patterns** — store a completion when the user says any of:
- "I already did that" / "I've done that" / "that's done"
- "I responded to [person]" / "I replied" / "I messaged them"
- "no action needed" / "already handled" / "taken care of"
- "I followed up" / "I reached out"
- Any past-tense statement about a briefed action item

This applies to ALL item types: tasks, follow-ups, messages, account setups,
calendar items, relationship nudges — anything surfaced in a brief or
suggested by the EA.

Do this **silently and immediately**. Do not ask "should I mark this as done?"

**Why this matters:** Morning briefs, EOD wraps, and weekly plans run as fresh
headless sessions via cron. They have ZERO access to prior conversations. The
ONLY way they know an item is done is if a completion memory exists in Loci.
Without it, the item resurfaces — and the user has to repeat themselves.

### Storing During Operations

Any time something noteworthy happens during an Operations session, store it:
- Decision made → episodic
- Preference stated or changed → semantic (supersede old)
- New person/project mentioned → entity + relations
- Workflow described or refined → procedural (supersede old)
- **Item completed or resolved → episodic completion (see above)**

Do this silently — don't ask "should I store this?" Just do it. The user
hired an EA, not a librarian asking permission to file things.

### Kanban Board Sync

When scheduling an actionable task (not routine meetings), automatically add
a card to the kanban board at `~/.ea/dashboard/data/kanban.json`.

**When to add a card:**
- Scheduling a task that requires deliverable work (research, reply, build, review)
- Adding a new project or initiative
- Creating a time block for focused work on a specific goal

**When NOT to add a card:**
- Routine recurring events (standup, prayer group, family dinner)
- Simple calendar queries or reschedules of existing cards

**How to add:** Read `~/.ea/dashboard/data/kanban.json`, append a new card
to the `cards` array, and write the file back. Use this format:
```json
{
  "id": "<random-uuid>",
  "title": "<short task title>",
  "domain": "<domain from user's active domains>",
  "column": "in_progress",
  "description": "<brief description with deadline>",
  "lociEntityId": "<loci-entity-id-if-stored-or-null>",
  "lastActivity": "<YYYY-MM-DD>",
  "createdAt": "<YYYY-MM-DD>",
  "order": <next available order number in column>
}
```
Infer the domain from context. Default to "in_progress" for scheduled tasks.

---

## File References

- `references/task-prompts.md` — Full prompt templates for each scheduled task
- `references/domain-loops.md` — /loop configurations for each life domain
- `templates/morning-brief.md` — Output template for the morning brief
- `templates/weekly-plan.md` — Output template for the weekly plan
- `templates/eod-wrap.md` — Output template for end-of-day wrap
