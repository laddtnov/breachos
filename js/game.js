// ── Game State ──
const gameState = {
  flippedCards: [],
  matchedPairs: 0,
  totalPairs: 8,
  moves: 0,
  maxMoves: 30,
  seconds: 0,
  countdown: 0,
  timerInterval: null,
  timerStarted: false,
  isLocked: false,
  difficulty: 'medium',
  mode: 'classic',
  combo: 0,
  maxCombo: 0,
  // Survival mode
  survivalWave: 0,
  survivalLives: 3,
  survivalScore: 0,
  survivalLoop: 0,
  // Gameplay modifiers
  ghostMode: false,       // cards flip back instantly on mismatch
  memoryPeek: false,      // all cards briefly shown at game start
  timewarpActive: false,  // timer is frozen during time warp
  timewarpCount: 0,       // #20 Time Lord: how many warps triggered this game
  isPaused: false,        // user-initiated pause (WCAG 2.2.1)
  trapCharId: null,       // character id of the trap pair (hard/extreme only)
  trapSprung: false,      // trap fires only once per game
  glitchFired: false,     // glitch event fires once per hard/extreme game
  glitchTimeout: null,    // setTimeout handle for glitch scheduling
};

// ── Idle Animation Timer ──
let idleTimer = null;

// ── Player Stats (loaded from localStorage) ──
let playerStats = loadStats();

// ── DOM References (populated after partials load via initDOMRefs) ──
let board, movesDisplay, movesLimit, timerDisplay;
let winOverlay, winMoves, winTime;
let loseOverlay, losePairs, loseTotal, loseMovesStat, loseSubtitle;
let rulesModal, difficultyDisplay, particles;
let rankDisplay, rankProgress, rankXP, skinModal;

// Column count per grid class — mirrors repeat() values in cards.css
const GRID_COLS = { 'grid-easy': 3, 'grid-medium': 4, 'grid-hard': 6, 'grid-extreme': 6 };

function initDOMRefs() {
  board = document.getElementById('game-board');

  // WCAG 2.1.1 — arrow-key navigation across the card grid
  board.addEventListener('keydown', e => {
    const dirs = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 0, ArrowUp: 0 };
    if (!(e.key in dirs)) return;
    const current = e.target.closest('.card');
    if (!current) return;
    e.preventDefault();
    const gridClass = [...board.classList].find(c => c.startsWith('grid-')) ?? 'grid-medium';
    const cols = GRID_COLS[gridClass] ?? 4;
    const allCards = [...board.querySelectorAll('.card')];
    const idx = allCards.indexOf(current);
    let delta;
    if (e.key === 'ArrowRight') delta = 1;
    else if (e.key === 'ArrowLeft') delta = -1;
    else if (e.key === 'ArrowDown') delta = cols;
    else delta = -cols;
    const next = allCards[idx + delta];
    if (next) next.focus();
  });
  movesDisplay = document.getElementById('moves-counter');
  movesLimit = document.getElementById('moves-limit');
  timerDisplay = document.getElementById('timer');
  winOverlay = document.getElementById('win-overlay');
  winMoves = document.getElementById('win-moves');
  winTime = document.getElementById('win-time');
  loseOverlay = document.getElementById('lose-overlay');
  losePairs = document.getElementById('lose-pairs');
  loseTotal = document.getElementById('lose-total');
  loseMovesStat = document.getElementById('lose-moves');
  loseSubtitle = document.querySelector('.lose-subtitle');
  rulesModal = document.getElementById('rules-modal');
  difficultyDisplay = document.getElementById('difficulty-display');
  particles = document.getElementById('win-particles');
  rankDisplay = document.getElementById('rank-display');
  rankProgress = document.getElementById('rank-bar'); // <progress> element — was #rank-progress fill div
  rankXP = document.getElementById('rank-xp');
  skinModal = document.getElementById('skin-modal');
}

// ── Shuffle (Fisher-Yates) ──
function secureRandomInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Create Card Element ──
function createCardElement(character) {
  const card = document.createElement('div');
  card.classList.add('card', character.color);
  card.dataset.character = character.id;
  card.dataset.name = character.name; // used for aria-label state updates

  // WCAG 2.1.1 + 4.1.2 — keyboard access and accessible name/role/value
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', 'Card face down');

  card.innerHTML = `
    <div class="card-inner">
      <div class="card-back"></div>
      <div class="card-front">
        <span class="card-symbol">${character.symbol}</span>
        <span class="card-name">${character.name}</span>
      </div>
    </div>
  `;

  card.addEventListener('click', () => handleCardClick(card));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick(card);
    }
  });
  return card;
}

