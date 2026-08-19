// Pure-logic tests for the Dossier achievement badge grid.
// achievements.js touches localStorage at load, so the sandbox stubs it.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadAchievementsModule() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js/achievements.js'), 'utf8');
  const store = {};
  const sandbox = {
    console, Math, Date, JSON, String, Number, Array, Object,
    localStorage: {
      getItem: k => store[k] ?? null,
      setItem: (k, v) => { store[k] = v; },
    },
    document: { getElementById: () => null, querySelectorAll: () => [] },
  };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

const a = loadAchievementsModule();

// Small stand-in list so these tests do not break every time a real achievement
// is added or reworded.
const SAMPLE = [
  { id: 'alpha', name: 'ALPHA', symbol: 'A', desc: 'Do the first thing' },
  { id: 'beta',  name: 'BETA',  symbol: 'B', desc: 'Do the second thing' },
  { id: 'gamma', name: 'GAMMA', symbol: 'G', desc: 'Do the third thing' },
];

describe('buildAchievementBadges', () => {
  test('returns one badge per achievement, in order', () => {
    const badges = a.buildAchievementBadges(SAMPLE, []);

    assert.strictEqual(badges.length, 3);
    assert.deepStrictEqual(Array.from(badges).map(b => b.id), ['alpha', 'beta', 'gamma']);
  });

  test('marks only the earned achievements as unlocked', () => {
    const badges = a.buildAchievementBadges(SAMPLE, ['beta']);
    const byId = Object.fromEntries(Array.from(badges).map(b => [b.id, b.unlocked]));

    assert.strictEqual(byId.alpha, false);
    assert.strictEqual(byId.beta, true);
    assert.strictEqual(byId.gamma, false);
  });

  test('carries the unlock condition through for the tooltip', () => {
    const badges = a.buildAchievementBadges(SAMPLE, []);

    assert.strictEqual(badges[0].desc, 'Do the first thing');
  });

  test('treats everything as locked when nothing is earned', () => {
    const badges = a.buildAchievementBadges(SAMPLE, []);

    assert.ok(Array.from(badges).every(b => b.unlocked === false));
  });

  test('ignores unlocked ids that no longer match an achievement', () => {
    // A removed or renamed achievement must not crash or invent a badge.
    const badges = a.buildAchievementBadges(SAMPLE, ['deleted_one', 'alpha']);

    assert.strictEqual(badges.length, 3);
    assert.strictEqual(badges[0].unlocked, true);
  });

  test('handles a missing unlocked list rather than throwing', () => {
    const badges = a.buildAchievementBadges(SAMPLE);

    assert.strictEqual(badges.length, 3);
    assert.ok(Array.from(badges).every(b => b.unlocked === false));
  });
});

describe('achievementProgress', () => {
  test('counts earned against total', () => {
    const progress = a.achievementProgress(SAMPLE, ['alpha', 'gamma']);

    assert.strictEqual(progress.unlocked, 2);
    assert.strictEqual(progress.total, 3);
  });

  test('reports a rounded percentage', () => {
    const progress = a.achievementProgress(SAMPLE, ['alpha']);

    // 1 of 3 is 33.33..., which should present as 33.
    assert.strictEqual(progress.percent, 33);
  });

  test('reports zero percent when nothing is earned', () => {
    const progress = a.achievementProgress(SAMPLE, []);

    assert.strictEqual(progress.percent, 0);
  });

  test('reports one hundred percent when everything is earned', () => {
    const progress = a.achievementProgress(SAMPLE, ['alpha', 'beta', 'gamma']);

    assert.strictEqual(progress.percent, 100);
  });

  test('does not divide by zero on an empty achievement list', () => {
    const progress = a.achievementProgress([], []);

    assert.strictEqual(progress.percent, 0);
    assert.strictEqual(progress.total, 0);
  });

  test('does not count unknown ids toward progress', () => {
    const progress = a.achievementProgress(SAMPLE, ['alpha', 'ghost_id']);

    assert.strictEqual(progress.unlocked, 1);
  });
});

describe('the real achievement list stays badge-renderable', () => {
  test('every shipped achievement has the fields a badge needs', () => {
    const badges = a.buildAchievementBadges(a.getAchievements(), []);

    assert.ok(badges.length > 0, 'expected at least one shipped achievement');
    for (const badge of badges) {
      assert.ok(badge.id, 'achievement missing id');
      assert.ok(badge.name, `${badge.id} missing name`);
      assert.ok(badge.symbol, `${badge.id} missing symbol`);
      assert.ok(badge.desc, `${badge.id} missing desc — tooltip would be empty`);
    }
  });
});
