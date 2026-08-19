// Pure-logic tests for the Survival Mode challenge rework.
// js/survival-rules.js is DOM-free so it can be evaluated in a vm sandbox,
// the same pattern weekly.test.js uses.

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

const rules = loadGlobals('js/survival-rules.js');

// Wave -> loop, matching initSurvivalWave(): 4 difficulties per loop.
const loopForWave = wave => Math.floor((wave - 1) / 4);

describe('survivalCountdownBase', () => {
  test('leaves the opening loop untimed', () => {
    // Waves 1-4 should still ease players in with no countdown.
    assert.strictEqual(rules.survivalCountdownBase(0), 0);
  });

  test('starts the countdown at the second loop', () => {
    assert.strictEqual(rules.survivalCountdownBase(1), 60);
  });

  test('tightens by one step on each later loop', () => {
    assert.strictEqual(rules.survivalCountdownBase(2), 45);
    assert.strictEqual(rules.survivalCountdownBase(3), 30);
  });

  test('never drops below the floor', () => {
    // Loop 4 would decay to 15, which is below the 20s floor.
    assert.strictEqual(rules.survivalCountdownBase(4), 20);
  });

  test('holds the floor at extreme loop counts rather than going negative', () => {
    assert.strictEqual(rules.survivalCountdownBase(50), 20);
  });

  test('decreases monotonically until it reaches the floor', () => {
    for (let loop = 1; loop < 8; loop++) {
      const current = rules.survivalCountdownBase(loop);
      const next = rules.survivalCountdownBase(loop + 1);
      assert.ok(next <= current, `loop ${loop} gave ${current}, loop ${loop + 1} gave ${next}`);
    }
  });
});

describe('survivalCountdownFor', () => {
  test('stays untimed in the opening loop regardless of difficulty', () => {
    assert.strictEqual(rules.survivalCountdownFor(0, 'extreme'), 0);
  });

  test('scales the base by difficulty', () => {
    // Loop 1 base is 60: easy x1, medium x1.5, hard x2.
    assert.strictEqual(rules.survivalCountdownFor(1, 'easy'), 60);
    assert.strictEqual(rules.survivalCountdownFor(1, 'medium'), 90);
    assert.strictEqual(rules.survivalCountdownFor(1, 'hard'), 120);
  });

  test('falls back to the base for an unknown difficulty', () => {
    assert.strictEqual(rules.survivalCountdownFor(1, 'nonsense'), 60);
  });
});

describe('survivalModifiersFor — escalation past the countdown floor', () => {
  test('applies no modifiers during the opening loop', () => {
    const mods = rules.survivalModifiersFor(0);
    assert.strictEqual(mods.ghost, false);
    assert.strictEqual(mods.trap, false);
    assert.strictEqual(mods.glitch, false);
  });

  test('introduces ghost flips first', () => {
    const mods = rules.survivalModifiersFor(2);
    assert.strictEqual(mods.ghost, true);
    assert.strictEqual(mods.trap, false);
  });

  test('adds trap cards after ghost', () => {
    const mods = rules.survivalModifiersFor(3);
    assert.strictEqual(mods.ghost, true);
    assert.strictEqual(mods.trap, true);
    assert.strictEqual(mods.glitch, false);
  });

  test('keeps escalating past wave 13, where the old config flat-lined', () => {
    // Wave 13 is loop 3 — the point the old loopCountdowns array clamped at.
    // Difficulty must still be rising beyond it, via modifiers.
    const atOldCap = rules.survivalModifiersFor(loopForWave(13));
    const later = rules.survivalModifiersFor(loopForWave(17));

    assert.strictEqual(atOldCap.glitch, false);
    assert.strictEqual(later.glitch, true, 'wave 17 must be harder than wave 13');
  });
});

describe('survivalLivesAfterWave', () => {
  test('returns a life for a flawless wave', () => {
    assert.strictEqual(rules.survivalLivesAfterWave(1, 0), 2);
  });

  test('leaves lives untouched when the wave had a mismatch', () => {
    assert.strictEqual(rules.survivalLivesAfterWave(2, 1), 2);
  });

  test('caps the reward so lives cannot grow without bound', () => {
    assert.strictEqual(rules.survivalLivesAfterWave(5, 0, 5), 5);
  });

  test('does not award a life at the cap even after a flawless wave', () => {
    const capped = rules.survivalLivesAfterWave(5, 0, 5);
    assert.ok(capped <= 5, `expected at most 5, got ${capped}`);
  });
});

describe('survivalScoreMultiplier', () => {
  test('is neutral with no streak, so existing best scores stay comparable', () => {
    assert.strictEqual(rules.survivalScoreMultiplier(0), 1);
  });

  test('grows with each consecutive clean wave', () => {
    assert.strictEqual(rules.survivalScoreMultiplier(1), 1.25);
    assert.strictEqual(rules.survivalScoreMultiplier(2), 1.5);
  });

  test('caps so a long run cannot inflate score without bound', () => {
    assert.strictEqual(rules.survivalScoreMultiplier(100), 2.5);
  });

  test('never returns less than neutral', () => {
    assert.ok(rules.survivalScoreMultiplier(0) >= 1);
  });
});

describe('survivalWaveScore', () => {
  test('matches the legacy formula when there is no streak', () => {
    // Legacy: pairs * wave * 10 + maxCombo * 5. Keeps old bestSurvivalScore honest.
    const legacy = 8 * 3 * 10 + 4 * 5;
    const scored = rules.survivalWaveScore({ pairs: 8, wave: 3, maxCombo: 4, waveStreak: 0 });

    assert.strictEqual(scored, legacy);
  });

  test('pays more for the same wave when a streak is running', () => {
    const noStreak = rules.survivalWaveScore({ pairs: 8, wave: 3, maxCombo: 4, waveStreak: 0 });
    const withStreak = rules.survivalWaveScore({ pairs: 8, wave: 3, maxCombo: 4, waveStreak: 2 });

    assert.ok(withStreak > noStreak, `${withStreak} should beat ${noStreak}`);
  });

  test('returns a whole number of points', () => {
    const scored = rules.survivalWaveScore({ pairs: 3, wave: 1, maxCombo: 1, waveStreak: 1 });
    assert.strictEqual(scored, Math.round(scored));
  });
});
