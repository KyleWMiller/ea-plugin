# Domain Loop Configurations

When the user says "switch to [domain] mode" in an interactive session,
set up these /loop tasks. Cancel any loops from the previous domain first.

Each domain has a set of loops optimized for what matters during that
focus block. All loops should store relevant findings in Loci.

The user's active domains are stored in `~/.ea/config.json` under
`domains.active`. Adapt loop configurations to match their configured domains.

---

## Work Mode

Activate when: user says "work mode", "switching to work", "starting work",
or begins discussing work-related topics at the start of a session.

```
/loop 15m Check Gmail via MCP for messages from work contacts (recall entity memories tagged "work" and "people" to get the list). Summarize anything urgent. Store notable items as episodic in Loci.
```

```
/loop 30m Check active work projects in Loci (recall entity memories tagged "work" and "projects"). Flag anything with a deadline in the next 48 hours. Store status as episodic.
```

Optional (if user has GitHub/GitLab MCP):
```
/loop 20m Check for PR reviews requested or CI failures on active branches. Store findings as episodic.
```

---

## Family Mode

Activate when: user says "family mode", "family time", "logging off for family",
or it's past their stated hard stop time.

**No loops by default.** Family mode means not being interrupted.

Only activate if user explicitly asks:
```
/loop 60m Quick check — anything truly urgent in email? Only flag if it matches "emergency" or "critical" from a VIP. Otherwise, stay quiet.
```

Store an episodic memory noting when family mode started and ended,
so the EOD wrap can account for it.

---

## Learning Mode

Activate when: user says "learning mode", "study time", "course work",
or mentions a learning topic.

```
/loop 45m Gentle reminder: take a 5-minute break, stretch, hydrate. (Use notify-send on Linux or osascript -e 'display notification "Time for a break!" with title "EA"' on macOS.)
```

```
/loop 30m Recall procedural memory for current study workflow. Check: are you still on track with the plan, or did you get sidetracked? Store a brief progress note as episodic.
```

---

## Custom Domain Mode

For any user-defined domain not listed above, use this generic template:

Activate when: user says "[domain] mode" or switches to a custom domain.

```
/loop 30m Recall entity memories for active [domain] projects. Check if any have pending items, upcoming appointments, or overdue follow-ups. Store findings as episodic.
```

---

## Switching Domains

When the user switches domains:

1. Cancel all active loops: ask Claude to list and cancel current cron tasks
2. Store an episodic memory: "Switched from [old] to [new] mode at [time]"
3. Recall context for the new domain:
   - recall_memory(query: "[domain] active projects priorities", summary_only: true)
   - recall_memory(query: "[domain] recent activity", type: "episodic", max_results: 5)
4. Activate the new domain's loops
5. Give a brief status for the new domain

The domain switch should feel instant — 2-3 seconds of recall, then
"You're in [domain] mode. Last session you were working on [X]. Pick up
where you left off?"
