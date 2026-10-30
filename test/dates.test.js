// Every date in the game is a UTC date.
//
// The Daily Challenge seeds one board per date and the daily leaderboard ranks
// that date's times, so "today" has to mean the same thing for every player.
// Read from the device clock it did not: a player in Auckland and one in
// California are on different calendar days for most of a day, so they played
// different boards while api/leaderboard/daily.js filed both under one UTC date.
//
// Each case runs in a child process per time zone, because the bug only shows
// outside UTC — on a UTC runner the old local-clock code and the fixed code
// agree and the assertions would pass either way. The cases are a table rather
// than written out per zone so the zone loop is the only thing repeated.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');

// Zones either side of UTC, both far enough out to sit on a different calendar
// day from UTC for part of every day.
const ZONES = ['Pacific/Auckland', 'America/Los_Angeles', 'UTC'];

const HELPERS = [
  'toDateString', 'getTodayString', 'shiftDateString', 'getWeekStartString',
  'daysUntilWeeklyReset', 'computeWeeklyStreak', 'computeLoginStreak',
  'getDailyDifficulty',
].join(', ');

// Evaluates js/data.js plus `files` in a child process under `tz`, and returns
// whatever `expr` evaluates to.
function evalUnderTz(tz, files, expr) {
  const script = `
    const fs = require('fs'), vm = require('vm'), path = require('path');
    const read = rel => fs.readFileSync(path.join(${JSON.stringify(ROOT)}, rel), 'utf8');
    const sandbox = { console, Math, Date, JSON, String, Number, Array, Object, Set, Boolean };
    vm.runInNewContext(
      ${JSON.stringify(['js/data.js', ...files])}.map(read).join('\\n'),
      sandbox,
    );
    const { ${HELPERS} } = sandbox;
    process.stdout.write(JSON.stringify(${expr}));
  `;
  return JSON.parse(execFileSync(process.execPath, ['-e', script], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  }));
}

// Each case: what it proves, which files it needs, the expression, the answer.
// Every expression returns a JSON value so one assertion covers them all.
const CASES = {
  'toDateString — the one date formatter': [
    // 23:30 UTC on the 30th is already the 31st in Auckland and still the 30th
    // in Los Angeles. The answer must be the UTC date in both, or two players
    // get different boards.
    ['returns the UTC calendar date, not the local one', [],
      `toDateString(new Date('2026-10-30T23:30:00Z'))`, '2026-10-30'],
    ['returns the UTC date just after UTC midnight', [],
      `toDateString(new Date('2026-10-31T00:30:00Z'))`, '2026-10-31'],
    ['getTodayString agrees with the clock\'s own UTC date', [],
      `getTodayString() === new Date().toISOString().slice(0, 10)`, true],
  ],

  'shiftDateString — walking days for the streak checks': [
    ['steps back one day', [], `shiftDateString('2026-10-31', -1)`, '2026-10-30'],
    ['steps forward one day', [], `shiftDateString('2026-10-31', 1)`, '2026-11-01'],
    ['crosses a month boundary', [], `shiftDateString('2026-03-01', -1)`, '2026-02-28'],
    ['crosses a leap day', [], `shiftDateString('2028-03-01', -1)`, '2028-02-29'],
    ['crosses a year boundary', [], `shiftDateString('2027-01-01', -1)`, '2026-12-31'],
    // Europe and the Americas both shift their clocks inside this window. A
    // local shift across a 23- or 25-hour day used to land on the wrong date.
    ['steps over a daylight-saving change', [],
      `shiftDateString('2026-03-29', -1)`, '2026-03-28'],
    ['round-trips a date through a week', [],
      `shiftDateString(shiftDateString('2026-10-30', -7), 7)`, '2026-10-30'],
  ],

  'getDailyDifficulty — the same difficulty for everyone': [
    // 2026-10-30T23:30:00Z is Friday in UTC and Saturday in Auckland. The
    // rotation is ['easy','medium','hard','extreme','hard','medium','easy']
    // indexed from Sunday, so UTC Friday is 'medium' and Saturday 'easy'.
    ['reads the day of week in UTC', ['js/daily.js'],
      `getDailyDifficulty(new Date('2026-10-30T23:30:00Z'))`, 'medium'],
  ],

  'getWeekStartString — the weekly board': [
    ['returns the same UTC Monday all week, then rolls over', ['js/weekly.js'], `[
      getWeekStartString(new Date('2026-08-17T00:00:00Z')),
      getWeekStartString(new Date('2026-08-23T23:59:00Z')),
      getWeekStartString(new Date('2026-08-24T00:00:00Z')),
    ]`, ['2026-08-17', '2026-08-17', '2026-08-24']],
    ['crosses a month boundary', ['js/weekly.js'],
      `getWeekStartString(new Date('2026-09-01T12:00:00Z'))`, '2026-08-31'],
    // Monday reads 7 so the counter never shows 0; Sunday reads 1.
    ['counts days to the next reset in UTC', ['js/weekly.js'], `[
      daysUntilWeeklyReset(new Date('2026-08-17T12:00:00Z')),
      daysUntilWeeklyReset(new Date('2026-08-23T12:00:00Z')),
    ]`, [7, 1]],
    ['continues from the previous week, restarts after a skipped one', ['js/weekly.js'], `[
      computeWeeklyStreak('2026-08-10', '2026-08-17', 3),
      computeWeeklyStreak('2026-08-03', '2026-08-17', 3),
    ]`, [4, 1]],
  ],

  'computeLoginStreak — the login streak': [
    ['continues from yesterday\'s UTC date', ['js/login-streak.js'],
      `computeLoginStreak('2026-10-30', '2026-10-31', 5, 0)`,
      { streak: 6, freezes: 0, freezeUsed: false, counted: true }],
    ['does not count the same day twice', ['js/login-streak.js'],
      `computeLoginStreak('2026-10-31', '2026-10-31', 5, 0)`,
      { streak: 5, freezes: 0, freezeUsed: false, counted: false }],
    ['spends a freeze across a gap rather than resetting', ['js/login-streak.js'],
      `computeLoginStreak('2026-10-20', '2026-10-31', 5, 2)`,
      { streak: 6, freezes: 1, freezeUsed: true, counted: true }],
  ],
};

for (const [group, cases] of Object.entries(CASES)) {
  describe(group, () => {
    for (const [name, files, expr, expected] of cases) {
      for (const tz of ZONES) {
        test(`${name} — ${tz}`, () => {
          assert.deepStrictEqual(evalUnderTz(tz, files, expr), expected);
        });
      }
    }
  });
}
