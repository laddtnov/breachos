// Pure-logic tests for haptic pattern presets.
// js/haptic-patterns.js is DOM-free so it can be evaluated in a vm sandbox.

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

const h = loadGlobals('js/haptic-patterns.js');

// Total buzz time — the honest way to compare "strength" between presets.
const intensity = pattern =>
  Array.isArray(pattern) ? pattern.reduce((a, b) => a + b, 0) : (pattern || 0);

// Arrays built inside the vm sandbox carry that realm's Array prototype, which
// deepStrictEqual treats as unequal to ours. Copy into a local array so the
// comparison is about the values, which is what these tests are asserting.
const norm = pattern => (Array.isArray(pattern) ? Array.from(pattern) : pattern);

describe('hapticPattern — standard preset preserves existing feel', () => {
  test('keeps the current flip buzz', () => {
    assert.strictEqual(h.hapticPattern('standard', 'flip'), 50);
  });

  test('keeps the current match pattern', () => {
    assert.deepStrictEqual(norm(h.hapticPattern('standard', 'match')), [80, 40, 80]);
  });

  test('keeps the current error buzz', () => {
    assert.strictEqual(h.hapticPattern('standard', 'error'), 150);
  });

  test('keeps the current win pattern', () => {
    assert.deepStrictEqual(norm(h.hapticPattern('standard', 'win')), [100, 40, 100, 40, 180]);
  });

  test('keeps the current lose pattern', () => {
    assert.deepStrictEqual(norm(h.hapticPattern('standard', 'lose')), [220, 60, 150]);
  });
});

describe('hapticPattern — preset strength ordering', () => {
  test('subtle buzzes less than standard for the same event', () => {
    const subtle = intensity(h.hapticPattern('subtle', 'match'));
    const standard = intensity(h.hapticPattern('standard', 'match'));

    assert.ok(subtle < standard, `subtle ${subtle} should be under standard ${standard}`);
  });

  test('intense buzzes more than standard for the same event', () => {
    const intense = intensity(h.hapticPattern('intense', 'match'));
    const standard = intensity(h.hapticPattern('standard', 'match'));

    assert.ok(intense > standard, `intense ${intense} should exceed standard ${standard}`);
  });

  test('orders every shared event consistently', () => {
    for (const event of ['flip', 'match', 'error', 'win', 'lose']) {
      const subtle = intensity(h.hapticPattern('subtle', event));
      const intense = intensity(h.hapticPattern('intense', event));
      assert.ok(subtle < intense, `${event}: subtle ${subtle} should be under intense ${intense}`);
    }
  });
});

describe('hapticPattern — combo tiers', () => {
  test('escalates as the combo climbs', () => {
    const low = intensity(h.hapticPattern('standard', 'combo', 2));
    const mid = intensity(h.hapticPattern('standard', 'combo', 5));
    const high = intensity(h.hapticPattern('standard', 'combo', 7));

    assert.ok(mid > low, `combo 5 (${mid}) should beat combo 2 (${low})`);
    assert.ok(high > mid, `combo 7 (${high}) should beat combo 5 (${mid})`);
  });

  test('clamps to the top tier rather than growing without bound', () => {
    const seven = h.hapticPattern('standard', 'combo', 7);
    const fifty = h.hapticPattern('standard', 'combo', 50);

    assert.deepStrictEqual(norm(fifty), norm(seven));
  });

  test('treats a missing combo level as the lowest tier', () => {
    const noLevel = h.hapticPattern('standard', 'combo');
    const lowest = h.hapticPattern('standard', 'combo', 1);

    assert.deepStrictEqual(norm(noLevel), norm(lowest));
  });
});

describe('hapticPattern — fallbacks', () => {
  test('falls back to standard for an unknown preset', () => {
    assert.deepStrictEqual(norm(h.hapticPattern('nonsense', 'match')), norm(h.hapticPattern('standard', 'match')));
  });

  test('returns null for an unknown event so nothing is fired', () => {
    assert.strictEqual(h.hapticPattern('standard', 'nonsense'), null);
  });
});

describe('hapticPattern — Vibration API validity', () => {
  test('every preset and event yields a positive number or array of positive numbers', () => {
    for (const preset of h.hapticPresetIds()) {
      for (const event of ['flip', 'match', 'error', 'win', 'lose']) {
        const pattern = h.hapticPattern(preset, event);
        const values = Array.isArray(pattern) ? pattern : [pattern];

        for (const value of values) {
          assert.strictEqual(typeof value, 'number', `${preset}/${event} produced a non-number`);
          assert.ok(value > 0, `${preset}/${event} produced ${value}, must be positive`);
          assert.ok(Number.isInteger(value), `${preset}/${event} produced non-integer ${value}`);
        }
      }
    }
  });

  test('exposes exactly the three selectable presets', () => {
    assert.deepStrictEqual(norm(h.hapticPresetIds()), ['subtle', 'standard', 'intense']);
  });
});
