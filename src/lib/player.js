import { season, games, gameBySeq, player } from './season.js';

/**
 * Per-player season analysis, built once at module load for the whole roster.
 *
 * Everything here comes from three points of raw record — how many points a
 * player scored, whether he started, whether he entered at all — joined to the
 * game he scored them in. There are no minutes, no rebounds, no shot attempts
 * anywhere in the source, so nothing below estimates one. What it does instead
 * is ask the same three facts twenty-two different ways: at home and away, in
 * the girone and the playoff, ahead and behind, starting and off the bench.
 *
 * Ranks need every player computed before any one can be read, so the whole
 * roster is profiled up front and `playerProfile` is a lookup.
 */

/** The forfeit is a 30–0 awarded without a ball thrown: nobody dressed for it. */
const REAL_GAMES = games.filter((g) => !g.forfeit);

/** Points the team actually scored on court — the denominator for any share. */
const TEAM_POINTS = REAL_GAMES.reduce((sum, g) => sum + g.ourScore, 0);

const CLUTCH = new Set(season.advanced.clutch.list.map((c) => c.seq));

const PHASE_ORDER = ['girone', 'ottavi', 'quarti', 'semifinale', 'finale'];

/** Age on the day of the final, 9 June 2012. */
function ageAtFinal(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  let a = 2012 - y;
  if (m > 6 || (m === 6 && d > 9)) a -= 1;
  return a;
}

/** The top score of each game, so a line can be told it was the game's best. */
const TEAM_HIGH = new Map(
  REAL_GAMES.map((g) => {
    const scored = g.boxscore.filter((l) => l.played).map((l) => l.points);
    return [g.seq, scored.length ? Math.max(...scored) : 0];
  }),
);

/** Jersey numbers exist only on the final's sheet — twelve players, once. */
const FINAL_NUMBERS = new Map(
  season.final.game.boxscore
    .filter((l) => l.number !== undefined)
    .map((l) => [l.player, l.number]),
);

