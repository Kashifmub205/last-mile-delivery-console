#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPORTING="$ROOT/node_modules/metro/src/lib/reporting.js"
TERMINAL_REPORTER="$ROOT/node_modules/metro/src/lib/TerminalReporter.js"

if [ ! -f "$REPORTING" ]; then
  exit 0
fi

node <<NODE
const fs = require('fs');

const reportingHelper = \`const styleTextCompat = (format, text) => {
  if (Array.isArray(format)) {
    return format.reduce(
      (styled, token) => _util.default.styleText(token, styled),
      text,
    );
  }
  return _util.default.styleText(format, text);
};
\`;

function patchReporting(target) {
  if (!fs.existsSync(target)) {
    return;
  }

  let source = fs.readFileSync(target, 'utf8');

  if (source.includes('styleTextCompat')) {
    return;
  }

  source = source.replace(
    'const supportsColor = () =>',
    \`\${reportingHelper}
const supportsColor = () =>\`,
  );

  source = source.replace(
    '_util.default.styleText(["yellow", "inverse", "bold"], " WARN ")',
    'styleTextCompat(["yellow", "inverse", "bold"], " WARN ")',
  );
  source = source.replace(
    '_util.default.styleText(["red", "inverse", "bold"], " ERROR ")',
    'styleTextCompat(["red", "inverse", "bold"], " ERROR ")',
  );
  source = source.replace(
    '_util.default.styleText(["cyan", "inverse", "bold"], " INFO ")',
    'styleTextCompat(["cyan", "inverse", "bold"], " INFO ")',
  );

  fs.writeFileSync(target, source);
}

function patchTerminalReporter(target) {
  if (!fs.existsSync(target)) {
    return;
  }

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
}

patchReporting('$REPORTING');
patchTerminalReporter('$TERMINAL_REPORTER');
NODE