// ── Handle Card Click ──
function handleCardClick(card) {
  if (
    gameState.isLocked ||
    card.classList.contains('flipped') ||
    card.classList.contains('matched')
  ) return;

  // Init audio on first interaction
  SoundEngine.init();
  resetIdleTimer();

  if (!gameState.timerStarted) {
    startTimer();
    gameState.timerStarted = true;
  }

  SoundEngine.flip();
  Haptics.flip();
  card.classList.add('flipped');
  card.setAttribute('aria-label', `${card.dataset.name} — face up`);
  gameState.flippedCards.push(card);

  if (gameState.flippedCards.length === 2) {
    gameState.moves++;
    movesDisplay.childNodes[0].textContent = gameState.moves;
    updateMovesWarning();
    checkMatch();
  }
}

// ── Moves Warning ──
function updateMovesWarning() {
  const remaining = gameState.maxMoves - gameState.moves;
  const hudItem = movesDisplay.closest('.hud-item');
  if (remaining <= Math.ceil(gameState.maxMoves * 0.2)) {
    hudItem.classList.add('moves-warning');
  } else {
    hudItem.classList.remove('moves-warning');
  }
}

// ── Trap Card Handler ──
function handleTrapCard(card1, card2) {
  gameState.trapSprung = true;
  gameState.trapCharId = null;
  gameState.combo = 0;
  hideCombo();
  gameState.moves++;
  movesDisplay.childNodes[0].textContent = gameState.moves;
  updateMovesWarning();
  card1.classList.add('trap-spring');
  card2.classList.add('trap-spring');
  SoundEngine.error();
  Haptics.error();
  showTrapFlash();
  setTimeout(() => {
    card1.classList.remove('flipped', 'trap-spring', 'trap-card');
    card2.classList.remove('flipped', 'trap-spring', 'trap-card');
    card1.setAttribute('aria-label', 'Card face down');
    card2.setAttribute('aria-label', 'Card face down');
    gameState.flippedCards = [];
    gameState.isLocked = false;
    if (gameState.mode !== 'survival' && gameState.moves >= gameState.maxMoves) loseGame();
  }, 1000);
}

// ── Trap card predicate — true when this pair should spring the trap ──
function isTrapCardHit(card) {
  return gameState.trapCharId !== null
    && !gameState.trapSprung
    && card.dataset.character === gameState.trapCharId;
}

// ── Time Warp condition ──
function shouldTriggerTimeWarp() {
  return gameState.combo >= 5
    && gameState.combo % 5 === 0
    && !gameState.timewarpActive
    && gameState.timerStarted;
}

// ── Mismatch Handler ──
function handleMismatch(card1, card2) {
  SoundEngine.error();
  Haptics.error();
  gameState.combo = 0;
  hideCombo();
  card1.classList.add('error');
  card2.classList.add('error');

  const flipBackDelay = gameState.ghostMode ? 150 : 1000;

  if (gameState.mode === 'survival') {
    gameState.survivalLives--;
    updateSurvivalHUD();
    if (gameState.survivalLives <= 0) {
      setTimeout(() => {
        card1.classList.remove('flipped', 'error');
        card2.classList.remove('flipped', 'error');
        card1.setAttribute('aria-label', 'Card face down');
        card2.setAttribute('aria-label', 'Card face down');
        gameState.flippedCards = [];
        gameState.isLocked = false;
        loseSurvival();
      }, flipBackDelay);
      return;
    }
  }

  setTimeout(() => {
    card1.classList.remove('flipped', 'error');
    card2.classList.remove('flipped', 'error');
    card1.setAttribute('aria-label', 'Card face down');
    card2.setAttribute('aria-label', 'Card face down');
    gameState.flippedCards = [];
    gameState.isLocked = false;
    if (gameState.mode !== 'survival' && gameState.moves >= gameState.maxMoves) loseGame();
  }, flipBackDelay);
}

// ── Check Match (cognitive complexity: 12) ──
function checkMatch() {
  gameState.isLocked = true;
  const [card1, card2] = gameState.flippedCards;

  if (card1.dataset.character === card2.dataset.character) {
    if (isTrapCardHit(card1)) { handleTrapCard(card1, card2); return; }

    Haptics.match();
    card1.classList.add('matched');
    card2.classList.add('matched');
    // WCAG 4.1.2 — update accessible name and state on match
    [card1, card2].forEach(c => {
      c.setAttribute('aria-label', `${c.dataset.name} — matched`);
      c.setAttribute('aria-disabled', 'true');
      c.setAttribute('tabindex', '-1');
    });
    gameState.matchedPairs++;
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    SoundEngine.comboMatch(gameState.combo);
    Haptics.combo(gameState.combo);
    showCombo(gameState.combo);

    if (shouldTriggerTimeWarp()) activateTimeWarp(3);

    gameState.flippedCards = [];
    gameState.isLocked = false;

    if (gameState.matchedPairs === gameState.totalPairs) { winGame(); return; }
  } else {
    handleMismatch(card1, card2);
    return;
  }

  if (gameState.mode !== 'survival' && gameState.moves >= gameState.maxMoves) loseGame();
}

