// Every date in the game is a UTC date.
//
// The Daily Challenge seeds one board per date and the daily leaderboard ranks
// that date's times, so "today" has to mean the same thing for every player.
// Read from the device clock it did not: a player in Auckland and one in
// California are on different dates for most of a day, so they played different
// boards while api/leaderboard/daily.js filed both under one UTC date.
//
// These assertions run inside child processes with TZ pinned, because the bug
// only shows outside UTC — on a UTC runner the old local-clock code and the
// fixed code agree, and the test would pass either way.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

// Zones either side of UTC, both far enough out to sit on a different calendar
// day from UTC for part of every day.
const ZONES = ['Pacific/Auckland', 'America/Los_Angeles', 'UTC'];

// Evaluates js/data.js plus the named files in a child process under `tz`, and
// returns whatever `expr` evaluates to.
function evalUnderTz(tz, files, expr) {
  const script = `
    const fs = require('fs'), vm = require('vm'), path = require('path');
    const read = rel => fs.readFileSync(path.join(${JSON.stringify(ROOT)}, rel), 'utf8');
    const sandbox = { console, Math, Date, JSON, String, Number, Array, Object, Set, Boolean };
    vm.runInNewContext(
      ${JSON.stringify(['js/data.js', ...files])}.map(read).join('\\n'),
      sandbox,
    );
    const { ${'toDateString, getTodayString, shiftDateString, getWeekStartString, daysUntilWeeklyReset, computeWeeklyStreak, computeLoginStreak, getDailyDifficulty'} } = sandbox;
    process.stdout.write(JSON.stringify(${expr}));
  `;
  const out = execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  });
  return JSON.parse(out);
}

describe('toDateString — the one date formatter', () => {
  for (const tz of ZONES) {
    test(`returns the UTC calendar date in ${tz}`, () => {
      // 23:30 UTC on the 30th. In Auckland that instant is already the 31st
      // local; in Los Angeles it is still the 30th. The answer must be the
      // UTC date in both, or two players get different boards.
      const got = evalUnderTz(tz, [], `toDateString(new Date('2026-10-30T23:30:00Z'))`);
      assert.strictEqual(got, '2026-10-30');
    });

    test(`returns the UTC date just after UTC midnight in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `toDateString(new Date('2026-10-31T00:30:00Z'))`);
      assert.strictEqual(got, '2026-10-31');
    });

    test(`getTodayString agrees with the clock's own UTC date in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `[getTodayString(), new Date().toISOString().slice(0, 10)]`);
      assert.strictEqual(got[0], got[1]);
    });
  }
});

describe('shiftDateString — walking days for the streak checks', () => {
  for (const tz of ZONES) {
    test(`steps back one day in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `shiftDateString('2026-10-31', -1)`);
      assert.strictEqual(got, '2026-10-30');
    });

    test(`crosses a month boundary in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `shiftDateString('2026-03-01', -1)`);
      assert.strictEqual(got, '2026-02-28');
    });

    test(`crosses a leap day in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `shiftDateString('2028-03-01', -1)`);
      assert.strictEqual(got, '2028-02-29');
    });

    test(`steps over a daylight-saving change in ${tz}`, () => {
      // Europe and the Americas both shift clocks inside this window. A local
      // date that jumps 23 or 25 hours used to land on the wrong day.
      const got = evalUnderTz(tz, [], `shiftDateString('2026-03-29', -1)`);
      assert.strictEqual(got, '2026-03-28');
    });

    test(`round-trips a date through a week in ${tz}`, () => {
      const got = evalUnderTz(tz, [], `shiftDateString(shiftDateString('2026-10-30', -7), 7)`);
      assert.strictEqual(got, '2026-10-30');
    });
  }
});

describe('getDailyDifficulty — the same difficulty for everyone', () => {
  for (const tz of ZONES) {
    test(`reads the day of week in UTC in ${tz}`, () => {
      // 2026-10-30T23:30:00Z is a Friday in UTC. Local Auckland is Saturday.
      // The rotation is ['easy','medium','hard','extreme','hard','medium',
      // 'easy'] indexed from Sunday, so Friday is 'medium'.
      const got = evalUnderTz(tz, ['js/daily.js'],
        `getDailyDifficulty(new Date('2026-10-30T23:30:00Z'))`);
      assert.strictEqual(got, 'medium');
    });
  }
});

describe('getWeekStartString — the weekly board', () => {
  for (const tz of ZONES) {
    test(`returns the same UTC Monday all week in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/weekly.js'], `[
        getWeekStartString(new Date('2026-08-17T00:00:00Z')),
        getWeekStartString(new Date('2026-08-23T23:59:00Z')),
        getWeekStartString(new Date('2026-08-24T00:00:00Z')),
      ]`);
      assert.deepStrictEqual(got, ['2026-08-17', '2026-08-17', '2026-08-24']);
    });

    test(`crosses a month boundary in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/weekly.js'],
        `getWeekStartString(new Date('2026-09-01T12:00:00Z'))`);
      assert.strictEqual(got, '2026-08-31');
    });

    test(`counts days to the next reset in UTC in ${tz}`, () => {
      // Monday reads 7 so the counter never shows 0; Sunday reads 1.
      const got = evalUnderTz(tz, ['js/weekly.js'], `[
        daysUntilWeeklyReset(new Date('2026-08-17T12:00:00Z')),
        daysUntilWeeklyReset(new Date('2026-08-23T12:00:00Z')),
      ]`);
      assert.deepStrictEqual(got, [7, 1]);
    });

    test(`continues a weekly streak from the previous week in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/weekly.js'], `[
        computeWeeklyStreak('2026-08-10', '2026-08-17', 3),
        computeWeeklyStreak('2026-08-03', '2026-08-17', 3),
      ]`);
      assert.deepStrictEqual(got, [4, 1], 'a skipped week restarts the streak');
    });
  }
});

describe('computeLoginStreak — the login streak', () => {
  for (const tz of ZONES) {
    test(`continues from yesterday's UTC date in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/login-streak.js'],
        `computeLoginStreak('2026-10-30', '2026-10-31', 5, 0)`);
      assert.strictEqual(got.streak, 6);
      assert.strictEqual(got.counted, true);
    });

    test(`does not count the same day twice in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/login-streak.js'],
        `computeLoginStreak('2026-10-31', '2026-10-31', 5, 0)`);
      assert.strictEqual(got.counted, false);
      assert.strictEqual(got.streak, 5);
    });

    test(`spends a freeze across a gap rather than resetting in ${tz}`, () => {
      const got = evalUnderTz(tz, ['js/login-streak.js'],
        `computeLoginStreak('2026-10-20', '2026-10-31', 5, 2)`);
      assert.strictEqual(got.streak, 6);
      assert.strictEqual(got.freezes, 1);
      assert.strictEqual(got.freezeUsed, true);
    });
  }
});
