---
name: dashboard
description: >
  Launch the EA executive dashboard. Use when the user says "dashboard",
  "open dashboard", "launch dashboard", "show dashboard", or "ea dash".
---

# EA Dashboard Launcher

Launches the EA executive dashboard web app.

## Steps

1. Read the configured port from `~/.ea/config.json` (default: 3141):
   ```bash
   PORT=$(jq -r '.dashboard.port // 3141' ~/.ea/config.json 2>/dev/null || echo 3141)
   ```

2. Check if the server is already running:
   ```bash
   curl -s http://localhost:$PORT/api/stats
   ```

3. If not running, start it:
   ```bash
   bash ~/.ea/scripts/start-dashboard.sh
   ```
   Wait 2 seconds for startup.

4. Open in the default browser:
   ```bash
   bash ~/.ea/scripts/open-browser.sh
   ```

5. Confirm to the user:
   ```
   Dashboard is live at http://localhost:$PORT
   ```

If the build is stale or missing, `start-dashboard.sh` handles rebuilding automatically.
