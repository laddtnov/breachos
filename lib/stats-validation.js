// Server-side guard for the stats blob.
//
// /api/sync/save writes profiles.stats, and get_leaderboard() ranks players on
// stats->>'xp' out of that same column. Without this, a single authenticated
// POST sets any XP and any rank, and the global leaderboard means nothing.
//
// This is a sanity clamp, not server-authoritative scoring. It stops forged
// totals, absurd values, unknown keys and unbounded payloads. It does not stop
// a patient attacker drip-feeding plausible wins — that would need the scoring
// rules to live on the server, which is a much larger change.
// ponytail: clamps only; move scoring server-side if the leaderboard ever
// carries a prize.

// Ceilings for numeric fields. Generous enough that no honest player will ever
// meet one, tight enough that a forged value is obvious.
const STAT_LIMITS = {
  xp: 100_000_000,
  gamesPlayed: 1_000_000,
  gamesWon: 1_000_000,
  totalMatches: 10_000_000,
  bestCombo: 100,
  blitzWins: 1_000_000,
  perfectWins: 1_000_000,
  bestWave: 10_000,
  bestSurvivalScore: 100_000_000,
  dailyStreak: 10_000,
  dailyCompleted: 100_000,
  streakFreezes: 100,
  weeklyStreak: 10_000,
  loginStreak: 10_000,
  loginBestStreak: 10_000,
  seconds: 1_000_000,
  // Collection sizes
  gameHistory: 50,
  unlockedSkins: 100,
  stringLength: 64,
};

// Most XP one save may add. Sized for an offline session rather than a single
// run: the client syncs after every game, but an offline stretch fails silently
// and arrives as one large delta on reconnect. At roughly 150 XP a win this
// tolerates about 300 unsynced games, which no honest session reaches.
//
// An over-limit save is discarded, not clamped to the ceiling. Clamping would
// hand a forger the full allowance on every request, and /api/sync/save can be
// called in a loop.
const MAX_XP_GAIN_PER_SAVE = 50_000;

const VALID_RANKS = new Set([
  'ROOKIE', 'AGENT', 'SPECIALIST', 'GHOST', 'NETRUNNER_ELITE',
  'PHANTOM', 'ARCHITECT', 'OVERSEER', 'WRAITH', 'SINGULARITY',
]);

const DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

function clampInt(value, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(Math.max(Math.trunc(n), 0), max);
}

function cleanString(value, max = STAT_LIMITS.stringLength) {
  return typeof value === 'string' ? value.slice(0, max) : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// A date the game wrote, or null. Anything else is dropped rather than stored.
function cleanDate(value) {
  const s = cleanString(value, 10);
  return s && DATE_RE.test(s) ? s : null;
}

// A capped list of short strings. Anything that is not an array falls back,
// which is how a missing or forged field stops being a stored value.
function cleanStringList(value, max, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, max).map(entry => cleanString(entry)).filter(Boolean);
}

// Date-keyed best times. Keys the game did not write are dropped rather than
// stored, so this cannot be used as arbitrary key-value storage.
//
// The stored value is { time, difficulty } — the shape _saveDailyBestTime in
// js/daily.js writes and reads back as existing.time. This used to coerce the
// whole entry with Number(), which turns that object into NaN, so every daily
// best time a real player set was silently discarded on save. A bare number is
// still accepted so entries written before the fix survive.
function cleanDailyBestTimes(value) {
  const out = {};
  if (!value || typeof value !== 'object') return out;

  for (const key of Object.keys(value).slice(0, STAT_LIMITS.gameHistory)) {
    if (!DATE_RE.test(key)) continue;

    const entry = value[key];
    const raw = entry && typeof entry === 'object' ? entry.time : entry;
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) continue;

    const difficulty = entry && typeof entry === 'object' ? entry.difficulty : null;
    out[key] = {
      time: Math.min(Math.trunc(n), STAT_LIMITS.seconds),
      difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : null,
    };
  }
  return out;
}

// A mode or quest id the game wrote, or null. Checked by shape rather than
// against a list: the mode names live in js/stats-rules.js and the quest ids in
// js/quests.js, and a second copy here would only drift. The shape is narrow
// enough that nothing which passes can carry markup.
const SLUG_RE = /^[a-z0-9_]{1,24}$/;

function cleanSlug(value) {
  return typeof value === 'string' && SLUG_RE.test(value) ? value : null;
}

// One mission-history row, built key by key.
//
// The whole array used to be stored exactly as it arrived, so each of the fifty
// allowed entries could be an object of any shape and any size. That made
// profiles.stats free storage for anything that fits in a request body, and
// renderGameHistory in js/dossier.js interpolates these fields straight into
// innerHTML under a CSP that permits 'unsafe-inline'.
function cleanHistoryEntry(entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
  return {
    mode:       cleanSlug(entry.mode),
    difficulty: DIFFICULTIES.includes(entry.difficulty) ? entry.difficulty : null,
    result:     entry.result === 'win' ? 'win' : 'lose',
    moves:      clampInt(entry.moves, STAT_LIMITS.gamesPlayed),
    time:       clampInt(entry.time, STAT_LIMITS.seconds),
    combo:      clampInt(entry.combo, STAT_LIMITS.bestCombo),
    xp:         clampInt(entry.xp, STAT_LIMITS.xp),
    ts:         clampInt(entry.ts, Number.MAX_SAFE_INTEGER),
  };
}

function cleanGameHistory(value) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, STAT_LIMITS.gameHistory)
    .map(cleanHistoryEntry)
    .filter(Boolean);
}

