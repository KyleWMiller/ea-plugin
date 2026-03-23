#!/bin/bash
# setup.sh — First-run initializer for the EA plugin.
# Called by session-init.sh when config.json doesn't exist yet.
set -euo pipefail

EA_DATA="${CLAUDE_PLUGIN_DATA}"

# Create data directory structure
mkdir -p "$EA_DATA/briefs"
mkdir -p "$EA_DATA/dashboard/data"
mkdir -p "$EA_DATA/logs"
mkdir -p "$EA_DATA/scripts"

# Detect OS
case "$(uname -s)" in
  Linux*)  OS="linux" ;;
  Darwin*) OS="macos" ;;
  *)       OS="unknown" ;;
esac

# Write default config
cat > "$EA_DATA/config.json" << CONFIGEOF
{
  "version": 1,
  "os": "$OS",
  "domains": {
    "active": ["work", "family", "learning"],
    "keywords": {
      "work": [],
      "family": [],
      "learning": []
    }
  },
  "dashboard": {
    "port": 3141
  },
  "schedule": {
    "morningBriefTime": null,
    "eodWrapTime": null,
    "brainDumpTime": null,
    "weeklyPlanTime": null
  },
  "brainDumpPath": null,
  "entityExclusions": [],
  "integrations": {
    "googleCalendar": false,
    "gmail": false
  }
}
CONFIGEOF

echo "EA plugin setup complete. Config written to $EA_DATA/config.json"
