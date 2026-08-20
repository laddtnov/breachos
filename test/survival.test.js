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

  test('eases the decay at the soft floor instead of stopping there', () => {
    // The linear decay would put loop 4 at 15s. It lands on the 20s soft floor
    // instead — but unlike before, that is a change of gradient, not the end.
    assert.strictEqual(rules.survivalCountdownBase(4), 20);
  });

  test('keeps tightening past the soft floor, where waves used to flat-line', () => {
    // This is the wave-17 plateau: loop 4 onward was 20s forever.
    assert.ok(
      rules.survivalCountdownBase(5) < rules.survivalCountdownBase(4),
      'loop 5 must be tighter than loop 4',
    );
  });

  test('settles on a hard floor rather than reaching an impossible zero', () => {
    const deep = rules.survivalCountdownBase(50);

    assert.ok(deep > 0, 'a deep loop must still allow some time');
    assert.strictEqual(rules.survivalCountdownBase(99), deep, 'the hard floor must hold');
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

  test('withholds the reward at a tightened cap but never confiscates a life', () => {
    // Deep loops lower the cap. A player already above it keeps what they have
    // — playing flawlessly must never cost a life.
    assert.strictEqual(rules.survivalLivesAfterWave(5, 0, 3), 5);
  });
});

describe('survivalMaxLivesFor — the deep-run life economy', () => {
  test('leaves the early loops at the full allowance', () => {
    assert.strictEqual(rules.survivalMaxLivesFor(0), 5);
    assert.strictEqual(rules.survivalMaxLivesFor(4), 5);
  });

  test('tightens the allowance once runs get deep', () => {
    // Without this a flawless player regenerates lives indefinitely and the run
    // has no natural end.
    assert.ok(rules.survivalMaxLivesFor(9) < rules.survivalMaxLivesFor(4));
  });

  test('never falls to zero, so a deep run is punishing rather than unplayable', () => {
    for (let loop = 0; loop <= 99; loop++) {
      assert.ok(rules.survivalMaxLivesFor(loop) >= 2, `loop ${loop} left too few lives`);
    }
  });

  test('never increases as the run goes deeper', () => {
    for (let loop = 0; loop < 40; loop++) {
      assert.ok(
        rules.survivalMaxLivesFor(loop + 1) <= rules.survivalMaxLivesFor(loop),
        `loop ${loop + 1} was more forgiving than loop ${loop}`,
      );
    }
  });
});

describe('no two consecutive loops play identically', () => {
  // The regression guard for the plateau itself. Whatever the individual dials
  // do, consecutive loops in the mid-run must differ in something the player
  // can feel — otherwise waves stop escalating again.
  const fingerprint = loop => JSON.stringify([
    rules.survivalCountdownBase(loop),
    rules.survivalModifiersFor(loop),
    rules.survivalMaxLivesFor(loop),
  ]);

  test('wave 17 does not play the same as wave 13', () => {
    assert.notStrictEqual(fingerprint(loopForWave(13)), fingerprint(loopForWave(17)));
  });

  test('wave 33 does not play the same as wave 17', () => {
    // The old rules made these two waves indistinguishable.
    assert.notStrictEqual(fingerprint(loopForWave(17)), fingerprint(loopForWave(33)));
  });

  test('escalates on every loop from the first timed one to loop 9', () => {
    for (let loop = 1; loop < 9; loop++) {
      assert.notStrictEqual(
        fingerprint(loop), fingerprint(loop + 1),
        `loop ${loop} and loop ${loop + 1} play identically`,
      );
    }
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
