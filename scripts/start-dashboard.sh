#!/bin/bash
# start-dashboard.sh — Starts the EA dashboard server.
# Handles dependency installation, building, and startup.
set -euo pipefail

EA_DATA="${EA_DATA_DIR:-$HOME/.ea}"
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT:-$(dirname "$(realpath "$0")")/..}"
DASHBOARD_DIR="$PLUGIN_ROOT/scripts/dashboard"

# Read port from config
PORT=3141
if [ -f "$EA_DATA/config.json" ] && command -v jq >/dev/null 2>&1; then
  PORT=$(jq -r '.dashboard.port // 3141' "$EA_DATA/config.json")
fi

# Check if already running
if curl -s "http://localhost:$PORT/api/stats" > /dev/null 2>&1; then
  echo "Dashboard already running on port $PORT"
  exit 0
fi

# Check for bun
if ! command -v bun >/dev/null 2>&1; then
  echo "ERROR: bun is required to run the dashboard. Install from https://bun.sh"
  exit 1
fi

# Install dependencies if needed
if [ ! -d "$DASHBOARD_DIR/node_modules" ]; then
  echo "Installing dashboard dependencies..."
  cd "$DASHBOARD_DIR" && bun install
fi

# Build frontend if needed
if [ ! -d "$EA_DATA/dashboard/dist" ]; then
  echo "Building dashboard frontend..."
  cd "$DASHBOARD_DIR" && EA_DATA_DIR="$EA_DATA" bun run build
  # Copy dist to data dir so server can serve it
  cp -r "$DASHBOARD_DIR/dist" "$EA_DATA/dashboard/dist" 2>/dev/null || true
fi

# Start server
echo "Starting EA Dashboard on port $PORT..."
cd "$DASHBOARD_DIR" && EA_DATA_DIR="$EA_DATA" EA_DASHBOARD_PORT="$PORT" bun run server.ts &
sleep 2

if curl -s "http://localhost:$PORT/api/stats" > /dev/null 2>&1; then
  echo "Dashboard running at http://localhost:$PORT"
else
  echo "Dashboard may still be starting. Check http://localhost:$PORT"
fi
