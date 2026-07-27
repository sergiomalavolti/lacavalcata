# Tables that fit a phone

**Date:** 2026-07-27
**Status:** implemented — see "As built" at the end for where it differs

## The problem

The mobile work committed in `6881d1c` stopped tables breaking the *page* — each
one scrolls inside its own `.table-scroll` pane, so the body no longer moves
sideways. It did not make them readable. A phone shows three or four columns of
a twelve-column table, and the rest is off-screen behind a horizontal scroll
nobody discovers.

Measured at 320px, with the pane 283px wide:

| Page | Table | Columns | Visible | Wants |
|---|---|---|---|---|
| `/squadra/` | La rosa | 5 | **1** | 774px |
| `/squadra/<id>/` | Tutte le partite | 8 | **2** | 771px |
| `/avversari/` | Dove si giocava | 5 | **2** | 783px |
| `/statistiche/` | Stagione individuale | 11 | **3** | 845px |
| `/girone/` | Calendario | 7 | **3** | 575px |
| `/squadra/<id>/` | Punti per avversario | 5 | **3** | 440px |
| `/girone/` | Classifica | 12 | **5** | 746px |
| `/finale/`, modals | Referto, tabellini | 4 | 3 | 280px |
| `/squadra/<id>/` | Fase per fase | 4 | 3 | 273px |

Every cell carries `white-space: nowrap` (`global.css:226`), which is what makes
these tables two to three times wider than the screen.

## Goal

Below the phone breakpoint, every value in every table is visible without
horizontal scrolling and without a tap to reveal it.

## What changes

**Seven tables become cards.** One `<tr>` renders as one block: a headline line
carrying the row's identity and primary figure, then the remaining values
two-across, each with its column name as a label.

**Three do not.** Referto, the boxscore tabellini and Fase per fase are 3–4
narrow columns. They fit at 390px and miss by 6–37px at 320px. Stacking them
would be worse than the problem. They get a lighter fix: relax `white-space:
nowrap` on the name column so it wraps.

## Card anatomy

```
 ORDINA   Giocatore  Ruolo  Punti ▾  Media  Presenze  High  10+  Quota
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 1   BENASSI ANDREA                   312
     Ruolo       A      Media      14,2
     Presenze   22      Entrato      22
     Quintetto  19      High         28
     10+        15      Quota     18,4%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▌2   MALAVOLTI SERGIO                 287
```

The headline is the old table's most important two or three columns. Because the
detail grid below is visually quieter, scrolling the cards still reads as a
ranking — which is what a standings table is for.

## Mechanism

Three attributes in the markup, one shared stylesheet block in `global.css`. No
JavaScript: the transform must not be able to fail to arrive.

| Attribute | On | Meaning |
|---|---|---|
| `data-stack` | `<table>` | opt in to card mode below the breakpoint |
| `data-head` | `<td>` | belongs on the headline line, unlabelled |
| `data-label="G"` | `<td>` | detail cell; the label to print before its value |
| `data-wide` | `<td>` | detail cell that takes a full line (long text) |

Card mode makes `<tr>` a wrapping flex container. A zero-height `tr::before`
with `flex-basis: 100%` sits between the two groups by `order`, forcing the line
break after the headline:

```css
tr        { display: flex; flex-wrap: wrap; }
tr::before{ content: ''; flex: 0 0 100%; height: 0; order: 0; }
td[data-head]      { order: -1; flex: 0 0 auto; }
td[data-head].name { flex: 1 1 auto; }        /* takes the slack */
td[data-label]     { order: 1; flex: 1 1 40%; }   /* two across */
td[data-label][data-wide] { flex-basis: 100%; }
td[data-label]::before { content: attr(data-label); }
```

This needs no per-table CSS and works for any number of headline and detail
cells. Pseudo-elements on `<tr>` are available once `display` is no longer
`table-row`.

## Column mapping

