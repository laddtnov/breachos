// ── Shared board setup ──
// initGame, initSurvivalWave, startDailyChallenge and startWeeklyChallenge each
// rebuilt the same board from scratch. They had drifted: every one cleared a
// different subset of the other modes' body classes and overlays, so switching
// modes could leave stale chrome on screen, and daily never reset the trap card.
// These helpers are the shared part; each mode keeps only what is genuinely
// specific to it.

const MODE_BODY_CLASSES = ['blitz-mode', 'survival-mode', 'daily-mode', 'weekly-mode'];

const MODE_CHROME_IDS = [
  'survival-hud', 'daily-hud', 'weekly-hud',
  'wave-clear-overlay', 'survival-over-overlay',
  'daily-win-overlay', 'weekly-win-overlay',
  'challenge-banner',
];

// Clear every mode's body class and hide every mode's HUD and overlays, so a
// board never inherits chrome from the mode played before it.
function clearModeChrome() {
  document.body.classList.remove('countdown-critical', ...MODE_BODY_CLASSES);
  for (const id of MODE_CHROME_IDS) {
    document.getElementById(id)?.classList.add('hidden');
  }
  winOverlay?.classList.add('hidden');
  loseOverlay?.classList.add('hidden');
  // Leaving a mode ends any challenge with it. startChallengeGame() sets this
  // again immediately after calling here.
  gameState.challenge = null;
}

// Per-round counters shared by every mode. Trap and glitch state is included:
// daily used to skip it, so a trap assigned in a Hard classic game could still
// be armed on the daily board.
function resetRoundState({ pairs, maxMoves, countdown }) {
  gameState.flippedCards = [];
  gameState.matchedPairs = 0;
  gameState.totalPairs = pairs;
  gameState.maxMoves = maxMoves;
  gameState.moves = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.seconds = 0;
  gameState.countdown = countdown;
  gameState.timerStarted = false;
  gameState.isLocked = false;
  gameState.trapCharId = null;
  gameState.trapSprung = false;
  gameState.glitchFired = false;
  clearTimeout(gameState.glitchTimeout);
  gameState.glitchTimeout = null;
  clearInterval(gameState.timerInterval);
}

// Reset the shared HUD readouts. `label` is the mode's own text (BLITZ HARD,
// WAVE 3, DAILY, ...); `moveLimitText` is '' for modes with no move limit.
function resetHud({ label, moveLimitText, countdown }) {
  movesDisplay.childNodes[0].textContent = '0';
  movesLimit.textContent = moveLimitText;
  timerDisplay.textContent = countdown ? formatTime(countdown) : '00:00';
  difficultyDisplay.textContent = label;
  movesDisplay.closest('.hud-item').classList.remove('moves-warning');
}

// Pick the pairs and lay out the cards. Pass an `rng` for a seeded board (daily,
// weekly); omit it for a randomly shuffled one. Returns the selected characters
// so callers can arm a trap on one of them.
function buildBoard({ pairs, gridClass, rng }) {
  const pool = [...characters, ...getUnlockedRewardCharacters()];
  const mix = rng ? arr => seededShuffle(arr, rng) : shuffle;

  const selected = mix(pool).slice(0, pairs);
  const deck = mix([...selected, ...selected]);

  board.className = '';
  board.classList.add(gridClass);
  applySkin(playerStats.activeSkin);

  board.innerHTML = '';
  deck.forEach(char => board.appendChild(createCardElement(char)));

  return selected;
}
