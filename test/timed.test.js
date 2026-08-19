// Pure-logic tests for the Timed mode variant.
// js/timed-mode.js is DOM-free so it can be evaluated in a vm sandbox.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGlobals(relPath) {
  const src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const sandbox = { console, Math, Date, JSON, String, Number, Array, Object };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

const t = loadGlobals('js/timed-mode.js');

// Stand-in for BLITZ_CONFIG, injected so this file stays free of data.js.
const BLITZ = {
  easy:    { countdown: 15, maxMoves: 999 },
  medium:  { countdown: 35, maxMoves: 999 },
  hard:    { countdown: 50, maxMoves: 999 },
  extreme: { countdown: 30, maxMoves: 999 },
};

const DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

describe('modeOverrides — timed', () => {
  test('gives every difficulty the same countdown', () => {
    // This is what separates Timed from Blitz: one fixed clock for all sizes.
    const countdowns = DIFFICULTIES.map(d => t.modeOverrides('timed', d, BLITZ).countdown);
    const unique = [...new Set(countdowns)];

    assert.strictEqual(unique.length, 1, `expected one shared countdown, got ${countdowns}`);
  });

  test('uses the documented fixed countdown', () => {
    assert.strictEqual(t.modeOverrides('timed', 'easy', BLITZ).countdown, t.timedCountdown());
  });

  test('imposes no move limit, so only the clock ends the run', () => {
    for (const d of DIFFICULTIES) {
      const overrides = t.modeOverrides('timed', d, BLITZ);
      assert.ok(overrides.maxMoves >= 999, `${d} capped moves at ${overrides.maxMoves}`);
    }
  });

  test('differs from blitz, which varies its countdown by difficulty', () => {
    const timed = DIFFICULTIES.map(d => t.modeOverrides('timed', d, BLITZ).countdown);
    const blitz = DIFFICULTIES.map(d => t.modeOverrides('blitz', d, BLITZ).countdown);

    assert.notDeepStrictEqual(Array.from(timed), Array.from(blitz));
  });
});

describe('modeOverrides — existing modes are unchanged', () => {
  test('blitz still returns its per-difficulty countdown', () => {
    assert.strictEqual(t.modeOverrides('blitz', 'easy', BLITZ).countdown, 15);
    assert.strictEqual(t.modeOverrides('blitz', 'hard', BLITZ).countdown, 50);
  });

  test('classic returns no overrides, so difficulty defaults apply', () => {
    assert.strictEqual(t.modeOverrides('classic', 'medium', BLITZ), null);
  });

  test('an unknown mode falls back to difficulty defaults rather than throwing', () => {
    assert.strictEqual(t.modeOverrides('nonsense', 'medium', BLITZ), null);
  });

  test('survival and daily keep their own bespoke setup', () => {
    // Both build their board directly; they must not pick up timed overrides.
    assert.strictEqual(t.modeOverrides('survival', 'hard', BLITZ), null);
    assert.strictEqual(t.modeOverrides('daily', 'hard', BLITZ), null);
  });
});

describe('isTimedMode', () => {
  test('recognises timed', () => {
    assert.strictEqual(t.isTimedMode('timed'), true);
  });

  test('does not treat blitz as timed', () => {
    assert.strictEqual(t.isTimedMode('blitz'), false);
  });
});

describe('bestTimedTime', () => {
  test('records the first result', () => {
    assert.strictEqual(t.bestTimedTime(null, 42), 42);
  });

  test('keeps the faster of the two', () => {
    assert.strictEqual(t.bestTimedTime(30, 45), 30);
  });

  test('replaces the record when the new time is faster', () => {
    assert.strictEqual(t.bestTimedTime(60, 45), 45);
  });

  test('treats an undefined existing record as no record', () => {
    assert.strictEqual(t.bestTimedTime(undefined, 20), 20);
  });

  test('ignores a non-finishing result so a loss cannot set a record', () => {
    assert.strictEqual(t.bestTimedTime(30, null), 30);
  });
});
