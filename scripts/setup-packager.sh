#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PACKAGER="$ROOT/node_modules/.generated/launchPackager.command"

if [ ! -f "$PACKAGER" ]; then
  exit 0
fi

cat > "$PACKAGER" <<'EOF'
#!/bin/bash

THIS_DIR=$(cd -P "$(dirname "$(readlink "${BASH_SOURCE[0]}" || echo "${BASH_SOURCE[0]}")")" && pwd)

source "$THIS_DIR/.packager.env"
cd "$PROJECT_ROOT"
bash "$PROJECT_ROOT/scripts/with-nvm.sh" node "$REACT_NATIVE_PATH/cli.js" start --port "$RCT_METRO_PORT"

if [[ -z "$CI" ]]; then
  echo "Process terminated. Press <enter> to close the window"
  read -r
fi
EOF

chmod +x "$PACKAGER"