const mean = (xs) => xs.reduce((s, x) => s + x, 0) / xs.length;

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Population spread: the roster is the whole population, not a sample of one. */
function stdev(xs) {
  if (xs.length < 2) return null;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

/**
 * Summarise a set of timeline entries. Only games he entered can carry a
 * scoring average, so an untouched bucket returns nulls rather than zeros —
 * "he never played away from home" and "he scored nothing away from home" are
 * different statements and the page must be able to tell them apart.
 */
function aggregate(entries) {
  const played = entries.filter((e) => e.status === 'played');
  if (played.length === 0) {
    return { games: 0, points: 0, avg: null, share: null, high: null };
  }
  const points = played.reduce((s, e) => s + e.points, 0);
  const teamPoints = played.reduce((s, e) => s + e.ourScore, 0);
  return {
    games: played.length,
    points,
    avg: points / played.length,
    share: teamPoints ? points / teamPoints : null,
    high: Math.max(...played.map((e) => e.points)),
  };
}

/** Longest run of consecutive appearances satisfying a test. */
function longestRun(played, test) {
  let best = 0;
  let run = 0;
  for (const e of played) {
    run = test(e) ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

const BUCKETS = [
  { label: '0', min: 0, max: 0 },
  { label: '1–4', min: 1, max: 4 },
  { label: '5–9', min: 5, max: 9 },
  { label: '10–14', min: 10, max: 14 },
  { label: '15–19', min: 15, max: 19 },
  { label: '20+', min: 20, max: Infinity },
];

function buildProfile(stats) {
  const person = player(stats.player);
  const bySeq = new Map(stats.log.map((l) => [l.seq, l]));

  /**
   * One entry per game the team actually played, whether he was in it or not.
   * Three states: he played, he was on the sheet and never came in, or he was
   * not on the sheet at all. Availability and scoring read on the same axis.
   */
  const timeline = REAL_GAMES.map((g) => {
    const line = bySeq.get(g.seq);
    const status = !line ? 'out' : line.played ? 'played' : 'ne';
    const points = status === 'played' ? line.points : null;
    return {
      seq: g.seq,
      date: g.date,
      phase: g.phase,
      phaseLabel: g.phaseLabel,
      opponent: g.opponent,
      won: g.won,
      margin: g.margin,
      ourScore: g.ourScore,
      theirScore: g.theirScore,
      ourSide: g.ourSide,
      neutral: g.neutral,
      clutch: CLUTCH.has(g.seq),
      status,
      points,
      starter: line?.starter ?? false,
      share: status === 'played' ? points / g.ourScore : null,
      teamHigh: status === 'played' && points > 0 && points === TEAM_HIGH.get(g.seq),
      game: g,
    };
  });

  const played = timeline.filter((e) => e.status === 'played');
  const scores = played.map((e) => e.points);
  const shares = played.map((e) => e.share);

  const where = (e) => (e.neutral ? 'neutro' : e.ourSide === 'home' ? 'casa' : 'trasferta');

  const opponents = [...new Set(played.map((e) => e.opponent))]
    .map((id) => ({ opponent: id, ...aggregate(played.filter((e) => e.opponent === id)) }))
    .sort((a, b) => b.points - a.points || b.avg - a.avg);

  return {
    id: stats.player,
    person,
    age: ageAtFinal(person.birthdate),
    number: FINAL_NUMBERS.get(stats.player) ?? null,

    // Availability, out of the twenty-two games there was a sheet for.
    teamGames: REAL_GAMES.length,
    dressed: stats.games,
    entered: stats.played,
    ne: stats.games - stats.played,
    absent: REAL_GAMES.length - stats.games,

    points: stats.points,
    average: stats.average,
    starts: stats.starts,
    high: stats.high,
    low: scores.length ? Math.min(...scores) : null,
    median: scores.length ? median(scores) : null,
    stdev: stdev(scores),
    doubleFigures: stats.doubleFigures,
    doubleFigureRate: stats.played ? stats.doubleFigures / stats.played : null,
    scoreless: scores.filter((p) => p === 0).length,

    share: stats.points / TEAM_POINTS,
    avgShare: shares.length ? mean(shares) : null,
    bestShare: shares.length ? Math.max(...shares) : null,
    topScorerGames: played.filter((e) => e.teamHigh).length,

    bestGame: played.length ? played.reduce((a, b) => (b.points > a.points ? b : a)) : null,
    worstGame: played.length ? played.reduce((a, b) => (b.points < a.points ? b : a)) : null,

    doubleFigureStreak: longestRun(played, (e) => e.points >= 10),
    scoringStreak: longestRun(played, (e) => e.points > 0),

    splits: {
      phase: PHASE_ORDER.map((p) => ({
        key: p,
        ...aggregate(timeline.filter((e) => e.phase === p)),
      })),
      stage: [
        { key: 'girone', ...aggregate(timeline.filter((e) => e.phase === 'girone')) },
        { key: 'playoff', ...aggregate(timeline.filter((e) => e.phase !== 'girone')) },
      ],
      venue: ['casa', 'trasferta', 'neutro'].map((k) => ({
        key: k,
        ...aggregate(timeline.filter((e) => where(e) === k)),
      })),
      result: [
        { key: 'vittorie', ...aggregate(timeline.filter((e) => e.won)) },
        { key: 'sconfitte', ...aggregate(timeline.filter((e) => !e.won)) },
      ],
      role: [
        { key: 'titolare', ...aggregate(timeline.filter((e) => e.starter)) },
        { key: 'panchina', ...aggregate(timeline.filter((e) => e.status === 'played' && !e.starter)) },
      ],
      clutch: [
        { key: 'equilibrate', ...aggregate(timeline.filter((e) => e.clutch)) },
        { key: 'altre', ...aggregate(timeline.filter((e) => !e.clutch)) },
      ],
    },

    buckets: BUCKETS.map((b) => ({
      label: b.label,
      count: scores.filter((p) => p >= b.min && p <= b.max).length,
    })),

    opponents,

    /**
     * How the team fared with him on the floor and without. This is a record,
     * not a plus-minus: the data cannot say what happened while he was on it.
     */
    teamWith: {
      games: played.length,
      wins: played.filter((e) => e.won).length,
    },
    teamWithout: {
      games: timeline.length - played.length,
      wins: timeline.filter((e) => e.status !== 'played' && e.won).length,
    },

    timeline,
  };
}

const PROFILES = new Map(season.playerStats.map((s) => [s.player, buildProfile(s)]));

/** Rank within the roster on a measure, ties sharing the better number. */
function rankBy(pick) {
  const ordered = [...PROFILES.values()]
    .map((p) => ({ id: p.id, v: pick(p) ?? -Infinity }))
    .sort((a, b) => b.v - a.v);
  const ranks = new Map();
  for (const row of ordered) {
    ranks.set(row.id, ordered.findIndex((r) => r.v === row.v) + 1);
  }
  return ranks;
}

const RANKS = {
  points: rankBy((p) => p.points),
  average: rankBy((p) => p.average),
  starts: rankBy((p) => p.starts),
  entered: rankBy((p) => p.entered),
};

for (const p of PROFILES.values()) {
  p.rank = {
    points: RANKS.points.get(p.id),
    average: RANKS.average.get(p.id),
    starts: RANKS.starts.get(p.id),
    entered: RANKS.entered.get(p.id),
  };
}

/** The whole roster by points — the backdrop a single player is read against. */
export const squadScoring = [...PROFILES.values()]
  .map((p) => ({ id: p.id, points: p.points, share: p.share }))
  .sort((a, b) => b.points - a.points);

export const rosterSize = PROFILES.size;
export const teamPoints = TEAM_POINTS;
export const teamGames = REAL_GAMES.length;

export const playerProfile = (id) => PROFILES.get(id);

/** Alphabetical neighbours, for walking the roster from any one page. */
const ALPHA = [...PROFILES.keys()].sort((a, b) =>
  player(a).surname.localeCompare(player(b).surname, 'it'),
);

export function playerNeighbours(id) {
  const i = ALPHA.indexOf(id);
  return {
    prev: ALPHA[(i - 1 + ALPHA.length) % ALPHA.length],
    next: ALPHA[(i + 1) % ALPHA.length],
  };
}