| Table | Headline | Labelled detail |
|---|---|---|
| Classifica | `#` · Squadra · Punti | G, V, P, P.F., P.S., Q.P., Q.C., Q.TOT., Playoff |
| Calendario | `#` · Avversario · Risultato | G., Data, Campo, Scarto |
| Stagione individuale | `#` · Giocatore · Punti | Ruolo, Media, Presenze, Entrato, Quintetto, High, 10+, Quota |
| La rosa | `#` · Giocatore | Ruolo, Altezza, Nato il |
| Dove si giocava | Squadra | Palestra*, Indirizzo*, Giorno e ora, Tiro da 3 |
| Punti per avversario | Avversario · Punti | Partite, Media, Massimo |
| Tutte le partite | Data · Avversario · Punti | Fase, Campo, Risultato, Quintetto, Quota |

\* `data-wide` — these are sentences, not figures.

## Sorting

The sortable tables are the ones most worth keeping sortable on a phone. `<thead>`
is **not** hidden in card mode; it reflows into a row of chips above the cards:

```css
thead tr  { display: flex; flex-wrap: wrap; gap: 0.4rem; }
thead tr::before { display: none; }            /* no headline to break after */
thead th:not([data-sort]) { display: none; }   /* nothing to click */
```

`TableSort.astro` needs no change. It wraps each sortable `<th>` label in a
button and reorders `<tr>` elements; in card mode those are cards, and the
`[data-rank]` renumbering still lands in the headline. Chips take the full
`--tap`.

## Breakpoint

**800px** — the width at which the nav already becomes the drawer. One boundary
for "this is the phone layout" rather than a different number per table.

**Stated limitation.** Classifica, Stagione individuale and Dove si giocava want
980–1008px, so strictly they would have to become cards at ~1100px to never
scroll. That is rejected: it would put cards on a laptop. Between 800px and
~1100px those three keep scrolling inside their pane, showing 10 or 11 of 12
columns, with the existing `.scroll-hint`. Below 800px nothing scrolls and
nothing is hidden.

Relaxing `white-space: nowrap` on text columns would shrink that band. Out of
scope here; it changes the desktop table.

## Edge cases

- **`tr.us`** — the yellow margin mark is `box-shadow` on `td:first-child`
  (`global.css:248`). In card mode it moves to the card's left edge.
- **`tfoot`** on Stagione individuale — the "Squadra" totals row. Its cells get
  labels; the trailing `colspan="6"` empty cell is hidden.
- **`tr.dnp`** on Tutte le partite — rows where the player was NE or fuori. The
  `Punti` headline cell holds a `.tag` instead of a number; no special handling,
  but check it reads correctly.
- **`.score-btn`** in Calendario and Tutte le partite stays a button and keeps
  its enlarged tap area; it opens the boxscore modal from inside a card.
- **`td.name { min-width: 12ch }`** (`global.css:242`) must be unset in card mode.
- **Cell borders** — `border-bottom` moves from every `<td>` to the card.
- **`.pts-track` / `.h-track`** — the inline bar charts in the Punti and Altezza
  cells. Punti is a headline cell on `/statistiche/`; the bar needs a width that
  works there. Altezza is a detail cell on `/squadra/`.
- **`.scroll-hint`** is self-correcting: the script in `Base.astro` adds it only
  where `scrollWidth > clientWidth`, so it disappears on its own once a table
  stops overflowing.

## Verification

Rebuild, then re-run the CDP harness that produced the numbers above.

1. **Visible columns — the hard gate.** At 320/360/390px, every stacked table
   reports zero horizontal overflow and every value present in the DOM is
   inside the viewport. Currently 1–5 of 5–12 columns are visible.
2. **Page overflow.** `documentElement.scrollWidth === clientWidth` on all nine
   routes at 320/360/390/414px — the gate `6881d1c` already passes; it must
   still pass.
3. **Sorting.** On `/statistiche/` and `/squadra/` at 390px, tap a chip and
   confirm the cards reorder and the rank renumbers.
4. **Boxscore.** Tap a score inside a card on `/girone/` and on a player page;
   the modal opens with the right game.
5. **No JavaScript.** Cards still render (the transform is CSS-only); sort chips
   fall back to plain header text.
6. **Desktop unchanged.** Screenshot all nine routes at 1280px and diff against
   the current build. Above 800px this work is invisible.
