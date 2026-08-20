// Tests for the server-side stats guard.
//
// /api/sync/save writes whatever the client sends into profiles.stats, and
// get_leaderboard() ranks players on stats->>'xp' from that same column. So
// this module is the only thing standing between a curl one-liner and the top
// of the global leaderboard. Most of these tests are refusals.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  sanitizeStats,
  STAT_LIMITS,
  MAX_XP_GAIN_PER_SAVE,
} = require('../lib/stats-validation.js');

const clean = { xp: 500, rank: 'GHOST', gamesPlayed: 10, gamesWon: 6 };

describe('sanitizeStats — ordinary saves', () => {
  test('passes a plausible payload through unchanged', () => {
    const { stats } = sanitizeStats(clean, { xp: 400 });

    assert.strictEqual(stats.xp, 500);
    assert.strictEqual(stats.rank, 'GHOST');
    assert.strictEqual(stats.gamesPlayed, 10);
  });

  test('accepts a first save with no previous stats', () => {
    const { stats, rejected } = sanitizeStats(clean, null);

    assert.strictEqual(stats.xp, 500);
    assert.strictEqual(rejected, false);
  });

  test('keeps the nested objects the game relies on', () => {
    const withNested = {
      ...clean,
      bestTimes: { easy: 12, medium: null, hard: 40, extreme: null },
      unlockedSkins: ['default', 'gold'],
    };
    const { stats } = sanitizeStats(withNested, { xp: 400 });

    assert.deepStrictEqual({ ...stats.bestTimes }, { easy: 12, medium: null, hard: 40, extreme: null });
    assert.deepStrictEqual([...stats.unlockedSkins], ['default', 'gold']);
  });
});

describe('sanitizeStats — forged values', () => {
  test('rejects an XP jump larger than a single run could earn', () => {
    // The one-line attack: POST a huge xp and top the leaderboard.
    const { stats, rejected } = sanitizeStats({ ...clean, xp: 999999999 }, { xp: 400 });

    assert.strictEqual(rejected, true);
    assert.strictEqual(stats.xp, 400, 'a rejected jump must keep the stored value');
  });

  test('allows a jump within one run of headroom', () => {
    const { stats, rejected } = sanitizeStats(
      { ...clean, xp: 400 + MAX_XP_GAIN_PER_SAVE }, { xp: 400 },
    );

    assert.strictEqual(rejected, false);
    assert.strictEqual(stats.xp, 400 + MAX_XP_GAIN_PER_SAVE);
  });

  test('never lets XP go backwards on a forged low value', () => {
    // Sync merges with Math.max on the device; the server should not be the
    // place a player loses progress either.
    const { stats } = sanitizeStats({ ...clean, xp: 0 }, { xp: 400 });

    assert.strictEqual(stats.xp, 400);
  });

  test('caps every numeric field at its ceiling', () => {
    const absurd = {
      ...clean,
      bestCombo: 10 ** 9,
      bestWave: 10 ** 9,
      gamesPlayed: 10 ** 9,
      dailyStreak: 10 ** 9,
    };
    const { stats } = sanitizeStats(absurd, null);

    assert.strictEqual(stats.bestCombo, STAT_LIMITS.bestCombo);
    assert.strictEqual(stats.bestWave, STAT_LIMITS.bestWave);
    assert.strictEqual(stats.gamesPlayed, STAT_LIMITS.gamesPlayed);
    assert.strictEqual(stats.dailyStreak, STAT_LIMITS.dailyStreak);
  });

  test('rejects a negative counter rather than storing it', () => {
    const { stats } = sanitizeStats({ ...clean, gamesWon: -5 }, null);

    assert.strictEqual(stats.gamesWon, 0);
  });

  test('drops a NaN or infinite number instead of writing it to the database', () => {
    const { stats } = sanitizeStats({ ...clean, bestCombo: Infinity, bestWave: NaN }, null);

    assert.strictEqual(stats.bestCombo, 0);
    assert.strictEqual(stats.bestWave, 0);
  });

  test('rejects a rank that is not a real rank', () => {
    // rank_name is rendered straight into the leaderboard.
    const { stats } = sanitizeStats({ ...clean, rank: 'GOD EMPEROR' }, null);

    assert.strictEqual(stats.rank, 'ROOKIE');
  });

  test('rejects a number where a rank string belongs', () => {
    const { stats } = sanitizeStats({ ...clean, rank: 42 }, null);

    assert.strictEqual(stats.rank, 'ROOKIE');
  });
});

