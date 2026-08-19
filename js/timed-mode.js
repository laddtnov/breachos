// ── Timed Mode — pure config resolution, no DOM ──
// Kept free of DOM and browser globals so test/timed-mode tests can evaluate it
// in a vm sandbox.
//
// Timed is the third clocked mode and differs from Blitz in one specific way:
// Blitz scales its countdown per difficulty, Timed gives every difficulty the
// same fixed clock. A bigger board is therefore genuinely harder rather than
// merely allotted more time.

// One clock for every board size.
function timedCountdown() {
  return 120;
}

function isTimedMode(mode) {
  return mode === 'timed';
}

// Returns the per-mode overrides to layer over the difficulty defaults, or null
// when the mode has no overrides and the plain difficulty config should stand.
// Survival and daily build their boards themselves and must return null here.
function modeOverrides(mode, difficulty, blitzConfig) {
  if (mode === 'blitz') return blitzConfig[difficulty] ?? null;
  if (isTimedMode(mode)) return { countdown: timedCountdown(), maxMoves: 999 };
  return null;
}

// Best time is the lower of the two. A null/undefined `seconds` means the run
// did not finish, so it can never set a record.
function bestTimedTime(existing, seconds) {
  if (seconds === null || seconds === undefined) return existing ?? null;
  if (existing === null || existing === undefined) return seconds;
  return Math.min(existing, seconds);
}