7. **The three unstacked tables** fit at 320px after the wrap fix.

No colour tokens change, so `npm run palette` is not required.

## As built

Five things the design did not anticipate.

**Enlarged tap areas leak.** `.score-btn` and `.p-link` grow their hit area with
padding cancelled by an equal negative margin, and the cell's own padding used
to absorb it. Card mode takes that padding away, so the bottom of the
enlargement — and the underline drawn at its edge — landed on the line below.
Both now cancel only the top half (`margin-block: -0.6rem 0`), which keeps the
hit area the same size and puts the underline back under its own text.

**`tr.us` needed the whole card, not just the mark.** Painting the wash per
cell left the gaps between cells unpainted and the row read as stripes. The
wash and the yellow edge both sit on the `<tr>` now, and the edge is a
`border-left` rather than an inset shadow, which cell backgrounds paint over.

**`<thead>` disappears entirely on the four tables that aren't sortable.**
Every column name is on its own cell in card mode, so a head with no controls
left in it is an empty row.

**Referto was not a `white-space` problem.** `td.name` already wrapped; what
made the sheet too wide was `min-width: 12ch` under the name and the 6.5rem
centre columns. It also needed `overflow-wrap: normal` — `anywhere`, inherited
from the long-club-name rule, was cutting MALAVOLTI in half.

**Three page-level media queries needed a floor, not deletion.** The sticky-name
blocks on `/squadra/`, `/statistiche/` and the player pages are still load
bearing between 800px and their old ceilings; they now read
`@media (min-width: 800px) and (max-width: …)`. Deleting the roster's outright
was a measured regression at 820px, caught by a pixel diff.

## Revision — the card as first built was a wall

Sergio looked at the card on `/statistiche/` and said the UI was not good. He
was right, and two of the three reasons were defects rather than taste.

**`.p-link`'s underline was a border on the box.** The touch rule enlarges the
link with padding, so the border landed at the bottom of the enlargement, a
dozen pixels clear of the name, where it read as a broken divider. It is a
`text-decoration` now, which follows the text and leaves the box free to stay
out of the layout.

**The rank column never narrowed.** `.individuale td.rank { width: 1.5rem }`
was written inside the card media query but sat *before* the 3rem rule of equal
specificity, which therefore won on source order. 48px held one digit. The
media query moved below it.

**The label went above its value.** That spends two full lines on one number
and puts the quiet half on top; at 320px a card ran 208px and three players
fitted on a screen. The label is a flex item, so ordering it last turns the
cell around — `column-reverse` would too, but it also reverses the cell's real
children, and four of these hold two (a height and its bar, a date and an age,
a score and its verdict, an appearance count and its NE tag).

**Four to a line where the values are figures.** `data-dense` on Classifica,
Stagione individuale and Punti per avversario. Tables with a word in a cell —
Calendario, Dove si giocava, Tutte le partite — stay two across, the narrowest
column "Trasferta" or a gym name still sits on one line in. The card is 153px
now against 208px, five and a half players to a screen instead of three.

**The sort chips name themselves.** Ten chips took 206px at 320px above any
data, and the page's "clicca un'intestazione" pointed at nothing a phone shows.
`thead::before` prints "Ordina per", the chips lose a little padding and
letter-spacing, and the ↕ shows only on the active one — three rows, 174px,
with `--tap` still holding each chip at 44px.

Measured after: no table scrolls sideways and no cell falls outside the
viewport at 320/360/390/414 across nine routes; all 51 boxscore buttons open
their own game with no modal overflow; sorting still reorders and renumbers;
the cards render with scripting disabled; and all 36 desktop screenshots at
800/820/900/1280 are byte-identical to the build before it.

## Out of scope

- The bracket on `/playoff/` ("Il Tabellone"). It is a seven-column CSS grid
  drawing a knockout tree with connector elbows, not a table; it already scrolls
  in `.draw-scroll`, already shows a hint, and `/playoff/` already repeats the
  route as a readable list beneath it. Different problem, separate decision.
- Removing `white-space: nowrap` from desktop tables.
- Deploying. Pushing to `main` publishes; that call stays with Sergio.
