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
};

// ── Player Stats (loaded from localStorage) ──
let playerStats = loadStats();

// ── DOM References (populated after partials load via initDOMRefs) ──
let board, movesDisplay, movesLimit, timerDisplay;
let winOverlay, winMoves, winTime;
let loseOverlay, losePairs, loseTotal, loseMovesStat, loseSubtitle;
let rulesModal, difficultyDisplay, particles;
let rankDisplay, rankProgress, rankXP, skinModal;

function initDOMRefs() {
  board = document.getElementById('game-board');
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
  rankProgress = document.getElementById('rank-progress');
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

  if (!gameState.timerStarted) {
    startTimer();
    gameState.timerStarted = true;
  }

  SoundEngine.flip();
  Haptics.flip();
  card.classList.add('flipped');
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

// ── Check Match ──
function checkMatch() {
  gameState.isLocked = true;
  const [card1, card2] = gameState.flippedCards;

  if (card1.dataset.character === card2.dataset.character) {
    SoundEngine.match();
    Haptics.match();
    card1.classList.add('matched');
    card2.classList.add('matched');
    gameState.matchedPairs++;
    gameState.combo++;
    if (gameState.combo > gameState.maxCombo) gameState.maxCombo = gameState.combo;
    Haptics.combo(gameState.combo);
    showCombo(gameState.combo);
    gameState.flippedCards = [];
    gameState.isLocked = false;

    if (gameState.matchedPairs === gameState.totalPairs) {
      winGame();
      return;
    }
  } else {
    SoundEngine.error();
    Haptics.error();
    gameState.combo = 0;
    hideCombo();
    card1.classList.add('error');
    card2.classList.add('error');

    // Survival mode: lose a life on mismatch
    if (gameState.mode === 'survival') {
      gameState.survivalLives--;
      updateSurvivalHUD();
      if (gameState.survivalLives <= 0) {
        setTimeout(() => {
          card1.classList.remove('flipped', 'error');
          card2.classList.remove('flipped', 'error');
          gameState.flippedCards = [];
          gameState.isLocked = false;
          loseSurvival();
        }, 1000);
        return;
      }
    }

    setTimeout(() => {
      card1.classList.remove('flipped', 'error');
      card2.classList.remove('flipped', 'error');
      gameState.flippedCards = [];
      gameState.isLocked = false;

      if (gameState.mode !== 'survival' && gameState.moves >= gameState.maxMoves) {
        loseGame();
      }
    }, 1000);
    return;
  }

  if (gameState.mode !== 'survival' && gameState.moves >= gameState.maxMoves) {
    loseGame();
  }
}

// ── Timer ──
function startTimer() {
  const isBlitz = gameState.mode === 'blitz';
  const config = isBlitz ? BLITZ_CONFIG[gameState.difficulty] : difficulties[gameState.difficulty];
  const isCountdown = !!config.countdown;

  if (isCountdown) {
    gameState.countdown = config.countdown;
    timerDisplay.textContent = formatTime(gameState.countdown);
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
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');

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
  });

  // Check rank up
  if (newRank.name === oldRank.name) {
    setTimeout(() => {
      winOverlay.classList.remove('hidden');
      spawnParticles();
    }, 600);
    updateRankHUD();
    return;
  }

  showRankUp(newRank.name, () => {
    winOverlay.classList.remove('hidden');
    spawnParticles();
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
  gameState.isLocked = true;
  document.body.classList.remove('countdown-critical');

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
  }, 400);

  updateRankHUD();
}
