// mergeStats decides what survives a login, so it is the one function that can
// silently erase a player's progress. It used to merge ten numeric fields, two
// lists and three theme choices while the server stored twenty-six — everything
// else fell through `{ ...local }`, which on a fresh device means the built-in
// defaults. So signing in on a new phone showed empty best times, no streaks
// and no history even though the server held them all.
//
// js/auth.js is a plain global script that reads localStorage and registers a
// load listener at the top level, so it is evaluated in a vm sandbox with both
// stubbed out.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAuthModule() {
  const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
  const sandbox = {
    console, Math, Date, JSON, String, Number, Array, Object, Set, Boolean,
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    window: { addEventListener: () => {} },
    document: { getElementById: () => null, querySelectorAll: () => [] },
    fetch: () => Promise.reject(new Error('no network in tests')),
  };
  // data.js first: mergeStats falls back on the default shape, and rank.js
  // supplies getRankForXP for the derived rank.
  vm.runInNewContext(
    read('js/data.js') + '\n' + read('js/rank.js') + '\n' + read('js/auth.js'),
    sandbox,
  );
  return sandbox;
}

const auth = loadAuthModule();

// A fresh install: the defaults the game ships with, nothing played.
const freshLocal = () => ({
  xp: 0, gamesPlayed: 0, gamesWon: 0, bestCombo: 0, totalMatches: 0,
  bestWave: 0, bestSurvivalScore: 0, dailyCompleted: 0, blitzWins: 0,
  perfectWins: 0, dailyStreak: 0, streakFreezes: 0, weeklyStreak: 0,
  loginStreak: 0, loginBestStreak: 0,
  bestTimes: { easy: null, medium: null, hard: null, extreme: null },
  winsPerDifficulty: { easy: 0, medium: 0, hard: 0, extreme: 0 },
  dailyBestTimes: {},
  dailyLastDate: null, weeklyLastDate: null, loginLastDate: null,
  unlockedAchievements: [], unlockedSkins: ['default'],
  gameHistory: [],
  activeSkin: 'default', activeTheme: 'cyber', activeSoundTheme: 'cyber',
  rank: 'ROOKIE', dailyQuests: null,
});

// A real account as the server holds it.
const fullRemote = () => ({
  xp: 14544, gamesPlayed: 120, gamesWon: 90, bestCombo: 7, totalMatches: 900,
  bestWave: 9, bestSurvivalScore: 4200, dailyCompleted: 31, blitzWins: 12,
  perfectWins: 4, dailyStreak: 6, streakFreezes: 2, weeklyStreak: 3,
  loginStreak: 11, loginBestStreak: 19,
  bestTimes: { easy: 12, medium: 28, hard: 41, extreme: 90 },
  winsPerDifficulty: { easy: 30, medium: 30, hard: 20, extreme: 10 },
  dailyBestTimes: { '2026-10-29': { time: 41, difficulty: 'hard' } },
  dailyLastDate: '2026-10-29', weeklyLastDate: '2026-10-26', loginLastDate: '2026-10-29',
  unlockedAchievements: ['first_win'], unlockedSkins: ['default', 'gold'],
  gameHistory: [{ mode: 'daily', difficulty: 'hard', result: 'win', moves: 18, time: 41, combo: 4, xp: 120, ts: 1761700000000 }],
  activeSkin: 'gold', activeTheme: 'blood', activeSoundTheme: 'retro',
  rank: 'SINGULARITY', dailyQuests: { date: '2026-10-29', progress: { win2: { value: 2, completed: true } } },
});

