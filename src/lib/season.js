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
 * True when the record names the opponent before us — only the final, played
 * on neutral ground with Birreria Amadeus still listed as nominal home. Score
 * and quarters should read opponent-first wherever this is true, so a boxscore
 * never reads two ways round on the same page.
 */
export const isOpponentFirst = (g) => g.neutral && g.home === g.opponent;