// ── Time Warp ──
function activateTimeWarp(duration) {
  if (gameState.timewarpActive) return;
  gameState.timewarpActive = true;
  gameState.timewarpCount++; // #20 Time Lord achievement counter
  clearInterval(gameState.timerInterval);

  const flash = document.getElementById('timewarp-flash');
  if (flash) {
    flash.classList.remove('hidden', 'timewarp-active');
    requestAnimationFrame(() => requestAnimationFrame(() => flash.classList.add('timewarp-active')));
  }
  srAnnounce(`Time warp — timer paused for ${duration} seconds`);

  setTimeout(() => {
    gameState.timewarpActive = false;
    if (flash) flash.classList.add('hidden');
    if (gameState.timerStarted && gameState.matchedPairs < gameState.totalPairs) {
      resumeTimerTick();
    }
  }, duration * 1000);
}

function resumeTimerTick() {
  const isBlitz = gameState.mode === 'blitz';
  const config = isBlitz ? BLITZ_CONFIG[gameState.difficulty] : difficulties[gameState.difficulty];
  const isCountdown = !!config.countdown;

  gameState.timerInterval = setInterval(() => {
    if (isCountdown) {
      gameState.countdown--;
      gameState.seconds++;
      timerDisplay.textContent = formatTime(gameState.countdown);
      if (gameState.countdown <= 10 && gameState.countdown > 0) {
        SoundEngine.tick(true);
        document.body.classList.add('countdown-critical');
      } else if (gameState.countdown > 10) {
        SoundEngine.tick(false);
      }
      if (gameState.countdown <= 0) {
        loseGame(true);
        return;
      }
    } else {
      gameState.seconds++;
      timerDisplay.textContent = formatTime(gameState.seconds);
    }
  }, 1000);
}

// ── Trap Flash ──
function showTrapFlash() {
  const el = document.getElementById('trap-flash');
  if (!el) return;
  el.classList.remove('hidden');
  srAnnounce('Trap sprung!');
  setTimeout(() => el.classList.add('hidden'), 1500);
}

// ── Glitch Event (hard/extreme) ──
function triggerGlitchEvent() {
  if (gameState.glitchFired) return;
  if (!gameState.timerStarted) {
    // Game not started yet — reschedule once
    gameState.glitchTimeout = setTimeout(triggerGlitchEvent, 5000);
    return;
  }
  if (gameState.matchedPairs >= gameState.totalPairs - 1) return;
  gameState.glitchFired = true;

  // Flicker then swap
  document.body.classList.add('glitch-event');
  setTimeout(() => {
    const unmatched = [...board.querySelectorAll('.card:not(.matched):not(.flipped)')];
    if (unmatched.length >= 4) {
      const a = unmatched[secureRandomInt(unmatched.length)];
      let b;
      let attempts = 0;
      do { b = unmatched[secureRandomInt(unmatched.length)]; attempts++; }
      while (b === a && attempts < 10);
      if (b !== a) swapDOMNodes(a, b);
    }
    document.body.classList.remove('glitch-event');
  }, 450);
}

function swapDOMNodes(a, b) {
  const placeholder = document.createComment('swap');
  a.parentNode.insertBefore(placeholder, a);
  b.parentNode.insertBefore(a, b);
  placeholder.parentNode.insertBefore(b, placeholder);
  placeholder.remove();
}

// ── Idle Animation ──
function resetIdleTimer() {
  clearTimeout(idleTimer);
  board?.querySelectorAll('.card:not(.matched)').forEach(c => c.classList.remove('idle-pulse'));
  if (!gameState.timerStarted) return;
  idleTimer = setTimeout(() => {
    board?.querySelectorAll('.card:not(.matched):not(.flipped)').forEach(c => c.classList.add('idle-pulse'));
  }, 5000);
}

// ── Pause / Resume (WCAG 2.2.1 Timing Adjustable) ──

