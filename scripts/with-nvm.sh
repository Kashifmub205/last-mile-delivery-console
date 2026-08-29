#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

prefer_nvm_node() {
  export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
  if [ ! -s "$NVM_DIR/nvm.sh" ]; then
    return 1
  fi

  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"

  if nvm use >/dev/null 2>&1; then
    return 0
  fi

  return 1
}

if ! prefer_nvm_node; then
  if ! command -v node >/dev/null 2>&1; then
    echo "Node.js not found. Install Node 20 (preferred) or 21, then retry." >&2
    exit 1
  fi
  echo "nvm/.nvmrc Node 20 not available; using $(command -v node) ($(node -v))." >&2
fi

MAJOR="$(node -p "process.versions.node.split('.')[0]" 2>/dev/null || true)"
if [ -n "${MAJOR}" ] && { [ "${MAJOR}" -lt 20 ] || [ "${MAJOR}" -ge 22 ]; }; then
  echo "Warning: Node $(node -v) is outside the supported range (>=20 <22). Prefer Node 20." >&2
fi

exec "$@"
