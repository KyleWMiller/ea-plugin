#!/bin/bash
# session-init.sh — Runs on every Claude session start via SessionStart hook.
# Must be fast: no installs, no network calls.
set -euo pipefail

EA_DATA="${CLAUDE_PLUGIN_DATA}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"

# Create/update ~/.ea symlink → plugin data directory
if [ -L "$HOME/.ea" ]; then
  current=$(readlink "$HOME/.ea")
  if [ "$current" != "$EA_DATA" ]; then
    ln -sfn "$EA_DATA" "$HOME/.ea"
  fi
elif [ ! -e "$HOME/.ea" ]; then
  ln -sfn "$EA_DATA" "$HOME/.ea"
else
  echo '{"systemMessage": "WARNING: ~/.ea exists but is not a symlink. EA plugin cannot initialize. Remove or rename ~/.ea and restart."}'
  exit 0
fi

# First-run setup if config doesn't exist yet
if [ ! -f "$EA_DATA/config.json" ]; then
  bash "$PLUGIN_ROOT/scripts/setup.sh"
  echo '{"systemMessage": "EA plugin initialized. Data directory: ~/.ea. Run /ea:ea to start onboarding."}'
  exit 0
fi

# Symlink helper scripts so skill markdown can reference ~/.ea/scripts/*
mkdir -p "$EA_DATA/scripts"
for script in start-dashboard.sh open-browser.sh ea-loci-maintenance.sh; do
  ln -sf "$PLUGIN_ROOT/scripts/$script" "$EA_DATA/scripts/$script"
done

# Check dependencies
MISSING=""
command -v loci >/dev/null 2>&1 || MISSING="loci "
command -v bun >/dev/null 2>&1 || MISSING="${MISSING}bun "

if [ -n "$MISSING" ]; then
  echo "{\"systemMessage\": \"EA ready. Missing deps: ${MISSING}— dashboard requires bun, memory features require loci.\"}"
else
  echo '{"systemMessage": "EA plugin ready."}'
fi
