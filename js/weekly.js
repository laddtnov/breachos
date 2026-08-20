// ── Weekly Challenge ──
// Seeded board that resets every Monday. Reuses createDailySeed (data.js) and
// seededShuffle (daily.js) so the board is identical for every player all week.

const WEEKLY_DIFFICULTY = 'hard';
const WEEKLY_COUNTDOWN = 120;
const WEEKLY_XP_MULTIPLIER = 2;
const WEEKLY_STREAK_XP = 25;

function _toDateString(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

// Monday of the given date's week, as YYYY-MM-DD — the seed for that week's board.
function getWeekStartString(now = new Date()) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Mon=0 … Sun=6
  return _toDateString(d);
}

// Days until the next Monday. Returns 7 on a Monday so the counter never reads 0.
function daysUntilWeeklyReset(now = new Date()) {
  return 7 - ((now.getDay() + 6) % 7);
}

// Streak continues only when the immediately preceding week was completed.
function computeWeeklyStreak(lastWeeklyDate, thisWeekStart, currentStreak) {
  const prev = new Date(thisWeekStart + 'T00:00:00');
  prev.setDate(prev.getDate() - 7);
  return lastWeeklyDate === _toDateString(prev) ? (currentStreak || 0) + 1 : 1;
}

function isWeeklyCompleted() {
  return playerStats.weeklyLastDate === getWeekStartString();
}

function startWeeklyChallenge() {
  const weekStart = getWeekStartString();
  const config = difficulties[WEEKLY_DIFFICULTY];

  gameState.mode = 'weekly';
  gameState.difficulty = WEEKLY_DIFFICULTY;

  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');

  resetRoundState({ pairs: config.pairs, maxMoves: config.maxMoves, countdown: WEEKLY_COUNTDOWN });
  clearModeChrome();
  document.body.classList.add('weekly-mode');
  resetHud({ label: 'WEEKLY', moveLimitText: '/' + config.maxMoves, countdown: WEEKLY_COUNTDOWN });

  const weeklyParticles = document.getElementById('weekly-particles');
  if (weeklyParticles) weeklyParticles.innerHTML = '';

  const weeklyHud = document.getElementById('weekly-hud');
  if (weeklyHud) {
    weeklyHud.classList.remove('hidden');
    document.getElementById('weekly-week').textContent = weekStart;
    document.getElementById('weekly-diff').textContent = config.label;
    document.getElementById('weekly-streak').textContent = playerStats.weeklyStreak || 0;
    document.getElementById('weekly-reset').textContent = daysUntilWeeklyReset() + 'd';
  }

  // 'weekly:' prefix keeps this board distinct from the daily board on a Monday.
  buildBoard({
    pairs: config.pairs,
    gridClass: config.gridClass,
    rng: createDailySeed('weekly:' + weekStart),
  });

  updateRankHUD();
}

function _applyWeeklyWinStats(xpEarned) {
  playerStats.xp += xpEarned;
  playerStats.gamesPlayed++;
  playerStats.gamesWon++;
  playerStats.totalMatches = (playerStats.totalMatches || 0) + gameState.matchedPairs;
  if (gameState.maxCombo > (playerStats.bestCombo || 0)) playerStats.bestCombo = gameState.maxCombo;
  playerStats.unlockedSkins = getUnlockedSkins(playerStats.xp);
  playerStats.rank = getRankForXP(playerStats.xp).name;
}

function winWeeklyChallenge() {
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');
  hideCombo();

  const weekStart = getWeekStartString();
  const alreadyDone = isWeeklyCompleted();

  if (!alreadyDone) {
    playerStats.weeklyStreak = computeWeeklyStreak(playerStats.weeklyLastDate, weekStart, playerStats.weeklyStreak);
    playerStats.weeklyLastDate = weekStart;
  }

  // First clear of the week pays double plus a streak bonus; replays pay base only.
  const baseXP = calculateXP(gameState.difficulty, gameState.moves, gameState.maxMoves, gameState.seconds, true, gameState.maxCombo);
  const streakBonus = alreadyDone ? 0 : (playerStats.weeklyStreak || 1) * WEEKLY_STREAK_XP;
  const xpEarned = alreadyDone ? baseXP : baseXP * WEEKLY_XP_MULTIPLIER + streakBonus;

  const oldRank = getRankForXP(playerStats.xp);
  _applyWeeklyWinStats(xpEarned);
  const newRank = getRankForXP(playerStats.xp);
  recordGame('win', xpEarned);
  saveStats(playerStats);

  updateQuestProgress({
    won: true,
    mode: 'weekly',
    difficulty: gameState.difficulty,
    combo: gameState.maxCombo,
    perfect: gameState.moves === gameState.totalPairs,
  });

  const overlay = document.getElementById('weekly-win-overlay');
  if (!overlay) return;

  document.getElementById('weekly-win-week').textContent = weekStart;
  document.getElementById('weekly-win-moves').textContent = gameState.moves;
  document.getElementById('weekly-win-time').textContent = formatTime(gameState.seconds);
  document.getElementById('weekly-win-streak').textContent = playerStats.weeklyStreak || 1;
  document.getElementById('weekly-win-xp').textContent = '+' + xpEarned + ' XP';
  document.getElementById('weekly-win-bonus').textContent = alreadyDone
    ? '(already cleared this week)'
    : '(' + WEEKLY_XP_MULTIPLIER + '× weekly bonus +' + streakBonus + ' streak)';

  SoundEngine.win();
  Haptics.win();

  checkAchievements({
    won: true,
    moves: gameState.moves,
    matchedPairs: gameState.matchedPairs,
    seconds: gameState.seconds,
    maxCombo: gameState.maxCombo,
    difficulty: gameState.difficulty,
    isBlitz: false,
  });

  const reveal = () => {
    overlay.classList.remove('hidden');
    spawnParticles();
    srAnnounce(`Weekly challenge complete! ${gameState.moves} moves, time ${formatTime(gameState.seconds)}.`);
    overlay.querySelector('button')?.focus();
  };

  if (newRank.name === oldRank.name) {
    setTimeout(reveal, 600);
  } else {
    showRankUp(newRank.name, reveal);
  }
  updateRankHUD();
}

function exitWeekly() {
  document.getElementById('weekly-win-overlay').classList.add('hidden');
  document.getElementById('weekly-hud').classList.add('hidden');
  document.body.classList.remove('weekly-mode');
  gameState.mode = 'classic';
  clearInterval(gameState.timerInterval);
  rulesModal.showModal();
  updateWeeklyButton();
}

function retryWeekly() {
  document.getElementById('weekly-win-overlay').classList.add('hidden');
  startWeeklyChallenge();
}

function updateWeeklyButton() {
  const btn = document.getElementById('weekly-btn');
  if (!btn) return;

  const badge = document.getElementById('weekly-badge');
  if (badge) badge.classList.toggle('hidden', !isWeeklyCompleted());

  const resetEl = document.getElementById('weekly-btn-reset');
  if (resetEl) {
    const days = daysUntilWeeklyReset();
    resetEl.textContent = 'Resets in ' + days + (days === 1 ? ' day' : ' days');
  }
}
