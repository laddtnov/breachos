// Achievements used to live entirely in their own localStorage silo
// (js/achievements.js), disconnected from playerStats — so syncSave's
// payload never carried an unlock, and it could never leave the device it
// was earned on. These tests cover the two ends of that fix: saveAchievements
// mirroring onto playerStats and pushing immediately, and the merge a pull
// would apply landing back in the real achievement store.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAchievementsModule({ playerStats, syncSave } = {}) {
  const src = fs.readFileSync(
    path.join(__dirname, '..', 'js', 'achievements.js'),
    'utf8'
  );
  const store = {};
  const sandbox = {
    console, Math, Date, JSON, String, Number, Array, Object,
    localStorage: {
      getItem: k => store[k] ?? null,
      setItem: (k, v) => { store[k] = v; },
    },
    document: { getElementById: () => null, querySelectorAll: () => [] },
    playerStats,
    syncSave,
  };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

describe('saveAchievements — pushes an unlock toward the server', () => {
  test('mirrors the unlocked list onto playerStats', () => {
    const playerStats = { xp: 100 };
    const sandbox = loadAchievementsModule({ playerStats });

    sandbox.saveAchievements(['first_win']);

    assert.deepStrictEqual(playerStats.unlockedAchievements, ['first_win']);
  });

  test('calls syncSave rather than waiting for the next stats save', () => {
    const playerStats = { xp: 100 };
    let calls = 0;
    const syncSave = () => { calls += 1; return Promise.resolve(); };
    const sandbox = loadAchievementsModule({ playerStats, syncSave });

    sandbox.saveAchievements(['first_win']);

    assert.strictEqual(calls, 1);
  });

  test('does not throw when sync is unavailable (logged out)', () => {
    const sandbox = loadAchievementsModule({ playerStats: { xp: 0 } });

    assert.doesNotThrow(() => sandbox.saveAchievements(['first_win']));
  });

  test('still writes the achievement to localStorage', () => {
    const playerStats = { xp: 0 };
    const sandbox = loadAchievementsModule({ playerStats });

    sandbox.saveAchievements(['first_win']);

    assert.deepStrictEqual(
      JSON.parse(sandbox.localStorage.getItem('cyberpunk_achievements')),
      ['first_win']
    );
  });
});

describe('cross-device pull — a remote-only unlock becomes locally visible', () => {
  test('an achievement earned on another device lands in this device\'s store', () => {
    // Mirrors what syncLoad now does: merge the two id lists, then hand the
    // union to saveAchievements so it becomes the real store, not just a
    // field nobody reads.
    const local = ['first_win'];
    const remote = ['first_win', 'combo_master']; // earned on the other device

    const merged = [...new Set([...local, ...remote])];

    const playerStats = { xp: 500 };
    const sandbox = loadAchievementsModule({ playerStats });
    sandbox.saveAchievements(merged);

    assert.deepStrictEqual(
      JSON.parse(sandbox.localStorage.getItem('cyberpunk_achievements')).sort(),
      ['combo_master', 'first_win'].sort()
    );
  });
});
