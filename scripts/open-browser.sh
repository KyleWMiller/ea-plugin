#!/bin/bash
# open-browser.sh — Opens the EA dashboard in the default browser.
# OS-agnostic: supports Linux and macOS.
set -euo pipefail

EA_DATA="${EA_DATA_DIR:-$HOME/.ea}"

# Read port from config
PORT=3141
if [ -f "$EA_DATA/config.json" ] && command -v jq >/dev/null 2>&1; then
  PORT=$(jq -r '.dashboard.port // 3141' "$EA_DATA/config.json")
fi

URL="http://localhost:$PORT"

case "$(uname -s)" in
  Linux*)  xdg-open "$URL" 2>/dev/null ;;
  Darwin*) open "$URL" ;;
  *)       echo "Open $URL in your browser" ;;
esac
