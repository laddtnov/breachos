// ── Survival Mode ──

function startSurvivalMode() {
  gameState.mode = 'survival';
  gameState.survivalWave = 1;
  gameState.survivalLives = SURVIVAL_CONFIG.startLives;
  gameState.survivalScore = 0;
  gameState.survivalLoop = 0;

  // Close modals
  rulesModal.classList.add('hidden');
  document.getElementById('back-to-game-btn').classList.add('hidden');

  document.body.classList.add('survival-mode');
  document.getElementById('survival-hud').classList.remove('hidden');

  initSurvivalWave();
}

function initSurvivalWave() {
  const waveIndex = (gameState.survivalWave - 1) % SURVIVAL_WAVES.length;
  const diffKey = SURVIVAL_WAVES[waveIndex];
  const config = difficulties[diffKey];
  gameState.survivalLoop = Math.floor((gameState.survivalWave - 1) / SURVIVAL_WAVES.length);

  // Determine countdown for this wave (loops add time pressure)
  const loopCountdowns = SURVIVAL_CONFIG.loopCountdowns;
  const index = Math.min(gameState.survivalLoop, loopCountdowns.length - 1);
  const countdownBase = loopCountdowns.at(index);
  // Scale countdown by difficulty within loop
  const countdownMultiplier = { easy: 1, medium: 1.5, hard: 2, extreme: 2 }[diffKey];
  const countdown = countdownBase > 0 ? Math.round(countdownBase * countdownMultiplier) : 0;

  gameState.difficulty = diffKey;
  gameState.flippedCards = [];
  gameState.matchedPairs = 0;
  gameState.totalPairs = config.pairs;
  gameState.maxMoves = 999; // No move limit in survival
  gameState.moves = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.seconds = 0;
  gameState.countdown = countdown;
  gameState.timerStarted = false;
  gameState.isLocked = false;
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');

  // Update HUD
  movesDisplay.childNodes[0].textContent = '0';
  movesLimit.textContent = '';
  timerDisplay.textContent = countdown ? formatTime(countdown) : '00:00';
  winOverlay.classList.add('hidden');
  loseOverlay.classList.add('hidden');
  difficultyDisplay.textContent = 'WAVE ' + gameState.survivalWave;
  particles.innerHTML = '';

  const hudItem = movesDisplay.closest('.hud-item');
  hudItem.classList.remove('moves-warning');

  board.className = '';
  board.classList.add(config.gridClass);
  applySkin(playerStats.activeSkin);

  // Build deck
  const rewardChars = getUnlockedRewardCharacters();
  const allCharacters = [...characters, ...rewardChars];
  const selected = shuffle(allCharacters).slice(0, config.pairs);
  const deck = shuffle([...selected, ...selected]);

  board.innerHTML = '';
  deck.forEach(char => board.appendChild(createCardElement(char)));

  updateSurvivalHUD();
  updateRankHUD();
}

function winSurvivalWave() {
  hideCombo();
  clearInterval(gameState.timerInterval);

  // Score: pairs * wave multiplier + time bonus
  const wavePoints = gameState.totalPairs * gameState.survivalWave * 10;
  const comboBonus = gameState.maxCombo * 5;
  gameState.survivalScore += wavePoints + comboBonus;

  // XP for clearing a wave
  const xpEarned = calculateXP(gameState.difficulty, gameState.moves, 999, gameState.seconds, true, gameState.maxCombo);
  playerStats.xp += xpEarned;
  playerStats.gamesWon++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  playerStats.rank = getRankForXP(playerStats.xp).name;
  saveStats(playerStats);

  SoundEngine.match();

  // Check achievements after each wave (wave_rider, unkillable can trigger mid-run)
  checkAchievements({
    won: true,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: false,
  });

  // Show wave clear overlay
  showWaveClear(gameState.survivalWave, wavePoints + comboBonus, () => {
    gameState.survivalWave++;
    initSurvivalWave();
  });

  updateRankHUD();
}

function loseSurvival() {
  clearInterval(gameState.timerInterval);
  gameState.isLocked = true;
  document.body.classList.remove('countdown-critical');

  const wave = gameState.survivalWave;
  const score = gameState.survivalScore;

  // Track best wave
  if (wave > (playerStats.bestWave || 0)) playerStats.bestWave = wave;
  if (score > (playerStats.bestSurvivalScore || 0)) playerStats.bestSurvivalScore = score;

  // Consolation XP
  const xpEarned = 5 + (wave * 3);
  playerStats.xp += xpEarned;
  playerStats.gamesPlayed++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  playerStats.rank = getRankForXP(playerStats.xp).name;
  saveStats(playerStats);

  SoundEngine.lose();

  // Check achievements on survival loss too
  checkAchievements({
    won: false,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: false,
  });

  // Show survival game over
  showSurvivalGameOver(wave, score, xpEarned);
  updateRankHUD();
}

function updateSurvivalHUD() {
  const livesEl = document.getElementById('survival-lives');
  const waveEl = document.getElementById('survival-wave');
  const scoreEl = document.getElementById('survival-score');
  if (livesEl) {
    livesEl.innerHTML = '';
    for (let i = 0; i < SURVIVAL_CONFIG.startLives; i++) {
      const heart = document.createElement('span');
      heart.classList.add('survival-heart');
      if (i >= gameState.survivalLives) heart.classList.add('lost');
      heart.textContent = '\u2665';
      livesEl.appendChild(heart);
    }
  }
  if (waveEl) waveEl.textContent = gameState.survivalWave;
  if (scoreEl) scoreEl.textContent = gameState.survivalScore;
}

function showWaveClear(wave, points, callback) {
  const overlay = document.getElementById('wave-clear-overlay');
  if (!overlay) return callback();

  document.getElementById('wave-clear-num').textContent = wave;
  document.getElementById('wave-clear-points').textContent = '+' + points + ' PTS';

  const nextWaveIndex = wave % SURVIVAL_WAVES.length;
  const nextDiff = SURVIVAL_WAVES[nextWaveIndex];
  document.getElementById('wave-clear-next').textContent = 'NEXT: ' + difficulties[nextDiff].label;

  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
    callback();
  }, 2000);
}

function showSurvivalGameOver(wave, score, xpEarned) {
  const overlay = document.getElementById('survival-over-overlay');
  if (!overlay) return;

  document.getElementById('survival-over-wave').textContent = wave;
  document.getElementById('survival-over-score').textContent = score;
  document.getElementById('survival-over-best').textContent = playerStats.bestWave || wave;
  document.getElementById('survival-over-xp').textContent = '+' + xpEarned + ' XP';

  document.body.classList.remove('survival-mode');
  document.getElementById('survival-hud').classList.add('hidden');

  setTimeout(() => {
    overlay.classList.remove('hidden');
    // WCAG 4.1.3 + 2.4.3 — announce result and move focus into overlay
    srAnnounce(`Terminated. Wave ${wave} reached, score ${score}.`);
    overlay.querySelector('button')?.focus();
  }, 400);
}

function retrySurvival() {
  document.getElementById('survival-over-overlay').classList.add('hidden');
  startSurvivalMode();
}

function exitSurvival() {
  document.getElementById('survival-over-overlay').classList.add('hidden');
  document.getElementById('wave-clear-overlay').classList.add('hidden');
  document.body.classList.remove('survival-mode');
  document.getElementById('survival-hud').classList.add('hidden');
  gameState.mode = 'classic';
  clearInterval(gameState.timerInterval);
  rulesModal.classList.remove('hidden');
}
