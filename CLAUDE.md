# CLAUDE.md — La cavalcata 2011-2012

A static Astro site telling the story of one basketball season: Caffè Matic –
Trottola Sport, CSI Promozione Bologna 2011-2012. Second in Girone A, eighth
seed of sixteen, won the Super-League final 66–55 at Loiano on 9 June 2012.

This directory is the whole project and the git root. There is nothing above it
but a wrapper folder.

## The one thing to know first

`src/data/season-2011-2012.json` (8.5k lines) is **the source of truth and cannot
be regenerated.** It was extracted from original CSI records — a season
spreadsheet, the federation calendar, a SQLite database — cross-checked across
all three with 149 validation checks and four documented corrections. Those
sources and the Python pipeline that read them were deleted in July 2026 once
the site was finished.

So: edit it by hand, carefully, and never treat it as regenerable output. It
holds `meta`, `roster` (19 players), `games` (23), `playerStats`, `group`,
`playoff`, `final`, `advanced`.

Pages read it through `src/lib/season.js`, never by importing the JSON directly.
That module owns the Italian formatting helpers (`longDate`, `pct`, `num`,
`signed` — all use a decimal comma) and the name/team lookups. Add accessors
there rather than reaching into the data from a page.

## Layout

```
src/pages/       one file per page; nav order lives in src/layouts/Base.astro
src/components/  Seed, Bracket, Referto, BoxscoreModal, QuarterStrip, ChartTooltip,
                 PageHead + three charts (Race, Margin, Quarter)
src/lib/         season.js — the only door to the data
src/assets/      the five photographs, all from finals day, all lowercase .jpg
src/styles/      tokens.css (design tokens) and global.css
scripts/         validate-palette.sh
```

Photographs are imported into pages and passed to `<Image>` so Astro optimises
them at build time. They belong in `src/assets/`, not `public/` — `public/` would
bypass the optimiser and ship 11 MB of full-size JPEGs.

## Running it

Node is nvm-managed here, and the lazy-load shim breaks in non-interactive
shells. Call the binary by absolute path:

```bash
~/.nvm/versions/node/v25.9.0/bin/npm run build     # writes dist/
~/.nvm/versions/node/v25.9.0/bin/npm run preview   # localhost:4321
```

## Two rules that are easy to break

**Chart colours.** `--c-us`, `--c-them`, `--c-loss` in `src/styles/tokens.css`
are a *separate*, validated palette — deliberately not `--giallo`, which is
tuned for text on near-black and sits outside the lightness band a fill colour
needs. Change any of the three and run `npm run palette` before shipping.

**Dark only.** The site commits to one dark treatment on purpose; a light
variant would undo the photographs. Don't add a theme toggle.

## Style

The site's language is Italian — copy, captions, and dates all stay Italian.
Comments in the source are English.
