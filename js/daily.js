// ── Daily Challenge ──

// Seeded PRNG (mulberry32) — deterministic shuffle from a date string
function dailySeed(dateStr) {
  let h = 0;
  for (const char of dateStr) {
    const code = char.codePointAt(0);
    h = Math.trunc(Math.imul(31, h) + code);
  }
  return function () {
    h = Math.trunc(h);
    h = Math.trunc(h + 0x6D2B79F5);
    let t = Math.imul(h ^ h >>> 15, 1 | h);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function seededShuffle(array, rng) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Difficulty cycles by day-of-week (0=Sun)
const DAILY_DIFFICULTIES = ['easy', 'medium', 'hard', 'extreme', 'hard', 'medium', 'easy'];

function getTodayString() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function getDailyDifficulty() {
  return DAILY_DIFFICULTIES[new Date().getDay()];
}

function isDailyCompleted() {
  return playerStats.dailyLastDate === getTodayString();
}

function startDailyChallenge() {
  const today = getTodayString();
  const diffKey = getDailyDifficulty();
  const config = difficulties[diffKey];

  gameState.mode = 'daily';
  gameState.difficulty = diffKey;

  // Close modals
  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');

  // Reset game state
  gameState.flippedCards = [];
  gameState.matchedPairs = 0;
  gameState.totalPairs = config.pairs;
  gameState.maxMoves = config.maxMoves;
  gameState.moves = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.seconds = 0;
  gameState.countdown = 90;
  gameState.timerStarted = false;
  gameState.isLocked = false;
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical', 'blitz-mode', 'survival-mode');
  document.body.classList.add('daily-mode');
  document.getElementById('survival-hud').classList.add('hidden');
  document.getElementById('wave-clear-overlay').classList.add('hidden');
  document.getElementById('survival-over-overlay').classList.add('hidden');

  // Update HUD
  movesDisplay.childNodes[0].textContent = '0';
  movesLimit.textContent = '/' + config.maxMoves;
  timerDisplay.textContent = formatTime(90);
  winOverlay.classList.add('hidden');
  loseOverlay.classList.add('hidden');
  difficultyDisplay.textContent = 'DAILY';
  const dailyParticles = document.getElementById('daily-particles');
  if (dailyParticles) dailyParticles.innerHTML = '';

  const hudItem = movesDisplay.closest('.hud-item');
  hudItem.classList.remove('moves-warning');

  board.className = '';
  board.classList.add(config.gridClass);
  applySkin(playerStats.activeSkin);

  // Show daily HUD
  const dailyHud = document.getElementById('daily-hud');
  if (dailyHud) {
    dailyHud.classList.remove('hidden');
    document.getElementById('daily-date').textContent = today;
    document.getElementById('daily-diff').textContent = config.label;
    document.getElementById('daily-streak').textContent = playerStats.dailyStreak || 0;
    const freezes = playerStats.streakFreezes || 0;
    const freezeEl = document.getElementById('daily-freeze');
    const freezeItem = document.getElementById('daily-freeze-item');
    if (freezeEl) freezeEl.textContent = '❄'.repeat(Math.min(freezes, 3)) || '–';
    if (freezeItem) freezeItem.classList.toggle('hidden', freezes === 0);
  }

  // Seeded deck — same puzzle for everyone today
  const rng = dailySeed(today);
  const rewardChars = getUnlockedRewardCharacters();
  const allCharacters = [...characters, ...rewardChars];
  const selected = seededShuffle(allCharacters, rng).slice(0, config.pairs);
  const deck = seededShuffle([...selected, ...selected], rng);

  board.innerHTML = '';
  deck.forEach(char => board.appendChild(createCardElement(char)));

  updateRankHUD();
}

// ── Streak update helper ──
function _processDailyStreak(today) {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yStr = d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');

  let freezeUsed = false;
  if (playerStats.dailyLastDate === yStr) {
    playerStats.dailyStreak = (playerStats.dailyStreak || 0) + 1;
    if (playerStats.dailyStreak % 7 === 0) {
      playerStats.streakFreezes = Math.min((playerStats.streakFreezes || 0) + 1, 3);
    }
  } else if ((playerStats.streakFreezes || 0) > 0) {
    playerStats.streakFreezes--;
    playerStats.dailyStreak = (playerStats.dailyStreak || 0) + 1;
    freezeUsed = true;
  } else {
    playerStats.dailyStreak = 1;
  }
  playerStats.dailyLastDate = today;
  playerStats.dailyCompleted = (playerStats.dailyCompleted || 0) + 1;
  return freezeUsed;
}

// ── Best time update helper ──
function _saveDailyBestTime(today) {
  if (!playerStats.dailyBestTimes) playerStats.dailyBestTimes = {};
  const existing = playerStats.dailyBestTimes[today];
  if (!existing || gameState.seconds < existing.time) {
    playerStats.dailyBestTimes[today] = {
      time: gameState.seconds,
      difficulty: gameState.difficulty,
    };
  }
}

function winDailyChallenge() {
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');
  hideCombo();

  const today = getTodayString();
  const alreadyDone = isDailyCompleted();

  let freezeUsed = false;
  if (!alreadyDone) {
    freezeUsed = _processDailyStreak(today);
    _saveDailyBestTime(today);
  }

  // XP
  const streakBonus = alreadyDone ? 0 : (playerStats.dailyStreak || 1) * 5;
  const xpEarned = calculateXP(gameState.difficulty, gameState.moves, gameState.maxMoves, gameState.seconds, true, gameState.maxCombo) + streakBonus;

  const oldRank = getRankForXP(playerStats.xp);
  playerStats.xp += xpEarned;
  playerStats.gamesPlayed++;
  playerStats.gamesWon++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  const newRank = getRankForXP(playerStats.xp);
  playerStats.rank = newRank.name;
  saveStats(playerStats);

  // Show daily win overlay
  const overlay = document.getElementById('daily-win-overlay');
  if (!overlay) return;

  document.getElementById('daily-win-date').textContent = today;
  document.getElementById('daily-win-moves').textContent = gameState.moves;
  document.getElementById('daily-win-time').textContent = formatTime(gameState.seconds);
  document.getElementById('daily-win-streak').textContent = playerStats.dailyStreak || 1;
  document.getElementById('daily-win-xp').textContent = '+' + xpEarned + ' XP';
  if (streakBonus > 0) {
    document.getElementById('daily-win-streak-bonus').textContent = '(+' + streakBonus + ' streak bonus)';
  } else if (freezeUsed) {
    document.getElementById('daily-win-streak-bonus').textContent = '(❄ freeze used — streak saved)';
  } else {
    document.getElementById('daily-win-streak-bonus').textContent = alreadyDone ? '(already completed today)' : '';
  }

  SoundEngine.win();

  checkAchievements({
    won: true,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: false,
  });

  if (newRank.name === oldRank.name) {
    setTimeout(() => {
      overlay.classList.remove('hidden');
      spawnParticles();
    }, 600);
    updateRankHUD();
    return;
  }

  showRankUp(newRank.name, () => {
    overlay.classList.remove('hidden');
    spawnParticles();
  });
  updateRankHUD();
}

function exitDaily() {
  document.getElementById('daily-win-overlay').classList.add('hidden');
  document.getElementById('daily-hud').classList.add('hidden');
  document.body.classList.remove('daily-mode');
  gameState.mode = 'classic';
  clearInterval(gameState.timerInterval);
  rulesModal.showModal();
  updateDailyButton();
}

function retryDaily() {
  document.getElementById('daily-win-overlay').classList.add('hidden');
  startDailyChallenge();
}

function updateDailyButton() {
  const btn = document.getElementById('daily-btn');
  if (!btn) return;
  const badge = document.getElementById('daily-badge');
  const completed = isDailyCompleted();

  if (badge) {
    badge.classList.toggle('hidden', !completed);
  }

  const streakEl = document.getElementById('daily-btn-streak');
  if (streakEl) {
    const streak = playerStats.dailyStreak || 0;
    streakEl.textContent = streak > 0 ? streak + ' day streak' : 'No streak yet';
  }
}
