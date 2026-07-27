# La cavalcata 2011-2012

A static site telling the story of the Caffè Matic – Trottola Sport season:
second in Girone A, eighth seed of sixteen, winners of the CSI Promozione
Super-League on 9 June 2012 at Loiano.

## Running it

Node 18.20+, 20.3+ or 22+ is required. On this machine node lives under nvm, so
either `source ~/.nvm/nvm.sh` first or call the binaries by path.

```bash
npm install
npm run build     # writes dist/
npm run preview   # serves dist/ at http://localhost:4321/lacavalcata/
npm run dev       # dev server with hot reload
```

Both servers mount the site at `/lacavalcata/` rather than `/`, matching where
GitHub Pages serves it — see *Publishing* below.

The site is fully self-contained: fonts are bundled, photographs are optimised
at build time, and no page makes an external network request.

## Publishing

Live at **https://sergiomalavolti.github.io/lacavalcata/**. Every push to `main`
runs `.github/workflows/deploy.yml`, which builds the site and publishes it to
GitHub Pages; `dist/` is never committed. To publish a change, commit and push —
there is no other step. The Actions tab shows the run, and `workflow_dispatch`
lets you re-publish by hand without a new commit.

Because Pages serves the site from a sub-path, `base` in `astro.config.mjs` is
`/lacavalcata`, and **every internal link goes through `u()` from
`src/lib/url.js`** — a hand-written `href="/finale/"` would build cleanly and
then 404 in production. Write `href={u('/finale/')}`. Moving the site to a
domain root means changing `base` to `/` and nothing else.

The pages carry `<meta name="robots" content="noindex">`: anyone with the link
can read the site, but it stays out of search results.

## The data

`src/data/season-2011-2012.json` holds the entire season — standings, every box
score, the playoff bracket, the photo captions — and it is **the source of
truth**. Edit it by hand when something needs correcting.

It did not start that way. It was extracted from the original CSI records (a
season spreadsheet, the federation calendar, and a SQLite database kept at the
time), cross-checked between those three sources, with four documented
corrections applied where they disagreed. That pipeline and its raw sources were
retired once the site was finished, so **the JSON can no longer be regenerated
or re-verified against anything** — it is the only surviving copy of the season
in structured form. Treat edits accordingly.

Every page reads it through the accessors in `src/lib/season.js` rather than
importing the JSON directly.

## Layout

```
src/pages/         one file per page
src/components/    Seed, Bracket, Referto, BoxscoreModal, QuarterStrip, three charts
src/lib/season.js  the accessors every page reads the season through
src/data/          the season JSON — source of truth, hand-maintained
src/assets/        the five photographs, all from finals day
src/styles/        design tokens and global rules
scripts/validate-palette.sh   re-runs the colour checks on the chart palette
```

## Design notes

Colours come from the photographs: the yellow is the jersey worn in the final,
the navy its trim. The chart marks use a **separate**, validated palette
(`--c-us`, `--c-them`, `--c-loss` in `src/styles/tokens.css`) because the UI
accent is tuned for text on near-black and sits outside the lightness band a
fill colour should occupy. If you change those three tokens, run `npm run
palette` before shipping.

That check borrows a validator from Claude's bundled `dataviz` skill, which
lives in a session-scoped temp directory; the script looks for it at run time
and tells you to set `DATAVIZ_SKILL` if it can't find one.