describe('sanitizeStats — unknown and oversized input', () => {
  test('drops keys the game does not define', () => {
    const { stats } = sanitizeStats({ ...clean, isAdmin: true, '__proto__x': 'x' }, null);

    assert.strictEqual(stats.isAdmin, undefined);
    assert.strictEqual(stats.__proto__x, undefined);
  });

  test('does not let a payload pollute Object.prototype', () => {
    sanitizeStats(JSON.parse('{"xp":1,"__proto__":{"polluted":true}}'), null);

    assert.strictEqual({}.polluted, undefined);
  });

  test('caps the game history rather than storing an unbounded array', () => {
    const history = Array.from({ length: 5000 }, (_, i) => ({ mode: 'classic', moves: i }));
    const { stats } = sanitizeStats({ ...clean, gameHistory: history }, null);

    assert.ok(stats.gameHistory.length <= STAT_LIMITS.gameHistory,
      `stored ${stats.gameHistory.length} history entries`);
  });

  test('caps the unlocked skin list', () => {
    const skins = Array.from({ length: 500 }, (_, i) => 'skin' + i);
    const { stats } = sanitizeStats({ ...clean, unlockedSkins: skins }, null);

    assert.ok(stats.unlockedSkins.length <= STAT_LIMITS.unlockedSkins);
  });

  test('truncates an over-long string field', () => {
    const { stats } = sanitizeStats({ ...clean, activeSkin: 'x'.repeat(10000) }, null);

    assert.ok(stats.activeSkin.length <= STAT_LIMITS.stringLength);
  });

  test('rejects a non-object payload outright', () => {
    assert.strictEqual(sanitizeStats(null, null).stats, null);
    assert.strictEqual(sanitizeStats('nope', null).stats, null);
    assert.strictEqual(sanitizeStats([1, 2, 3], null).stats, null);
  });
});

describe('sanitizeStats — daily best times', () => {
  // This map is keyed by date, which makes it the one field that could be used
  // as arbitrary key-value storage if the keys were not checked.
  test('keeps a real dated entry', () => {
    const { stats } = sanitizeStats({ ...clean, dailyBestTimes: { '2026-08-20': 41 } }, null);

    assert.deepStrictEqual({ ...stats.dailyBestTimes }, { '2026-08-20': 41 });
  });

  test('drops keys that are not dates', () => {
    const { stats } = sanitizeStats(
      { ...clean, dailyBestTimes: { '2026-08-20': 41, evil: 1, '../etc': 2 } }, null,
    );

    assert.deepStrictEqual(Object.keys(stats.dailyBestTimes), ['2026-08-20']);
  });

  test('drops a non-positive or non-numeric time', () => {
    const { stats } = sanitizeStats(
      { ...clean, dailyBestTimes: { '2026-08-20': 0, '2026-08-21': 'fast', '2026-08-22': 12 } }, null,
    );

    assert.deepStrictEqual(Object.keys(stats.dailyBestTimes), ['2026-08-22']);
  });

  test('caps the number of stored dates', () => {
    const many = {};
    for (let i = 0; i < 500; i++) many[`2026-01-${String(i % 28 + 1).padStart(2, '0')}`] = 10;
    const { stats } = sanitizeStats({ ...clean, dailyBestTimes: many }, null);

    assert.ok(Object.keys(stats.dailyBestTimes).length <= STAT_LIMITS.gameHistory);
  });

  test('survives a non-object rather than throwing', () => {
    assert.deepStrictEqual({ ...sanitizeStats({ ...clean, dailyBestTimes: 'x' }, null).stats.dailyBestTimes }, {});
  });
});

describe('sanitizeStats — the accounting invariant', () => {
  test('never stores more wins than games played', () => {
    // The v1.6.0 win-rate bug came from exactly this drifting apart.
    const { stats } = sanitizeStats({ ...clean, gamesPlayed: 5, gamesWon: 900 }, null);

    assert.ok(stats.gamesWon <= stats.gamesPlayed,
      `${stats.gamesWon} wins against ${stats.gamesPlayed} games`);
  });
});