// Today's quest progress: { date, progress: { questId: { value, completed } } }.
// Same hole as the history above — any object at all was stored under this key.
function cleanDailyQuests(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const progress = {};
  const incoming = value.progress;
  if (incoming && typeof incoming === 'object') {
    for (const id of Object.keys(incoming).slice(0, STAT_LIMITS.gameHistory)) {
      if (!cleanSlug(id)) continue;
      const p = incoming[id];
      progress[id] = {
        value: clampInt(p && typeof p === 'object' ? p.value : p, STAT_LIMITS.bestSurvivalScore),
        completed: Boolean(p && typeof p === 'object' && p.completed),
      };
    }
  }
  return { date: cleanDate(value.date), progress };
}

function cleanTimeMap(value, keys) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  for (const key of keys) {
    const n = Number(value[key]);
    out[key] = Number.isFinite(n) && n > 0 ? Math.min(Math.trunc(n), STAT_LIMITS.seconds) : null;
  }
  return out;
}

function cleanCountMap(value, keys, max) {
  const out = {};
  if (!value || typeof value !== 'object') return out;
  for (const key of keys) out[key] = clampInt(value[key], max);
  return out;
}

/**
 * Returns a stats object safe to store, built key by key from a fixed shape —
 * so unknown keys are dropped rather than filtered, and a "__proto__" in the
 * payload can never reach Object.prototype.
 *
 * @param {unknown} incoming - the client's stats payload
 * @param {object|null} stored - what is currently in the database, or null
 * @returns {{ stats: object|null, rejected: boolean }} rejected is true when a
 *   forged XP jump was clamped, so the caller can log it.
 */
function sanitizeStats(incoming, stored) {
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return { stats: null, rejected: false };
  }

  const previousXp = clampInt(stored?.xp, STAT_LIMITS.xp);
  const claimedXp = clampInt(incoming.xp, STAT_LIMITS.xp);

  // XP never falls — the client merges with Math.max, and the server should not
  // be where a player loses progress either. A jump beyond the allowance keeps
  // the stored value rather than being clamped to the ceiling.
  const ceiling = previousXp + MAX_XP_GAIN_PER_SAVE;
  const rejected = claimedXp > ceiling;
  const xp = rejected ? previousXp : Math.max(previousXp, claimedXp);

  const gamesPlayed = clampInt(incoming.gamesPlayed, STAT_LIMITS.gamesPlayed);
  // Wins can never exceed plays. The v1.6.0 win-rate bug was these two drifting
  // apart, and the display-layer clamp should not be the only thing holding.
  const gamesWon = Math.min(clampInt(incoming.gamesWon, STAT_LIMITS.gamesWon), gamesPlayed);

  const stats = {
    xp,
    rank: VALID_RANKS.has(incoming.rank) ? incoming.rank : 'ROOKIE',
    gamesPlayed,
    gamesWon,
    totalMatches: clampInt(incoming.totalMatches, STAT_LIMITS.totalMatches),
    bestCombo: clampInt(incoming.bestCombo, STAT_LIMITS.bestCombo),
    blitzWins: clampInt(incoming.blitzWins, STAT_LIMITS.blitzWins),
    perfectWins: clampInt(incoming.perfectWins, STAT_LIMITS.perfectWins),
    bestWave: clampInt(incoming.bestWave, STAT_LIMITS.bestWave),
    bestSurvivalScore: clampInt(incoming.bestSurvivalScore, STAT_LIMITS.bestSurvivalScore),

    bestTimes: cleanTimeMap(incoming.bestTimes, DIFFICULTIES),
    winsPerDifficulty: cleanCountMap(incoming.winsPerDifficulty, DIFFICULTIES, STAT_LIMITS.gamesWon),
    dailyBestTimes: cleanDailyBestTimes(incoming.dailyBestTimes),

    dailyLastDate: cleanDate(incoming.dailyLastDate),
    dailyStreak: clampInt(incoming.dailyStreak, STAT_LIMITS.dailyStreak),
    dailyCompleted: clampInt(incoming.dailyCompleted, STAT_LIMITS.dailyCompleted),
    streakFreezes: clampInt(incoming.streakFreezes, STAT_LIMITS.streakFreezes),
    weeklyLastDate: cleanDate(incoming.weeklyLastDate),
    weeklyStreak: clampInt(incoming.weeklyStreak, STAT_LIMITS.weeklyStreak),
    loginLastDate: cleanDate(incoming.loginLastDate),
    loginStreak: clampInt(incoming.loginStreak, STAT_LIMITS.loginStreak),
    loginBestStreak: clampInt(incoming.loginBestStreak, STAT_LIMITS.loginBestStreak),

    activeTheme: cleanString(incoming.activeTheme) || 'cyber',
    activeSoundTheme: cleanString(incoming.activeSoundTheme) || 'cyber',
    activeSkin: cleanString(incoming.activeSkin) || 'default',
    unlockedSkins: cleanStringList(incoming.unlockedSkins, STAT_LIMITS.unlockedSkins, ['default']),
    unlockedAchievements: cleanStringList(incoming.unlockedAchievements, STAT_LIMITS.unlockedSkins),

    // History is display-only and the client keeps ten. Cap the list and clean
    // each row so the column cannot be used as free storage.
    gameHistory: cleanGameHistory(incoming.gameHistory),
    dailyQuests: cleanDailyQuests(incoming.dailyQuests),
  };

  return { stats, rejected };
}

export { sanitizeStats, STAT_LIMITS, MAX_XP_GAIN_PER_SAVE, VALID_RANKS };
