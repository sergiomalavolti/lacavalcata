# La cavalcata 2011-2012

> Eighth seed of sixteen. Champions.

A static site telling the story of one basketball season: **Caffè Matic –
Trottola Sport** in CSI Promozione Bologna, 2011-2012 — second in Girone A,
eighth seed into the Super-League playoff, winners of the final at Loiano on
9 June 2012.

**Live at [lacavalcata.com](https://lacavalcata.com).** The site is in Italian,
and it carries `<meta name="robots" content="noindex">` on purpose: reachable by
anyone with the link, absent from search results.

## The season

CSI Promozione Bologna, 2011-2012: 48 teams across 6 gironi, the top two of each
— plus the four best thirds — going through to the Super-League playoff.

Caffè Matic finished **second in Girone A** at 11–3, 33 points, 876 scored
against 698 allowed. That put them in as the **eighth seed of sixteen**, with the
top seed waiting one round in.

| Round      | Opponent                              | Seed | Series    |
| ---------- | ------------------------------------- | ---- | --------- |
| Ottavi     | Tecnocem – Ghepard 2003               | 9    | 2–0       |
| Quarti     | Pallacanestro Granarolo               | 1    | 2–1       |
| Semifinale | Pallacanestro Zola Predosa            | 12   | 2–1       |
| Finale     | Birreria Amadeus – Thunder Basket     | 3    | **55–66** |

Two of the three series went to a decider. The quarti was settled on the road at
Granarolo, 51–52; the semifinale at home against Zola Predosa, 79–68.

The final was played on 9 June 2012 at the Palasport di Loiano — the one game of
the season on neutral ground, with no host. Paride Greco, number 16, was named
MVP.

Across the whole season the record was 18–5 in 23 games, or 17–5 in the 22
actually played: one was a 30–0 forfeit win, which counts in the record while
appearing in nobody's box score. On court the team scored 64.9 a game and
allowed 56.7, a margin of +8.2, with a best run of nine straight wins.

The final reads 55–66, not 66–55, because every result on this site is written
home team first and the referto lists Amadeus first. That is the convention
broken most easily — see *House rules*.

## Running it

Astro 7, so Node 22.12 or newer. CI builds on Node 22; this machine runs 25
under nvm, where the lazy-load shim breaks in non-interactive shells — call the
binary by absolute path there (`~/.nvm/versions/node/v25.9.0/bin/npm`).

```bash
npm install
npm run dev       # dev server, hot reload
npm run build     # writes dist/ — 27 pages: 8 routes + 19 player pages
npm run preview   # serves the built site at http://localhost:4321/
npm run palette   # re-runs the chart-colour checks (see House rules)
```

Everything ships with the site: the three webfonts are subset and served from
the build, the five photographs are optimised into WebP at build time, and no
page makes an external network request at run time.

## Publishing

Push to `main`. That is the whole procedure — `.github/workflows/deploy.yml`
builds the site and publishes it to GitHub Pages, and `dist/` is never
committed, so the repository stays the source and the published site is always
what the source produces. The Actions tab shows the run; `workflow_dispatch`
re-publishes by hand without a new commit.

The custom domain lives in `public/CNAME`, which is why `base` in
`astro.config.mjs` is `/` rather than a project sub-path. Internal links still
go through `u()` (`src/lib/url.js`) regardless — it is a no-op at base `/`, and
it is what makes moving the site to a sub-path a one-line change.

## The data

`src/data/season-2011-2012.json` — 8.5k lines holding the whole season:
`meta`, `roster` (19 players), `games` (23), `playerStats`, `group`, `playoff`,
`final`, `advanced`.

**It is the source of truth and it cannot be regenerated.** It was extracted
from the original CSI records — a season spreadsheet, the federation calendar
and a SQLite database kept at the time — cross-checked across all three with 149
validation checks and four documented corrections where they disagreed. Those
sources and the pipeline that read them were retired once the site was finished,
so this file is the only surviving copy of the season in structured form. Edit
it by hand, carefully; never treat it as generated output.

Pages read it through `src/lib/season.js`, never by importing the JSON directly.
That module owns the lookups and the Italian formatting helpers (`longDate`,
`pct`, `num`, `signed` — all decimal comma). Add accessors there rather than
reaching into the data from a page.

Three traps in the data, all of which have bitten:

- A player on the distinta who never entered is `{played: false, points: null}`,
  not `0`. Filter on `played` before any aggregate.
- `playerStats[].average` divides by `played`, not `games`.
- Game `seq: 10` is the 30–0 forfeit. Its box score is empty and it appears in
  no player's game log, so per-game denominators are **22**, not 23.

## Layout

```
src/pages/            one file per page; nav order lives in src/layouts/Base.astro
  squadra/[id].astro  builds the 19 player pages at /squadra/<id>/
src/components/       Seed, Bracket, Referto, BoxscoreModal, QuarterStrip,
                      ChartTooltip, TableSort, PageHead + four charts
src/lib/season.js     the only door to the data
src/lib/player.js     per-player season analysis, built on season.js
src/lib/url.js        u(), which every internal link goes through
src/data/             the season JSON — source of truth, hand-maintained
src/assets/           the five photographs, all from finals day
src/styles/           tokens.css (design tokens), global.css
scripts/              validate-palette.sh
docs/                 design specs written before the work they describe
```

## House rules

Five conventions that are easy to break, and have been.

**A result is written home team first.** Always — whoever won, on every page, in
tables, box scores, the Tabellone, chart tooltips and prose alike. Game 3 at
Granarolo is **51–52**, never 52–51. Never print
`{g.ourScore}–{g.theirScore}`; go through `scoreLine(game)`, or `scoreSides(game)`
when the markup needs to know which number is ours. Two traps:
`advanced.clutch.list[].score` is baked into the JSON as `[nostri, loro]`, so
render those from the game record instead; and the Tabellone's
`legs[].scoreA/scoreB` are in *series* order, fixed for a whole tie while home
ground alternates leg by leg — order them by `leg.hostedBy`. The final is the one
game with no host.

**Internal links go through `u()`.** Astro does not rewrite hand-written hrefs,
so a literal `href="/finale/"` builds fine and would 404 the moment the site
moves off a domain root. Write `href={u('/finale/')}`, importing `u` from
`src/lib/url.js`, and the path prefix stays named in exactly one place — `base`
in `astro.config.mjs`. Anchors and external URLs pass through untouched, so it
is safe anywhere.

**Chart colours are a separate palette.** `--c-us`, `--c-them` and `--c-loss` in
`src/styles/tokens.css` are validated fill colours, deliberately not `--giallo`,
which is tuned for text on near-black and sits outside the lightness band a fill
needs. Change any of the three and run `npm run palette` before shipping. The
check runs an external validator kept outside this repository, so point
`PALETTE_VALIDATOR` at the directory holding its `scripts/validate_palette.js`;
the script says so and exits 2 if it is unset.

**Dark only.** The site commits to one dark treatment on purpose; a light
variant would undo the photographs. No theme toggle.

**Nothing may scroll the page sideways.** A `<table>` always goes inside
`<div class="table-scroll">`, no exceptions. An `auto-fit`/`auto-fill` track
never shrinks below its `minmax()` floor, so write
`minmax(min(100%, 20rem), 1fr)`, never a bare `minmax(20rem, 1fr)`. And `1fr` is
`minmax(auto, 1fr)`, inheriting its content's min-width — use `minmax(0, 1fr)`
when a grid holds something wide.

## Mobile

Built to work down to 320px. Two tokens carry it: `--masthead-h`, the sticky
bar's height per breakpoint, which `scroll-padding-top` on `html` reads so
in-page anchors clear the bar; and `--tap`, 44px.

**800px is the nav breakpoint**, measured rather than chosen: it is the width at
which the eight nav items still fit on one row. Below it `Base.astro` swaps them
for a slide-in drawer. The toggle ships with `hidden` and the script removes it,
so with JavaScript off the nav degrades to the old wrapped list instead of a
button that does nothing — keep that property if you touch it. `.masthead` drops
its `backdrop-filter` below 800px on purpose: `backdrop-filter` makes an element
the containing block for `position: fixed` descendants, which would position the
drawer against the bar rather than the viewport.

Touch enlargements are guarded by `@media (max-width: 799px), (hover: none)`, so
the desktop layout is untouched. Standalone controls take the full `--tap`;
controls inside dense tables grow their hit area with padding cancelled by an
equal negative margin, so row height does not move.

## Design notes

The colours come from the photographs: the yellow is the jersey worn in the
final, the navy its trim.

The fonts are served through Astro's font pipeline rather than by importing the
`@fontsource` CSS, which shipped `font-display: swap` with no preload — a cold
load painted headings in a fallback 82% wider than League Gothic, then reflowed
them. `display: 'optional'` plus preloading removes that flash. Only the latin
subset is built, and only upright: every character the site prints above U+00FF
was checked against the rendered output.

Source comments are English. Everything the site itself says — copy, captions,
dates — stays Italian.
