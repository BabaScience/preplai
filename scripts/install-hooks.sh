#!/bin/sh
# Install git hooks for this repository.
# Run once after cloning: sh scripts/install-hooks.sh

set -e

HOOKS_DIR=".git/hooks"
SCRIPTS_DIR="$(dirname "$0")/hooks"

if [ ! -d "$HOOKS_DIR" ]; then
  echo "Error: .git/hooks directory not found. Run from the repo root."
  exit 1
fi

copy_hook() {
  src="$SCRIPTS_DIR/$1"
  dst="$HOOKS_DIR/$1"
  if [ -f "$src" ]; then
    cp "$src" "$dst"
    chmod +x "$dst"
    echo "Installed: $1"
  fi
}

copy_hook pre-commit

echo ""
echo "Git hooks installed. Credential scanning is now active on every commit."
