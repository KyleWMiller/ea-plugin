#!/bin/bash
# ea-loci-maintenance.sh
# Run nightly via cron to compact and clean Loci memory.
# Register with: 0 2 * * * EA_DATA_DIR=~/.ea ~/.ea/scripts/ea-loci-maintenance.sh

set -euo pipefail

EA_DATA="${EA_DATA_DIR:-$HOME/.ea}"
LOG_DIR="$EA_DATA/logs"
LOG_FILE="$LOG_DIR/maintenance.log"
mkdir -p "$LOG_DIR"

echo "=== Loci maintenance started $(date -Iseconds) ===" >> "$LOG_FILE"

# Compact: decay old episodic memories, promote patterns
if command -v loci &> /dev/null; then
    loci compact >> "$LOG_FILE" 2>&1
    echo "  compact: OK" >> "$LOG_FILE"

    # Cleanup preview (dry-run so nothing is deleted without review)
    loci cleanup --dry-run >> "$LOG_FILE" 2>&1
    echo "  cleanup dry-run: OK" >> "$LOG_FILE"

    # Stats snapshot
    loci stats >> "$LOG_FILE" 2>&1
else
    echo "  ERROR: loci binary not found in PATH" >> "$LOG_FILE"
fi

echo "=== Loci maintenance finished $(date -Iseconds) ===" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"
