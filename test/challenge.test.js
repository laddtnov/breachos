// Pure-logic tests for Friend Challenges.
// js/challenge-rules.js is DOM-free so it can be evaluated in a vm sandbox.
//
// The decoder's input arrives from a URL somebody else wrote, so most of these
// tests are about refusing malformed or hostile codes rather than happy paths.

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadGlobals(relPath) {
  const src = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
  const sandbox = { console, Math, Date, JSON, String, Number, Array, Object, isFinite };
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

const c = loadGlobals('js/challenge-rules.js');

const SAMPLE = { seed: 123456, difficulty: 'medium', moves: 24, seconds: 47 };

describe('encodeChallenge / decodeChallenge', () => {
  test('round-trips a challenge unchanged', () => {
    const decoded = c.decodeChallenge(c.encodeChallenge(SAMPLE));

    assert.deepStrictEqual({ ...decoded }, SAMPLE);
  });

  test('round-trips every difficulty the game offers', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'extreme']) {
      const decoded = c.decodeChallenge(c.encodeChallenge({ ...SAMPLE, difficulty }));

      assert.strictEqual(decoded.difficulty, difficulty);
    }
  });

  test('produces a code short enough to sit in a shared link', () => {
    // Long opaque codes get mangled by chat clients that wrap or truncate.
    assert.ok(c.encodeChallenge(SAMPLE).length <= 24);
  });

  test('produces a URL-safe code', () => {
    const code = c.encodeChallenge({ seed: 4294967295, difficulty: 'extreme', moves: 999, seconds: 3599 });

    assert.match(code, /^[A-Za-z0-9_-]+$/);
  });

  test('round-trips a flawless run with zero-ish values', () => {
    const perfect = { seed: 0, difficulty: 'easy', moves: 3, seconds: 0 };

    assert.deepStrictEqual({ ...c.decodeChallenge(c.encodeChallenge(perfect)) }, perfect);
  });
});

describe('decodeChallenge — rejecting bad input', () => {
  test('rejects an empty code', () => {
    assert.strictEqual(c.decodeChallenge(''), null);
  });

  test('rejects a missing code', () => {
    assert.strictEqual(c.decodeChallenge(null), null);
    assert.strictEqual(c.decodeChallenge(undefined), null);
  });

  test('rejects a non-string code', () => {
    assert.strictEqual(c.decodeChallenge(42), null);
    assert.strictEqual(c.decodeChallenge({}), null);
  });

  test('rejects a code with too few fields', () => {
    assert.strictEqual(c.decodeChallenge('abc-1-2'), null);
  });

  test('rejects a code with too many fields', () => {
    assert.strictEqual(c.decodeChallenge('abc-1-2-3-4'), null);
  });

  test('rejects an unknown difficulty index', () => {
    // The index addresses a fixed table; out of range must not yield undefined.
    assert.strictEqual(c.decodeChallenge('zz-9-o-13'), null);
  });

  test('rejects non-numeric fields rather than yielding NaN', () => {
    assert.strictEqual(c.decodeChallenge('zz-1-!!-13'), null);
  });

  test('rejects a negative value, which shows up as an extra empty field', () => {
    // '-' is the field separator, so a negative number cannot survive encoding
    // in the first place — it splits into five parts and fails the arity check.
    assert.strictEqual('zz-1--5-13'.split('-').length, 5);
    assert.strictEqual(c.decodeChallenge('zz-1--5-13'), null);
  });

  test('rejects absurd values that no real run could produce', () => {
    // A hostile link should not be able to display a nonsense target.
    assert.strictEqual(c.decodeChallenge(c.encodeChallenge({ ...SAMPLE, moves: 10 ** 9 })), null);
  });

  test('rejects a code carrying script-ish text', () => {
    assert.strictEqual(c.decodeChallenge('<script>alert(1)</script>'), null);
  });
});

describe('challengeBeaten', () => {
  test('counts fewer moves as a win', () => {
    assert.strictEqual(c.challengeBeaten({ moves: 20, seconds: 60 }, { moves: 24, seconds: 47 }), true);
  });

  test('counts more moves as a loss even when faster', () => {
    // Moves are the primary metric: the board is identical, so move count is
    // the cleanest measure of who read it better.
    assert.strictEqual(c.challengeBeaten({ moves: 30, seconds: 10 }, { moves: 24, seconds: 47 }), false);
  });

  test('breaks a move tie on time', () => {
    assert.strictEqual(c.challengeBeaten({ moves: 24, seconds: 40 }, { moves: 24, seconds: 47 }), true);
    assert.strictEqual(c.challengeBeaten({ moves: 24, seconds: 50 }, { moves: 24, seconds: 47 }), false);
  });

  test('treats an exact tie as not beaten, so the challenger keeps the title', () => {
    assert.strictEqual(c.challengeBeaten({ moves: 24, seconds: 47 }, { moves: 24, seconds: 47 }), false);
  });
});

describe('challengeSeedKey', () => {
  test('namespaces the seed so it cannot collide with a daily board', () => {
    // createDailySeed is shared; an unprefixed number could reproduce a daily
    // board and let someone preview it early.
    assert.notStrictEqual(c.challengeSeedKey(20260820), '20260820');
  });

  test('gives the same key for the same seed', () => {
    assert.strictEqual(c.challengeSeedKey(777), c.challengeSeedKey(777));
  });

  test('gives different keys for different seeds', () => {
    assert.notStrictEqual(c.challengeSeedKey(1), c.challengeSeedKey(2));
  });
});
