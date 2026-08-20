// ── Survival Rules — pure logic, no DOM ──
// Kept free of DOM and browser globals so test/survival.test.js can evaluate it
// in a vm sandbox. survival.js holds the rendering and game-state side.

const SURVIVAL_RULES = {
  startLives: 3,
  maxLives: 5,           // lives can be earned back up to this
  firstTimedLoop: 1,     // loop 0 stays untimed so the opening waves ease players in
  countdownStart: 60,    // seconds at the first timed loop
  countdownStep: 15,     // seconds removed per later loop
  countdownFloor: 20,    // the decay eases here rather than stopping
  countdownLateStep: 2,  // gentler seconds-per-loop past the soft floor
  countdownHardFloor: 10,// the real limit; below this a wave is unwinnable
  livesTaperFrom: 5,     // loop at which the life allowance starts shrinking
  livesTaperEvery: 2,    // loops per point of allowance lost
  minLives: 2,           // deep runs stay punishing, not impossible
  streakStep: 0.25,      // score multiplier gained per consecutive clean wave
  streakMax: 2.5,
};

const SURVIVAL_DIFFICULTY_MULTIPLIER = { easy: 1, medium: 1.5, hard: 2, extreme: 2 };

// Base countdown seconds for a loop. 0 means untimed.
//
// Two gradients. The opening loops shed 15s each, which is steep enough to be
// felt. From the soft floor the decay eases to 2s per loop rather than
// stopping: a flat floor at 20s was what made every wave from 17 onward
// identical, since loop 4 is also where the last modifier switches on.
function survivalCountdownBase(loop) {
  if (loop < SURVIVAL_RULES.firstTimedLoop) return 0;

  const steps = loop - SURVIVAL_RULES.firstTimedLoop;
  const linear = SURVIVAL_RULES.countdownStart - steps * SURVIVAL_RULES.countdownStep;
  if (linear > SURVIVAL_RULES.countdownFloor) return linear;

  const stepsToFloor = Math.ceil(
    (SURVIVAL_RULES.countdownStart - SURVIVAL_RULES.countdownFloor) / SURVIVAL_RULES.countdownStep,
  );
  const lateSteps = steps - stepsToFloor;
  return Math.max(
    SURVIVAL_RULES.countdownHardFloor,
    SURVIVAL_RULES.countdownFloor - lateSteps * SURVIVAL_RULES.countdownLateStep,
  );
}

// How many lives a run may hold at a given loop. The allowance shrinks in deep
// loops: with a fixed cap, a player clearing waves flawlessly regenerates lives
// as fast as they can lose them and the run has no natural end.
function survivalMaxLivesFor(loop) {
  if (loop < SURVIVAL_RULES.livesTaperFrom) return SURVIVAL_RULES.maxLives;
  const lost = Math.floor(
    (loop - SURVIVAL_RULES.livesTaperFrom) / SURVIVAL_RULES.livesTaperEvery,
  ) + 1;
  return Math.max(SURVIVAL_RULES.minLives, SURVIVAL_RULES.maxLives - lost);
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
// The cap only ever withholds the reward. A player carrying more lives than a
// deep loop's allowance keeps them: clearing a wave perfectly must never cost
// a life, which a plain Math.min would do once the allowance tightens.
function survivalLivesAfterWave(lives, mismatches, maxLives = SURVIVAL_RULES.maxLives) {
  if (mismatches > 0) return lives;
  if (lives >= maxLives) return lives;
  return lives + 1;
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
