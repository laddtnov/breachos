// ── Survival Mode ──

function startSurvivalMode() {
  gameState.mode = 'survival';
  gameState.survivalWave = 1;
  gameState.survivalLives = SURVIVAL_START_LIVES;
  gameState.survivalScore = 0;
  gameState.survivalLoop = 0;
  gameState.survivalStreak = 0;
  gameState.survivalWaveMismatches = 0;

  // Close modals
  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');

  initSurvivalWave();
}

function initSurvivalWave() {
  const waveIndex = (gameState.survivalWave - 1) % SURVIVAL_WAVES.length;
  const diffKey = SURVIVAL_WAVES[waveIndex];
  const config = difficulties[diffKey];
  gameState.survivalLoop = Math.floor((gameState.survivalWave - 1) / SURVIVAL_WAVES.length);

  // Countdown decays toward a floor instead of clamping at a fixed array index,
  // so pressure keeps rising past wave 13. See js/survival-rules.js.
  const countdown = survivalCountdownFor(gameState.survivalLoop, diffKey);
  const modifiers = survivalModifiersFor(gameState.survivalLoop);

  // Flawless-wave tracking for the life award.
  gameState.survivalWaveMismatches = 0;

  gameState.difficulty = diffKey;
  resetRoundState({ pairs: config.pairs, maxMoves: 999, countdown }); // no move limit in survival
  clearModeChrome();
  document.body.classList.add('survival-mode');
  document.getElementById('survival-hud').classList.remove('hidden');
  resetHud({ label: 'WAVE ' + gameState.survivalWave, moveLimitText: '', countdown });
  particles.innerHTML = '';

  const selected = buildBoard({ pairs: config.pairs, gridClass: config.gridClass });

  // ── Loop modifiers — how survival keeps escalating once the countdown floors ──
  gameState.ghostMode = modifiers.ghost;

  if (modifiers.trap) {
    gameState.trapCharId = selected[secureRandomInt(selected.length)].id;
    board.querySelectorAll(`[data-character="${gameState.trapCharId}"]`)
      .forEach(c => c.classList.add('trap-card'));
  }
  if (modifiers.glitch) scheduleGlitchEvent();

  updateSurvivalHUD();
  updateRankHUD();
}

function winSurvivalWave() {
  hideCombo();
  clearInterval(gameState.timerInterval);

  // A flawless wave extends the streak and returns a life; any mismatch during
  // the wave has already reset the streak in handleMismatch().
  const flawless = gameState.survivalWaveMismatches === 0;
  if (flawless) {
    gameState.survivalStreak = (gameState.survivalStreak || 0) + 1;
    gameState.survivalLives = survivalLivesAfterWave(gameState.survivalLives, 0);
    // Re-render immediately: the wave-clear overlay announces the restored life,
    // so the heart count must not still read the pre-award value behind it.
    updateSurvivalHUD();
  }

  // Score scales with the running streak, so it reflects how cleanly the run was
  // played. Neutral at streak 0, which keeps old bestSurvivalScore comparable.
  const wavePoints = survivalWaveScore({
    pairs: gameState.totalPairs,
    wave: gameState.survivalWave,
    maxCombo: gameState.maxCombo,
    waveStreak: gameState.survivalStreak || 0,
  });
  gameState.survivalScore += wavePoints;

  // XP for clearing a wave
  const xpEarned = calculateXP(gameState.difficulty, gameState.moves, 999, gameState.seconds, true, gameState.maxCombo);
  playerStats.xp += xpEarned;
  // Each cleared wave counts as both a play and a win. gamesPlayed was missing
  // here while gamesWon advanced per wave, so a multi-wave run pushed the win
  // rate permanently above 100%. The run-ending loss adds one more play in
  // loseSurvival(), so a run always finishes below 100%.
  playerStats.gamesPlayed++;
  playerStats.gamesWon++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  playerStats.rank = getRankForXP(playerStats.xp).name;
  saveStats(playerStats);
  updateQuestProgress({ wave: gameState.survivalWave });

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
  showWaveClear(gameState.survivalWave, wavePoints, () => {
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
    // Grows past startLives so an earned 4th or 5th heart is actually visible.
    const slots = Math.max(SURVIVAL_START_LIVES, gameState.survivalLives);
    for (let i = 0; i < slots; i++) {
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

  // Surface the streak multiplier and any earned life, so the risk/reward lever
  // is legible rather than an invisible number.
  const streak = gameState.survivalStreak || 0;
  const multiplier = survivalScoreMultiplier(streak);
  const pointsEl = document.getElementById('wave-clear-points');
  pointsEl.textContent = multiplier > 1
    ? `+${points} PTS  (${multiplier}× STREAK)`
    : '+' + points + ' PTS';

  const bonusEl = document.getElementById('wave-clear-bonus');
  if (bonusEl) {
    const earnedLife = gameState.survivalWaveMismatches === 0;
    bonusEl.textContent = earnedLife ? '♥ FLAWLESS — LIFE RESTORED' : '';
    bonusEl.classList.toggle('hidden', !earnedLife);
  }

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
  rulesModal.showModal();
}
