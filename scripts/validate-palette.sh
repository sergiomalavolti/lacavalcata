#!/usr/bin/env bash
# Re-run the colour checks for the chart palette in src/styles/tokens.css.
#
# The three chart-mark colours must pass all five checks against the chart
# surface. If a token changes, run this before shipping.
#
# The checks themselves come from a validator kept outside this repository, so
# its path is not pinned here. Point PALETTE_VALIDATOR at the directory that
# holds scripts/validate_palette.js.
set -euo pipefail

SURFACE="#121215"

VALIDATOR="${PALETTE_VALIDATOR:-${DATAVIZ_SKILL:-}}"
NODE="${NODE:-$(command -v node || echo "$HOME/.nvm/versions/node/v25.9.0/bin/node")}"

if [[ -z "$VALIDATOR" || ! -f "$VALIDATOR/scripts/validate_palette.js" ]]; then
  echo "validator not found — set PALETTE_VALIDATOR to the directory holding" >&2
  echo "scripts/validate_palette.js" >&2
  exit 2
fi

if [[ ! -x "$NODE" ]]; then
  echo "node not found — set NODE to a node binary" >&2
  exit 2
fi

echo "chart palette (us / opponents / losses) against $SURFACE:"
"$NODE" "$VALIDATOR/scripts/validate_palette.js" "#b98d06,#6683c9,#b4503c" \
  --mode dark --surface "$SURFACE"
