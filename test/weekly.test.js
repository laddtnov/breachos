// Pure-logic tests for the Weekly Challenge and Login Streak.
// The browser files are plain global scripts, so each is evaluated in a vm
// sandbox and its top-level function declarations are read off the context.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGlobals(relPath, extraGlobals = {}) {
  const src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const sandbox = { console, Math, Date, JSON, String, Number, Array, Object, ...extraGlobals };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

const weekly = loadGlobals('js/weekly.js');
const streak = loadGlobals('js/login-streak.js');

describe('getWeekStartString', () => {
  test('returns the same Monday for every day of one week', () => {
    // Mon 2026-08-17 through Sun 2026-08-23 all belong to the week of the 17th.
    const monday = new Date(2026, 7, 17);
    const sunday = new Date(2026, 7, 23);

    assert.strictEqual(weekly.getWeekStartString(monday), '2026-08-17');
    assert.strictEqual(weekly.getWeekStartString(sunday), '2026-08-17');
  });

  test('rolls to the next Monday once a new week begins', () => {
    const nextMonday = new Date(2026, 7, 24);
    assert.strictEqual(weekly.getWeekStartString(nextMonday), '2026-08-24');
  });

  test('crosses a month boundary correctly', () => {
    // Tue 2026-09-01 belongs to the week starting Mon 2026-08-31.
    const tuesday = new Date(2026, 8, 1);
    assert.strictEqual(weekly.getWeekStartString(tuesday), '2026-08-31');
  });

  test('crosses a year boundary correctly', () => {
    // Fri 2027-01-01 belongs to the week starting Mon 2026-12-28.
    const newYearsDay = new Date(2027, 0, 1);
    assert.strictEqual(weekly.getWeekStartString(newYearsDay), '2026-12-28');
  });

  test('pads single-digit months and days to two characters', () => {
    const march = new Date(2026, 2, 5); // Thu 2026-03-05, week of Mon 2026-03-02
    assert.strictEqual(weekly.getWeekStartString(march), '2026-03-02');
  });
});

describe('daysUntilWeeklyReset', () => {
  test('reports a full week when today is Monday', () => {
    assert.strictEqual(weekly.daysUntilWeeklyReset(new Date(2026, 7, 17)), 7);
  });

  test('reports one day when today is Sunday', () => {
    assert.strictEqual(weekly.daysUntilWeeklyReset(new Date(2026, 7, 23)), 1);
  });

  test('never reports zero on any day of the week', () => {
    for (let day = 17; day <= 23; day++) {
      const days = weekly.daysUntilWeeklyReset(new Date(2026, 7, day));
      assert.ok(days >= 1, `day ${day} produced ${days}, expected at least 1`);
      assert.ok(days <= 7, `day ${day} produced ${days}, expected at most 7`);
    }
  });
});

describe('computeWeeklyStreak', () => {
  test('increments when the previous week was completed', () => {
    assert.strictEqual(weekly.computeWeeklyStreak('2026-08-10', '2026-08-17', 3), 4);
  });

  test('resets to 1 when a week was skipped', () => {
    assert.strictEqual(weekly.computeWeeklyStreak('2026-08-03', '2026-08-17', 9), 1);
  });

  test('starts at 1 when there is no prior completion', () => {
    assert.strictEqual(weekly.computeWeeklyStreak(null, '2026-08-17', 0), 1);
  });

  test('increments across a year boundary', () => {
    assert.strictEqual(weekly.computeWeeklyStreak('2026-12-28', '2027-01-04', 2), 3);
  });
});

describe('computeLoginStreak', () => {
  test('increments on a consecutive day', () => {
    const result = streak.computeLoginStreak('2026-08-18', '2026-08-19', 4, 0);
    assert.strictEqual(result.streak, 5);
    assert.strictEqual(result.freezeUsed, false);
  });

  test('leaves the streak untouched when already logged in today', () => {
    const result = streak.computeLoginStreak('2026-08-19', '2026-08-19', 4, 0);
    assert.strictEqual(result.streak, 4);
    assert.strictEqual(result.counted, false);
  });

  test('burns a freeze to survive a single missed day', () => {
    const result = streak.computeLoginStreak('2026-08-17', '2026-08-19', 6, 2);
    assert.strictEqual(result.streak, 7);
    assert.strictEqual(result.freezeUsed, true);
    assert.strictEqual(result.freezes, 1);
  });

  test('resets to 1 when a day is missed and no freeze is available', () => {
    const result = streak.computeLoginStreak('2026-08-17', '2026-08-19', 6, 0);
    assert.strictEqual(result.streak, 1);
    assert.strictEqual(result.freezeUsed, false);
  });

  test('starts at 1 on a first-ever login', () => {
    const result = streak.computeLoginStreak(null, '2026-08-19', 0, 0);
    assert.strictEqual(result.streak, 1);
    assert.strictEqual(result.counted, true);
  });

  test('increments across a month boundary', () => {
    const result = streak.computeLoginStreak('2026-08-31', '2026-09-01', 2, 0);
    assert.strictEqual(result.streak, 3);
  });
});

describe('getLoginStreakBonus', () => {
  test('awards no bonus on the first day', () => {
    assert.strictEqual(streak.getLoginStreakBonus(1), 0);
  });

  test('grows with the streak length', () => {
    assert.ok(streak.getLoginStreakBonus(5) > streak.getLoginStreakBonus(2));
  });

  test('caps so a long streak cannot award unbounded XP', () => {
    assert.strictEqual(streak.getLoginStreakBonus(500), streak.getLoginStreakBonus(30));
  });
});