// Updates the pause button's icon, label text and aria-pressed in one place.
// Extracted to keep togglePause() cognitive complexity within Sonar limit.
function setPauseBtnState(isPaused) {
  const btn = document.getElementById('pause-btn');
  if (!btn) return;
  const icon = btn.querySelector('.pause-icon');
  const label = btn.querySelector('.pause-label');
  if (icon) icon.textContent = isPaused ? '▶' : '⏸';
  if (label) label.textContent = isPaused ? 'RESUME' : 'PAUSE';
  btn.setAttribute('aria-pressed', String(isPaused));
}

function togglePause() {
  // Only available during active countdown modes
  if (!gameState.timerStarted || !gameState.countdown) return;

  gameState.isPaused = !gameState.isPaused;

  if (gameState.isPaused) {
    clearInterval(gameState.timerInterval);
    gameState.isLocked = true;
    document.body.classList.add('game-paused');
    srAnnounce('Timer paused');
  } else {
    resumeTimerTick();
    gameState.isLocked = false;
    document.body.classList.remove('game-paused');
    srAnnounce('Timer resumed');
  }

  setPauseBtnState(gameState.isPaused);
}

function resetPauseState() {
  gameState.isPaused = false;
  document.body.classList.remove('game-paused');
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.classList.add('hidden');
  setPauseBtnState(false);
}

// ── Timer ──
function startTimer() {
  const isBlitz = gameState.mode === 'blitz';
  const config = isBlitz ? BLITZ_CONFIG[gameState.difficulty] : difficulties[gameState.difficulty];
  const isCountdown = !!config.countdown;

  if (isCountdown) {
    gameState.countdown = config.countdown;
    timerDisplay.textContent = formatTime(gameState.countdown);
    // WCAG 2.2.1 — reveal pause button for timed modes
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) pauseBtn.classList.remove('hidden');
  }

  gameState.timerInterval = setInterval(() => {
    if (isCountdown) {
      gameState.countdown--;
      gameState.seconds++;
      timerDisplay.textContent = formatTime(gameState.countdown);

      // Countdown tick sounds
      if (gameState.countdown <= 10 && gameState.countdown > 0) {
        SoundEngine.tick(true);
        document.body.classList.add('countdown-critical');
      } else if (gameState.countdown > 10) {
        SoundEngine.tick(false);
      }

      if (gameState.countdown <= 0) {
        loseGame(true); // time expired
        return;
      }
    } else {
      gameState.seconds++;
      timerDisplay.textContent = formatTime(gameState.seconds);
    }
  }, 1000);
}

function formatTime(totalSeconds) {
  const mins = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const secs = String(totalSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
}

// ── Win ──
function winGame() {
  // Capture glitch-event state BEFORE removing the class (#20 Glitch Hunter)
  const glitchActiveOnWin = document.body.classList.contains('glitch-event');
  clearInterval(gameState.timerInterval);
  clearTimeout(gameState.glitchTimeout);
  clearTimeout(idleTimer);
  resetPauseState();
  document.body.classList.remove('countdown-critical', 'glitch-event');
  board?.querySelectorAll('.card').forEach(c => c.classList.remove('idle-pulse'));

  // Survival mode: advance to next wave instead of showing win screen
  if (gameState.mode === 'survival') {
    winSurvivalWave();
    return;
  }

  // Daily challenge: custom win flow
  if (gameState.mode === 'daily') {
    winDailyChallenge();
    return;
  }

  hideCombo();
  const xpEarned = calculateXP(gameState.difficulty, gameState.moves, gameState.maxMoves, gameState.seconds, true, gameState.maxCombo);
  const oldRank = getRankForXP(playerStats.xp);
  playerStats.xp += xpEarned;
  playerStats.gamesPlayed++;
  playerStats.gamesWon++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);

  // Per-difficulty win tracking
  const diff = gameState.difficulty;
  if (!playerStats.winsPerDifficulty) playerStats.winsPerDifficulty = { easy: 0, medium: 0, hard: 0, extreme: 0 };
  playerStats.winsPerDifficulty[diff] = (playerStats.winsPerDifficulty[diff] || 0) + 1;

  // Blitz wins
  if (gameState.mode === 'blitz') {
    playerStats.blitzWins = (playerStats.blitzWins || 0) + 1;
  }

  // Perfect wins (no wrong flips — moves equals exactly totalPairs)
  if (gameState.moves === gameState.totalPairs) {
    playerStats.perfectWins = (playerStats.perfectWins || 0) + 1;
  }

  // Best time tracking
  if (!playerStats.bestTimes[diff] || gameState.seconds < playerStats.bestTimes[diff]) {
    playerStats.bestTimes[diff] = gameState.seconds;
  }

  const newRank = getRankForXP(playerStats.xp);
  playerStats.rank = newRank.name;
  saveStats(playerStats);

  winMoves.textContent = gameState.moves;
  winTime.textContent = formatTime(gameState.seconds);
  document.getElementById('win-combo').textContent = gameState.maxCombo;
  document.getElementById('win-xp').textContent = '+' + xpEarned + ' XP';

  SoundEngine.win();
  Haptics.win();

  // Check achievements
  checkAchievements({
    won: true,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: gameState.mode === 'blitz',
    countdown: gameState.countdown,
    // #20 — gameplay modifier achievements
    ghostMode: gameState.ghostMode,
    trapSprung: gameState.trapSprung,
    timewarpCount: gameState.timewarpCount,
    memoryPeek: gameState.memoryPeek,
    glitchActiveOnWin,
  });

  // Check rank up
  if (newRank.name === oldRank.name) {
    setTimeout(() => {
      winOverlay.classList.remove('hidden');
      spawnParticles();
      // WCAG 4.1.3 + 2.4.3 — announce and move focus to win overlay
      srAnnounce(`Mission complete! ${gameState.moves} moves, time ${winTime.textContent}.`);
      winOverlay.querySelector('button')?.focus();
    }, 600);
    updateRankHUD();
    return;
  }

  showRankUp(newRank.name, () => {
    winOverlay.classList.remove('hidden');
    spawnParticles();
    srAnnounce(`Mission complete! ${gameState.moves} moves, time ${winTime.textContent}.`);
    winOverlay.querySelector('button')?.focus();
  });

  updateRankHUD();
}

