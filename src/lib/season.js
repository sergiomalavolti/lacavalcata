import data from '../data/season-2011-2012.json';
import { u } from './url.js';

export const season = data;
export const US = data.meta.us;

const TEAMS = data.meta.teams;

export const teamName = (id) => TEAMS[id]?.name ?? id;
export const teamShort = (id) => TEAMS[id]?.short ?? id;
export const team = (id) => TEAMS[id] ?? {};

const MONTHS = [
  'gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
  'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre',
];
const MONTHS_SHORT = [
  'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
  'lug', 'ago', 'set', 'ott', 'nov', 'dic',
];

/** '2012-06-09' -> '9 giugno 2012' */
export function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** '2012-06-09' -> '9 giu 2012' */
export function shortDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

/** '2012-06-09' -> '09.06' */
export function tinyDate(iso) {
  const [, m, d] = iso.split('-');
  return `${d}.${m}`;
}

export const PHASES = {
  girone: 'Girone A',
  ottavi: 'Ottavi',
  quarti: 'Quarti',
  semifinale: 'Semifinale',
  finale: 'Finale',
};

/** Round a ratio to a percentage string, Italian decimal comma. */
export function pct(value, digits = 1) {
  return `${(value * 100).toFixed(digits).replace('.', ',')}%`;
}

/** Italian decimal comma for a plain number. */
export function num(value, digits = 1) {
  return value.toFixed(digits).replace('.', ',');
}

export function signed(value, digits = 0) {
  const body = Math.abs(value).toFixed(digits).replace('.', ',');
  return `${value > 0 ? '+' : value < 0 ? '−' : '±'}${body}`;
}

/** Roster indexed by id — every boxscore line and stat row joins through it. */
const PLAYERS = new Map(season.roster.map((p) => [p.id, p]));

export const player = (id) => PLAYERS.get(id);

export const playerName = (id) => {
  const p = PLAYERS.get(id);
  return p ? `${p.surname} ${p.name}` : id;
};

export const playerShort = (id) => {
  const p = PLAYERS.get(id);
  return p ? `${p.surname} ${p.name.charAt(0)}.` : id;
};

/**
 * Player pages live under the roster, which is their index. The trailing
 * slash matches build.format: 'directory' and every other internal link.
 */
export const playerHref = (id) => u(`/squadra/${id}/`);

/** Our games, in the order they were played. */
export const games = season.games;

/** Log entries and boxscore rows carry a seq; this is how they find their game. */
const GAMES_BY_SEQ = new Map(games.map((g) => [g.seq, g]));

export const gameBySeq = (seq) => GAMES_BY_SEQ.get(seq);
export const playoffGames = games.filter((g) => g.phase !== 'girone');
export const groupGames = games.filter((g) => g.phase === 'girone');

/**
 * Per-player totals over a slice of the season — the whole thing by default,
 * the girone or the playoff when given a test.
 *
 * The forfeit is out of every slice by construction: it has no boxscore, so
 * nobody dressed for it and no per-game denominator may count it.
 *
 * A player who never went to referto in the slice is not in the result at all.
 * One who dressed and never entered is, carrying nulls where a figure would
 * need a denominator it has not got — "never played" and "scored nothing" are
 * different statements and a table has to be able to tell them apart.
 *
 * `inLine` narrows further, to the games a player started or the games he came
 * on in — a second, independent cut of the same slice. Three things follow from
 * it. A game he dressed for and never entered is in neither, so it drops out of
 * both denominators and out of `games` as well; the rows are filtered on
 * appearances rather than on call-ups, so a man with no starts is not a row of
 * dashes in the quintetto cut but no row at all; and `share` deliberately does
 * *not* follow it — the denominator stays what the whole team scored, so a
 * player's two cuts add back to his season quota instead of each reading
 * against a different total.
 *
 * `linePoints` is what that group scored across the slice, `teamPoints` what
 * the team scored. With no `inLine` they are the same number.
 *
 * The sort is stable, so the whole-season slice comes back in exactly the order
 * `playerStats` is stored in, ties and all.
 */
export function playerTotals(inSlice = () => true, inLine = null) {
  const played = games.filter((g) => !g.forfeit && inSlice(g));
  const seqs = new Set(played.map((g) => g.seq));
  const teamPoints = played.reduce((sum, g) => sum + g.ourScore, 0);

  const rows = season.playerStats
    .map((p) => {
      // A log entry per game he was on the sheet for; `played` says whether he
      // came in. Every figure below is one or the other, never both.
      const dressed = p.log.filter((l) => seqs.has(l.seq));
      const on = dressed.filter((l) => l.played && (!inLine || inLine(l)));
      const points = on.reduce((sum, l) => sum + l.points, 0);
      return {
        player: p.player,
        points,
        games: dressed.length,
        played: on.length,
        starts: on.filter((l) => l.starter).length,
        doubleFigures: on.filter((l) => l.points >= 10).length,
        average: on.length ? points / on.length : null,
        high: on.length ? Math.max(...on.map((l) => l.points)) : null,
        share: on.length && teamPoints ? points / teamPoints : null,
      };
    })
    .filter((r) => (inLine ? r.played > 0 : r.games > 0))
    .sort((a, b) => b.points - a.points);

  const linePoints = inLine
    ? rows.reduce((sum, r) => sum + r.points, 0)
    : teamPoints;

  return {
    rows,
    games: played.length,
    teamPoints,
    linePoints,
    avgFor: played.length ? teamPoints / played.length : 0,
    avgLine: played.length ? linePoints / played.length : 0,
    topScorer: rows.length ? rows[0].points : 0,
  };
}

/**
 * True when the record names the opponent before us — every game they hosted,
 * plus the final, played on neutral ground with Birreria Amadeus still listed
 * as nominal home. Score and quarters read opponent-first wherever this is
 * true, so a boxscore never reads two ways round on the same page.
 */
export const isOpponentFirst = (g) => g.home === g.opponent;

/**
 * A result is written the way the fixture reads: the home team's score first,
 * the visitor's second, whoever won. So the game 3 win at Granarolo is 51–52,
 * never 52–51 — the number that comes first says where the game was played,
 * not who we are.
 *
 * `ours` and `theirs` come back labelled as well as ordered, because several
 * pages give our own number weight or colour and it has to keep that wherever
 * in the pair it lands.
 */
export function scoreSides(g) {
  const opponentFirst = isOpponentFirst(g);
  return {
    opponentFirst,
    first: opponentFirst ? g.theirScore : g.ourScore,
    second: opponentFirst ? g.ourScore : g.theirScore,
    oursFirst: !opponentFirst,
  };
}

/** A result as one string, home team first: `51–52`. */
export function scoreLine(g) {
  const { first, second } = scoreSides(g);
  return `${first}–${second}`;
}
