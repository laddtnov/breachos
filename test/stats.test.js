// Pure-logic tests for win-rate reporting.
// js/stats-rules.js is DOM-free so it can be evaluated in a vm sandbox.

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

const s = loadGlobals('js/stats-rules.js');

describe('calculateWinRate', () => {
  test('reports a plain percentage', () => {
    assert.strictEqual(s.calculateWinRate(5, 10), 50);
  });

  test('rounds to a whole percent', () => {
    assert.strictEqual(s.calculateWinRate(1, 3), 33);
  });

  test('reports zero when nothing has been played', () => {
    assert.strictEqual(s.calculateWinRate(0, 0), 0);
  });

  test('reports zero rather than dividing by zero when wins exist but plays do not', () => {
    // Corrupt saves exist in the wild; this must not produce Infinity.
    assert.strictEqual(s.calculateWinRate(5, 0), 0);
  });

  test('reports one hundred for a clean sweep', () => {
    assert.strictEqual(s.calculateWinRate(7, 7), 100);
  });
});

describe('calculateWinRate — existing skewed saves', () => {
  test('clamps above one hundred rather than displaying 114%', () => {
    // The reported bug: 8 wins against 7 games played.
    assert.strictEqual(s.calculateWinRate(8, 7), 100);
  });

  test('clamps hard skew from a long survival run', () => {
    assert.strictEqual(s.calculateWinRate(40, 4), 100);
  });

  test('never returns a negative percentage', () => {
    assert.ok(s.calculateWinRate(-5, 10) >= 0);
  });
});

describe('calculateWinRate — missing values', () => {
  test('treats undefined counters as zero', () => {
    assert.strictEqual(s.calculateWinRate(undefined, undefined), 0);
  });

  test('treats null counters as zero', () => {
    assert.strictEqual(s.calculateWinRate(null, null), 0);
  });

  test('survives a non-numeric counter without returning NaN', () => {
    const rate = s.calculateWinRate('nonsense', 10);
    assert.ok(Number.isFinite(rate), `expected a finite number, got ${rate}`);
  });
});

describe('gameHistoryModeLabel', () => {
  test('labels every live mode', () => {
    assert.strictEqual(s.gameHistoryModeLabel('classic'), 'CLASSIC');
    assert.strictEqual(s.gameHistoryModeLabel('blitz'), 'BLITZ');
    assert.strictEqual(s.gameHistoryModeLabel('survival'), 'SURVIVAL');
    assert.strictEqual(s.gameHistoryModeLabel('daily'), 'DAILY');
  });

  test('labels weekly, which the original map omitted', () => {
    // weekly only rendered correctly because the uppercase fallback happened to
    // match. It should be mapped deliberately.
    assert.strictEqual(s.gameHistoryModeLabel('weekly'), 'WEEKLY');
  });

  test('never shows a retired mode that no longer exists in the game', () => {
    // Timed mode was built and reverted, but saved histories still hold entries
    // recorded as 'timed'. It was a countdown mode, so Blitz is its live
    // equivalent — showing "TIMED" names a mode the player cannot select.
    assert.strictEqual(s.gameHistoryModeLabel('timed'), 'BLITZ');
  });

  test('falls back to uppercase for an unrecognised mode', () => {
    assert.strictEqual(s.gameHistoryModeLabel('experiment'), 'EXPERIMENT');
  });

  test('survives a missing mode rather than throwing', () => {
    // A corrupt or truncated entry must not take the whole history table down.
    assert.strictEqual(s.gameHistoryModeLabel(undefined), '—');
    assert.strictEqual(s.gameHistoryModeLabel(null), '—');
    assert.strictEqual(s.gameHistoryModeLabel(''), '—');
  });
});

describe('survival accounting invariant', () => {
  test('a survival run never records more wins than games played', () => {
    // The accounting rule this fix establishes: each cleared wave counts as
    // both a play and a win, and the run-ending loss counts as one more play.
    let played = 0;
    let won = 0;

    for (let wave = 0; wave < 10; wave++) {
      played++;
      won++;
    }
    played++; // the run ends in a loss

    assert.ok(won <= played, `${won} wins against ${played} games`);
    assert.strictEqual(s.calculateWinRate(won, played), 91);
  });

  test('stays at or below one hundred percent for any run length', () => {
    for (const waves of [0, 1, 5, 25, 100]) {
      const played = waves + 1;
      const won = waves;
      assert.ok(s.calculateWinRate(won, played) <= 100, `${waves} waves exceeded 100%`);
    }
  });
});
