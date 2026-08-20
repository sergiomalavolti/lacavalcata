# CLAUDE.md — La cavalcata 2011-2012

A static Astro site telling the story of one basketball season: Caffè Matic –
Trottola Sport, CSI Promozione Bologna 2011-2012. Second in Girone A, eighth
seed of sixteen, won the Super-League final at Loiano on 9 June 2012, 66 points
to 55. (The site prints that result 55–66 — see the home-first rule below.)

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

Three traps in the data, all of which bite. A player on the distinta who never
entered is `{played: false, points: null}`, not `0` — filter on `played` before
any aggregate. `playerStats[].average` divides by `played`, not `games`. And
game `seq: 10` is a 30–0 forfeit with an empty boxscore that appears in no
player's log, so per-game denominators are **22**, not 23.

## Layout

```
src/pages/       one file per page; nav order lives in src/layouts/Base.astro
                 squadra/[id].astro builds the 19 player pages at /squadra/<id>/
src/components/  Seed, Bracket, Referto, BoxscoreModal, QuarterStrip, ChartTooltip,
                 TableSort, PageHead + four charts (Race, Margin, Quarter, PlayerSeason)
src/lib/         season.js — the only door to the data
                 player.js — per-player season analysis, built on season.js
                 url.js — u(), which every internal link goes through
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

## Publishing

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and
publishes to GitHub Pages. Pages serves it from its own domain,
**https://lacavalcata.com**, set by `public/CNAME` — which is why `base` in
`astro.config.mjs` is `/` and not a project sub-path.
`dist/` stays gitignored — CI builds it from source. The site carries
`<meta name="robots" content="noindex">` on purpose: reachable by link, absent
from search results.

## Mobile

The site is built to work down to 320px. Two tokens carry it: `--masthead-h`
(the sticky bar's height, per breakpoint — `scroll-padding-top` on `html` reads
it so in-page anchors clear the bar) and `--tap` (44px).

**800px is the nav breakpoint**, and it is measured, not chosen: it is the width
at which the eight nav items still fit on one row. Below it `Base.astro` swaps
them for a slide-in drawer. The toggle ships with `hidden` and the script
removes it, so with no JavaScript the nav degrades to the old wrapped list
instead of a button that does nothing — keep that property if you touch it.
Note that `.masthead` drops its `backdrop-filter` below 800px on purpose:
`backdrop-filter` makes an element the containing block for `position: fixed`
descendants, which would position the drawer against the bar, not the viewport.

Touch enlargements are guarded by `@media (max-width: 799px), (hover: none)`
so the desktop layout is untouched. Standalone controls take the full `--tap`;
controls inside dense tables grow their hit area with padding cancelled by an
equal negative margin, so row height does not move.

## Five rules that are easy to break

**A result is written home team first.** Always — whoever won, on every page,
in tables, boxscores, the Tabellone, chart tooltips and prose alike. The game 3
win at Granarolo is **51–52**, never 52–51. Never print
`{g.ourScore}–{g.theirScore}`; go through `scoreLine(game)` in
`src/lib/season.js`, or `scoreSides(game)` when the markup needs to know which
number is ours (several pages give ours weight or colour, and it has to keep
that wherever in the pair it lands). Two traps: `advanced.clutch.list[].score`
is baked into the JSON as `[nostri, loro]`, so render those from the game
record instead; and the Tabellone's `legs[].scoreA/scoreB` are in *series*
order, which is fixed for a whole tie while home ground alternates leg by leg —
order those by `leg.hostedBy`. The final is the one game with no host, played
at Loiano, and the referto lists Amadeus first, so it reads 55–66.

**Chart colours.** `--c-us`, `--c-them`, `--c-loss` in `src/styles/tokens.css`
are a *separate*, validated palette — deliberately not `--giallo`, which is
tuned for text on near-black and sits outside the lightness band a fill colour
needs. Change any of the three and run `npm run palette` before shipping — it
needs `PALETTE_VALIDATOR` pointing at the directory holding the validator's
`scripts/validate_palette.js`, and exits 2 saying so if it is unset.

**Dark only.** The site commits to one dark treatment on purpose; a light
variant would undo the photographs. Don't add a theme toggle.

**Nothing may scroll the page sideways.** Two habits keep it that way, and both
have already been violated once. A `<table>` always goes inside
`<div class="table-scroll">` — no exceptions; the two that were missed
(`Referto`'s sheet, the player page's split cards) overflowed a phone. And an
`auto-fit`/`auto-fill` track never shrinks below its `minmax()` floor, so write
`minmax(min(100%, 20rem), 1fr)`, never a bare `minmax(20rem, 1fr)`. Related:
`1fr` is `minmax(auto, 1fr)` and inherits its content's min-width — use
`minmax(0, 1fr)` when a grid holds something wide.

**Internal links go through `u()`.** The site serves from a domain root today,
so `base` is `/` and `u()` is a no-op — a hand-written `href="/finale/"` would
work. That is exactly why the rule is worth stating: the site served from
`/lacavalcata/` until the custom domain, where such an href built fine and then
404d, and the only reason that move was a one-line change is that every link
already went through `u()`. Write `href={u('/finale/')}` — importing `u` from
`src/lib/url.js` — and the prefix stays named in exactly one place, `base` in
`astro.config.mjs`. Anchors and external URLs pass through `u()` untouched, so
it is safe anywhere.

## Style

The site's language is Italian — copy, captions, and dates all stay Italian.
Comments in the source are English.