// ── Win Particles ──
function spawnParticles() {
  particles.innerHTML = '';
  const colors = ['#00f3ff', '#ff0055', '#9d00ff', '#00ff88', '#ffff00'];

  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    // Non-cryptographic randomness for UI color selection
    const color = colors[Math.floor(Math.random() * colors.length)]; // NOSONAR
    // Non-cryptographic randomness for UI positioning
    const left = Math.random() * 100; // NOSONAR
    // Non-cryptographic randomness for UI sizing
    const height = 8 + Math.random() * 20; // NOSONAR
    // Non-cryptographic randomness for UI timing
    const delay = Math.random() * 2; // NOSONAR
    // Non-cryptographic randomness for animation duration
    const duration = 1.5 + Math.random() * 2; // NOSONAR

    p.style.cssText = `
      left: ${left}%;
      top: -20px;
      height: ${height}px;
      background: ${color};
      box-shadow: 0 0 6px ${color};
      animation-delay: ${delay}s;
      animation-duration: ${duration}s;
    `;
    particles.appendChild(p);
  }
}

// ── Lose ──
function loseGame(timeExpired = false) {
  clearInterval(gameState.timerInterval);
  clearTimeout(gameState.glitchTimeout);
  clearTimeout(idleTimer);
  resetPauseState();
  gameState.isLocked = true;
  document.body.classList.remove('countdown-critical', 'glitch-event');
  board?.querySelectorAll('.card').forEach(c => c.classList.remove('idle-pulse'));

  // Survival mode: redirect to survival game over
  if (gameState.mode === 'survival') {
    loseSurvival();
    return;
  }

  // Daily mode: hide daily HUD on loss
  if (gameState.mode === 'daily') {
    document.getElementById('daily-hud').classList.add('hidden');
    document.body.classList.remove('daily-mode');
  }

  const xpEarned = calculateXP(gameState.difficulty, gameState.moves, gameState.maxMoves, gameState.seconds, false);
  playerStats.xp += xpEarned;
  playerStats.gamesPlayed++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  playerStats.rank = getRankForXP(playerStats.xp).name;
  saveStats(playerStats);

  losePairs.textContent = gameState.matchedPairs;
  loseTotal.textContent = gameState.totalPairs;
  loseMovesStat.textContent = gameState.moves;
  document.getElementById('lose-xp').textContent = '+' + xpEarned + ' XP';

  if (timeExpired) {
    loseSubtitle.textContent = 'SYSTEM BREACH \u2014 TIME EXPIRED';
  } else {
    loseSubtitle.textContent = 'SYSTEM COMPROMISED';
  }

  SoundEngine.lose();
  Haptics.lose();

  // Check achievements (some like GRINDER can unlock on loss)
  checkAchievements({
    won: false,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: gameState.mode === 'blitz',
  });

  setTimeout(() => {
    loseOverlay.classList.remove('hidden');
    // WCAG 4.1.3 + 2.4.3 — announce and move focus to lose overlay
    const subtitle = loseSubtitle.textContent;
    srAnnounce(`${subtitle}. ${gameState.matchedPairs} of ${gameState.totalPairs} pairs found.`);
    loseOverlay.querySelector('button')?.focus();
  }, 400);

  updateRankHUD();
}
