// ── Friend Challenges — pure logic, no DOM ──
// "Beat my score on THIS board." The whole challenge travels inside the link,
// so there is no backend and nothing to store: the code carries the board seed,
// the difficulty, and the result to beat.
//
// Kept free of DOM and browser globals so test/challenge.test.js can evaluate it
// in a vm sandbox. js/challenge.js holds the link handling and UI.

// Index into this table is what travels in the code, so the order is part of
// the wire format — append only, never reorder.
const CHALLENGE_DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme'];

// Bounds for decoding. A code comes from a URL somebody else wrote, so every
// field is checked before it reaches the game. These are generous enough to
// hold any real run and tight enough that a hostile link cannot render
// nonsense in the banner.
const CHALLENGE_LIMITS = {
  seed:    0xFFFFFFFF,
  moves:   9999,
  seconds: 86400,
};

const CHALLENGE_FIELDS = 4;

function encodeChallenge({ seed, difficulty, moves, seconds }) {
  return [
    seed.toString(36),
    CHALLENGE_DIFFICULTIES.indexOf(difficulty),
    moves.toString(36),
    seconds.toString(36),
  ].join('-');
}

// Base-36 integer, or null. Rejects anything Number() would quietly coerce —
// '' becomes 0 and '12abc' would parse under parseInt, so neither is used.
function decodeChallengeInt(part, max) {
  if (typeof part !== 'string' || !/^[0-9a-z]+$/.test(part)) return null;
  const value = Number.parseInt(part, 36);
  if (!Number.isInteger(value) || value < 0 || value > max) return null;
  return value;
}

// Returns {seed, difficulty, moves, seconds}, or null for anything malformed.
// Callers must treat null as "no challenge" and carry on with a normal game.
function decodeChallenge(code) {
  if (typeof code !== 'string' || code === '') return null;

  const parts = code.split('-');
  if (parts.length !== CHALLENGE_FIELDS) return null;

  const [rawSeed, rawDifficulty, rawMoves, rawSeconds] = parts;

  const seed = decodeChallengeInt(rawSeed, CHALLENGE_LIMITS.seed);
  const moves = decodeChallengeInt(rawMoves, CHALLENGE_LIMITS.moves);
  const seconds = decodeChallengeInt(rawSeconds, CHALLENGE_LIMITS.seconds);
  if (seed === null || moves === null || seconds === null) return null;

  // The difficulty index is decimal, not base 36, and must address the table.
  if (!/^[0-9]+$/.test(rawDifficulty)) return null;
  const difficulty = CHALLENGE_DIFFICULTIES[Number(rawDifficulty)];
  if (!difficulty) return null;

  return { seed, difficulty, moves, seconds };
}

// Namespaced so a challenge seed can never reproduce a daily or weekly board —
// createDailySeed() is shared, and a bare number could be used to preview a
// future daily.
function challengeSeedKey(seed) {
  return 'challenge:' + seed;
}

// Moves first, time as the tie-break: the board is identical for both players,
// so move count is the cleanest measure of who read it better. An exact tie
// leaves the challenger holding the title.
function challengeBeaten(mine, target) {
  if (mine.moves !== target.moves) return mine.moves < target.moves;
  return mine.seconds < target.seconds;
}
