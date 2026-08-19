// ── Survival Rules — pure logic, no DOM ──
// Kept free of DOM and browser globals so test/survival.test.js can evaluate it
// in a vm sandbox. survival.js holds the rendering and game-state side.

const SURVIVAL_RULES = {
  startLives: 3,
  maxLives: 5,          // lives can be earned back up to this
  firstTimedLoop: 1,    // loop 0 stays untimed so the opening waves ease players in
  countdownStart: 60,   // seconds at the first timed loop
  countdownStep: 15,    // seconds removed per later loop
  countdownFloor: 20,   // never tighter than this — modifiers escalate past it
  streakStep: 0.25,     // score multiplier gained per consecutive clean wave
  streakMax: 2.5,
};

const SURVIVAL_DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2, extreme: 2 };

// Base countdown seconds for a loop. 0 means untimed.
// Replaces the old fixed SURVIVAL_CONFIG.loopCountdowns array, which clamped at
// index 3 and left every wave from 13 onward identical.
function survivalCountdownBase(loop) {
  if (loop < SURVIVAL_RULES.firstTimedLoop) return 0;
  const steps = loop - SURVIVAL_RULES.firstTimedLoop;
  const decayed = SURVIVAL_RULES.countdownStart - steps * SURVIVAL_RULES.countdownStep;
  return Math.max(SURVIVAL_RULES.countdownFloor, decayed);
}

function survivalCountdownFor(loop, difficulty) {
  const base = survivalCountdownBase(loop);
  if (base === 0) return 0;
  const multiplier = SURVIVAL_DIFFICULTY_MULTIPLIER[difficulty] ?? 1;
  return Math.round(base * multiplier);
}

// Once the countdown reaches its floor, difficulty keeps climbing through the
// gameplay modifiers that otherwise only appear in Hard/Extreme classic play.
function survivalModifiersFor(loop) {
  return {
    ghost:  loop >= 2,
    trap:   loop >= 3,
    glitch: loop >= 4,
  };
}

// A flawless wave (no mismatches) returns one life, capped — the comeback path.
function survivalLivesAfterWave(lives, mismatches, maxLives = SURVIVAL_RULES.maxLives) {
  if (mismatches > 0) return lives;
  return Math.min(lives + 1, maxLives);
}

// Streak multiplier: the risk/reward lever. Grows while waves stay clean and
// resets on life loss, so score reflects how well you played, not just how long
// you survived. Neutral at zero, keeping legacy bestSurvivalScore comparable.
function survivalScoreMultiplier(waveStreak) {
  const multiplier = 1 + waveStreak * SURVIVAL_RULES.streakStep;
  return Math.min(multiplier, SURVIVAL_RULES.streakMax);
}

function survivalWaveScore({ pairs, wave, maxCombo, waveStreak }) {
  const base = pairs * wave * 10 + maxCombo * 5;
  return Math.round(base * survivalScoreMultiplier(waveStreak));
}
