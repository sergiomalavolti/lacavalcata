import data from '../data/season-2011-2012.json';

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

export const playerName = (id) => {
  const p = season.roster.find((r) => r.id === id);
  return p ? `${p.surname} ${p.name}` : id;
};

export const playerShort = (id) => {
  const p = season.roster.find((r) => r.id === id);
  return p ? `${p.surname} ${p.name.charAt(0)}.` : id;
};

/** Our games, in the order they were played. */
export const games = season.games;
export const playoffGames = games.filter((g) => g.phase !== 'girone');
export const groupGames = games.filter((g) => g.phase === 'girone');
