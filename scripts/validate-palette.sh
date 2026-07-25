#!/usr/bin/env bash
# Re-run the colour checks for the chart palette in src/styles/tokens.css.
#
# The three chart-mark colours must pass all five checks against the chart
# surface. If a token changes, run this before shipping.
#
# The validator ships with Claude's bundled `dataviz` skill, which lives in a
# session-scoped temp directory — so the path is discovered at run time rather
# than pinned. Set DATAVIZ_SKILL to override if it lives somewhere else.
set -euo pipefail

SURFACE="#121215"

find_skill() {
  [[ -n "${DATAVIZ_SKILL:-}" ]] && { echo "$DATAVIZ_SKILL"; return; }
  local hit
  hit=$(find /tmp/claude-* -maxdepth 4 -type d -name dataviz 2>/dev/null | head -1)
  echo "$hit"
}

SKILL=$(find_skill)
NODE="${NODE:-$(command -v node || echo "$HOME/.nvm/versions/node/v25.9.0/bin/node")}"

if [[ -z "$SKILL" || ! -f "$SKILL/scripts/validate_palette.js" ]]; then
  echo "validator not found — set DATAVIZ_SKILL to the dataviz skill directory" >&2
  echo "(it contains scripts/validate_palette.js)" >&2
  exit 2
fi

if [[ ! -x "$NODE" ]]; then
  echo "node not found — set NODE to a node binary" >&2
  exit 2
fi

echo "chart palette (us / opponents / losses) against $SURFACE:"
"$NODE" "$SKILL/scripts/validate_palette.js" "#b98d06,#6683c9,#b4503c" \
  --mode dark --surface "$SURFACE"
