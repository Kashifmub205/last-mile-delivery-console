#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="$ROOT/node_modules/metro/src/lib/TerminalReporter.js"

if [ ! -f "$TARGET" ]; then
  exit 0
fi

node <<NODE
const fs = require('fs');
const target = "$TARGET";
let source = fs.readFileSync(target, 'utf8');

const oldStyle =
  'const style = (format, text) => _util.default.styleText(format, text);';

const newStyle = \`const style = (format, text) => {
  if (Array.isArray(format)) {
    return format.reduce(
      (styled, token) => _util.default.styleText(token, styled),
      text,
    );
  }
  return _util.default.styleText(format, text);
};\`;

if (source.includes(oldStyle)) {
  source = source.replace(oldStyle, newStyle);
  fs.writeFileSync(target, source);
}
NODE