describe('mergeStats — a fresh device pulling a full profile', () => {
  test('keeps the remote best times rather than the empty local ones', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.deepStrictEqual({ ...merged.bestTimes },
      { easy: 12, medium: 28, hard: 41, extreme: 90 });
  });

  test('keeps the remote per-difficulty win counts', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.deepStrictEqual({ ...merged.winsPerDifficulty },
      { easy: 30, medium: 30, hard: 20, extreme: 10 });
  });

  test('keeps the remote daily best times', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.deepStrictEqual({ ...merged.dailyBestTimes },
      { '2026-10-29': { time: 41, difficulty: 'hard' } });
  });

  test('keeps the remote survival score and every streak counter', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.strictEqual(merged.bestSurvivalScore, 4200);
    assert.strictEqual(merged.streakFreezes, 2);
    assert.strictEqual(merged.weeklyStreak, 3);
    assert.strictEqual(merged.loginStreak, 11);
    assert.strictEqual(merged.loginBestStreak, 19);
  });

  test('keeps the remote streak dates, or the streaks cannot continue', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.strictEqual(merged.dailyLastDate, '2026-10-29');
    assert.strictEqual(merged.weeklyLastDate, '2026-10-26');
    assert.strictEqual(merged.loginLastDate, '2026-10-29');
  });

  test('keeps the remote mission history', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.strictEqual(merged.gameHistory.length, 1);
    assert.strictEqual(merged.gameHistory[0].mode, 'daily');
  });

  test('keeps today\'s quest progress earned on the other device', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.strictEqual(merged.dailyQuests.progress.win2.value, 2);
  });
});

describe('mergeStats — a device that is ahead of the server', () => {
  test('keeps the faster local time for a difficulty', () => {
    const local = { ...freshLocal(), bestTimes: { easy: 9, medium: null, hard: null, extreme: null } };
    const merged = auth.mergeStats(local, fullRemote());

    assert.strictEqual(merged.bestTimes.easy, 9, 'a lower time is a better time');
    assert.strictEqual(merged.bestTimes.medium, 28, 'the remote value still fills the gaps');
  });

  test('keeps the faster local daily time for a date both sides have', () => {
    const local = {
      ...freshLocal(),
      dailyBestTimes: { '2026-10-29': { time: 30, difficulty: 'hard' } },
    };
    const merged = auth.mergeStats(local, fullRemote());

    assert.strictEqual(merged.dailyBestTimes['2026-10-29'].time, 30);
  });

  test('keeps the later streak date', () => {
    const local = { ...freshLocal(), loginLastDate: '2026-10-30' };
    const merged = auth.mergeStats(local, fullRemote());

    assert.strictEqual(merged.loginLastDate, '2026-10-30');
  });

  test('keeps the local theme choices — they belong to this device', () => {
    const merged = auth.mergeStats(freshLocal(), fullRemote());

    assert.strictEqual(merged.activeSkin, 'default');
    assert.strictEqual(merged.activeTheme, 'cyber');
    assert.strictEqual(merged.activeSoundTheme, 'cyber');
  });

  test('still takes the higher value for the plain counters', () => {
    const local = { ...freshLocal(), xp: 20000, gamesWon: 200 };
    const merged = auth.mergeStats(local, fullRemote());

    assert.strictEqual(merged.xp, 20000);
    assert.strictEqual(merged.gamesWon, 200);
  });

  test('unions both achievement and skin lists', () => {
    const local = {
      ...freshLocal(),
      unlockedAchievements: ['speed_demon'],
      unlockedSkins: ['default', 'acid'],
    };
    const merged = auth.mergeStats(local, fullRemote());

    assert.deepStrictEqual([...merged.unlockedAchievements].sort(), ['first_win', 'speed_demon']);
    assert.deepStrictEqual([...merged.unlockedSkins].sort(), ['acid', 'default', 'gold']);
  });

  test('derives the rank from the merged XP instead of trusting either side', () => {
    const local = { ...freshLocal(), xp: 0, rank: 'SINGULARITY' };
    const remote = { ...fullRemote(), xp: 0, rank: 'SINGULARITY' };
    const merged = auth.mergeStats(local, remote);

    assert.strictEqual(merged.rank, 'ROOKIE', 'a forged rank must not survive the merge');
  });
});

describe('mergeStats — nothing to merge', () => {
  test('returns the local stats untouched when there is no remote profile', () => {
    const local = freshLocal();

    assert.strictEqual(auth.mergeStats(local, null), local);
    assert.strictEqual(auth.mergeStats(local, 'nope'), local);
  });

  test('survives a remote profile missing every nested field', () => {
    const merged = auth.mergeStats(freshLocal(), { xp: 500 });

    assert.strictEqual(merged.xp, 500);
    assert.deepStrictEqual({ ...merged.bestTimes },
      { easy: null, medium: null, hard: null, extreme: null });
    assert.deepStrictEqual([...merged.gameHistory], []);
  });
});
