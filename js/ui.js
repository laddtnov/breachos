// ── Combo Display ──
function showCombo(combo) {
  if (combo < 2) return;
  const el = document.getElementById('combo-display');
  if (!el) return;
  el.textContent = combo + 'x COMBO';

  // Color escalation
  if (combo >= 5) {
    el.style.color = '#ff0055';
    el.style.textShadow = '0 0 20px rgba(255,0,85,0.8), 0 0 40px rgba(255,0,85,0.4)';
  } else if (combo >= 3) {
    el.style.color = '#ffff00';
    el.style.textShadow = '0 0 20px rgba(255,255,0,0.8), 0 0 40px rgba(255,255,0,0.4)';
  } else {
    el.style.color = '';
    el.style.textShadow = '';
  }

  el.classList.remove('hidden', 'combo-pop');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add('combo-pop');
    });
  });
}

function hideCombo() {
  const el = document.getElementById('combo-display');
  if (el) el.classList.add('hidden');
}

// ── Rank Up Overlay ──
function showRankUp(rankName, callback) {
  const overlay = document.getElementById('rankup-overlay');
  const nameEl = document.getElementById('rankup-name');
  nameEl.textContent = rankName;
  overlay.classList.remove('hidden');

  setTimeout(() => {
    overlay.classList.add('hidden');
    if (callback) callback();
  }, 2200);
}

// ── Update Rank HUD ──
function updateRankHUD() {
  const rank = getRankForXP(playerStats.xp);
  const next = getNextRank(rank.name);

  if (rankDisplay) rankDisplay.textContent = rank.name;

  if (rankProgress && rankXP) {
    if (next) {
      const progress = ((playerStats.xp - rank.xp) / (next.xp - rank.xp)) * 100;
      rankProgress.style.width = Math.min(progress, 100) + '%';
      rankXP.textContent = playerStats.xp + '/' + next.xp + ' XP';
    } else {
      rankProgress.style.width = '100%';
      rankXP.textContent = playerStats.xp + ' XP (MAX)';
    }
  }
}

// ── Game Mode Toggle ──
function setGameMode(mode) {
  gameState.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });
  const desc = document.getElementById('mode-desc');
  if (desc) {
    desc.textContent = mode === 'blitz'
      ? 'Race the clock! Every difficulty has a countdown. No move limits.'
      : 'Standard rules — limited moves, no timer (except EXTREME).';
  }
  // Update blitz countdown display on diff buttons
  updateBlitzTimers();
}

function updateBlitzTimers() {
  const isBlitz = gameState.mode === 'blitz';
  ['easy', 'medium', 'hard', 'extreme'].forEach(d => {
    const btn = document.querySelector(`.diff-btn[data-difficulty="${d}"]`);
    if (!btn) return;
    const desc = btn.querySelector('.diff-desc');
    const base = difficulties[d];
    if (isBlitz) {
      desc.textContent = base.pairs * 2 + ' cards — ' + BLITZ_CONFIG[d].countdown + 's';
    } else {
      const cols = { easy: '3 x 2', medium: '4 x 4', hard: '4 x 6', extreme: '6 x 6' }[d];
      desc.textContent = cols + ' — ' + base.pairs * 2 + ' cards' + (base.countdown ? ' — ' + base.countdown + 's' : '');
    }
  });
}

// ── Start with Difficulty (from modal) ──
function startWithDifficulty(diff) {
  // Ensure we're not in survival mode when picking a standard difficulty
  if (gameState.mode === 'survival') gameState.mode = 'classic';
  gameState.difficulty = diff;
  rulesModal.classList.add('hidden');
  document.getElementById('back-to-game-btn').classList.add('hidden');
  initGame();
}

// ── Init / Restart ──
function initGame() {
  const config = difficulties[gameState.difficulty];
  const isBlitz = gameState.mode === 'blitz';
  const blitz = isBlitz ? BLITZ_CONFIG[gameState.difficulty] : null;

  gameState.flippedCards = [];
  gameState.matchedPairs = 0;
  gameState.totalPairs = config.pairs;
  gameState.maxMoves = blitz ? blitz.maxMoves : config.maxMoves;
  gameState.moves = 0;
  gameState.combo = 0;
  gameState.maxCombo = 0;
  gameState.seconds = 0;
  gameState.countdown = blitz ? blitz.countdown : (config.countdown || 0);
  gameState.timerStarted = false;
  gameState.isLocked = false;
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');
  document.body.classList.toggle('blitz-mode', isBlitz);
  document.body.classList.remove('survival-mode', 'daily-mode');
  document.getElementById('survival-hud').classList.add('hidden');
  document.getElementById('wave-clear-overlay').classList.add('hidden');
  document.getElementById('survival-over-overlay').classList.add('hidden');
  document.getElementById('daily-hud').classList.add('hidden');
  document.getElementById('daily-win-overlay').classList.add('hidden');

  movesDisplay.childNodes[0].textContent = '0';
  movesLimit.textContent = isBlitz ? '' : '/' + config.maxMoves;
  timerDisplay.textContent = gameState.countdown ? formatTime(gameState.countdown) : '00:00';
  winOverlay.classList.add('hidden');
  loseOverlay.classList.add('hidden');
  difficultyDisplay.textContent = (isBlitz ? 'BLITZ ' : '') + config.label;
  particles.innerHTML = '';

  const hudItem = movesDisplay.closest('.hud-item');
  hudItem.classList.remove('moves-warning');

  board.className = '';
  board.classList.add(config.gridClass);

  // Apply active skin
  applySkin(playerStats.activeSkin);

  // Merge unlocked reward characters into the pool
  const rewardChars = getUnlockedRewardCharacters();
  const allCharacters = [...characters, ...rewardChars];
  const selected = shuffle(allCharacters).slice(0, config.pairs);
  const deck = shuffle([...selected, ...selected]);

  board.innerHTML = '';
  deck.forEach(char => board.appendChild(createCardElement(char)));

  updateRankHUD();
}

function restartGame() {
  initGame();
}

function showDifficultySelect() {
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');
  document.getElementById('back-to-game-btn').classList.remove('hidden');
  rulesModal.classList.remove('hidden');
  updateBestTimes();
  if (typeof updateDailyButton === 'function') updateDailyButton();
}

function closeDifficultySelect() {
  rulesModal.classList.add('hidden');
  document.getElementById('back-to-game-btn').classList.add('hidden');
  // Resume timer if game was in progress
  if (gameState.timerStarted && gameState.matchedPairs < gameState.totalPairs) {
    startTimer();
  }
}

// ── Card Skins ──
function applySkin(skinName) {
  board.classList.remove('skin-default', 'skin-hologram', 'skin-corrupted', 'skin-gold', 'skin-elite', 'skin-survivor', 'skin-chrono', 'skin-plasma', 'skin-acid', 'skin-shadow');
  board.classList.add('skin-' + skinName);
}

function selectSkin(skinName) {
  if (!playerStats.unlockedSkins.includes(skinName)) return;
  playerStats.activeSkin = skinName;
  saveStats(playerStats);
  applySkin(skinName);
  renderSkinModal();
}

function toggleSkinModal() {
  if (!skinModal) return;
  skinModal.classList.toggle('hidden');
  if (!skinModal.classList.contains('hidden')) renderSkinModal();
}

function renderSkinModal() {
  const grid = document.getElementById('skin-grid');
  if (!grid) return;

  const skins = [
    { id: 'default',   name: 'DEFAULT',      rank: 'ROOKIE',          desc: 'Standard cyan scanlines' },
    { id: 'hologram',  name: 'HOLOGRAM',      rank: 'AGENT',           desc: 'Rainbow shimmer effect' },
    { id: 'corrupted', name: 'CORRUPTED',     rank: 'SPECIALIST',      desc: 'Red glitch pattern' },
    { id: 'gold',      name: 'GOLD CIRCUIT',  rank: 'GHOST',           desc: 'Gold circuit-board lines' },
    { id: 'elite',     name: 'ELITE NEON',    rank: 'NETRUNNER_ELITE', desc: 'Ultimate neon glow' },
    { id: 'survivor',  name: 'SURVIVOR',      rank: '__SURVIVAL_5',    desc: 'Blood-red crackling aura' },
    { id: 'chrono',    name: 'CHRONO',        rank: '__DAILY_7',       desc: 'Purple time-warp shimmer' },
    { id: 'plasma',    name: 'PLASMA BURN',   rank: '__WINS_20',       desc: 'Electric violet plasma waves' },
    { id: 'acid',      name: 'ACID RAIN',     rank: '__COMBO_7',       desc: 'Toxic neon green drip' },
    { id: 'shadow',    name: 'SHADOW PROTOCOL', rank: '__PLAYED_100',  desc: 'Dark silver ghost shimmer' },
  ];

  grid.innerHTML = skins.map(skin => {
    const unlocked = playerStats.unlockedSkins.includes(skin.id);
    const active = playerStats.activeSkin === skin.id;
    const isDisabled = !unlocked;
    const LOCK_LABELS = {
      '__SURVIVAL_5': 'Survive Wave 5',
      '__DAILY_7': '7-Day Streak',
      '__WINS_20': 'Win 20 Games',
      '__COMBO_7': '7x Combo',
      '__PLAYED_100': 'Play 100 Games',
    };
    const lockLabel = LOCK_LABELS[skin.rank] ?? `Unlock at ${skin.rank}`;
    return `
      <button class="skin-item ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}"
              onclick="${unlocked ? `selectSkin('${skin.id}')` : ''}"
              ${isDisabled ? 'disabled' : ''}>
        <div class="skin-preview skin-preview-${skin.id}"></div>
        <span class="skin-name">${skin.name}</span>
        <span class="skin-desc">${unlocked ? skin.desc : lockLabel}</span>
      </button>
    `;
  }).join('');
}

// ── Existing Features ──
function toggleEffects() {
  const body = document.body;
  body.classList.toggle('safe-mode');
  const label = body.classList.contains('safe-mode') ? 'SAFE MODE' : 'CYBER MODE';
  const dt = document.getElementById('status-text');
  const mb = document.getElementById('status-text-mobile');
  if (dt) dt.innerText = label;
  if (mb) mb.innerText = label;
}

window.onblur = () => document.title = "SYSTEM ERROR...";
window.onfocus = () => document.title = "Cyberpunk Memory Match";

// ── Mobile Menu ──
function toggleMenu() {
  const dialog = document.getElementById('menu-dialog');
  const btn = document.getElementById('menu-btn');
  if (!dialog) return;

  if (dialog.open) {
    dialog.close();
    btn?.classList.remove('open');
  } else {
    dialog.showModal();
    btn?.classList.add('open');
  }
}

// Close on backdrop click — attached after partials load via initMenuDialog()
function initMenuDialog() {
  const dialog = document.getElementById('menu-dialog');
  if (!dialog) return;
  dialog.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-panel')) {
      dialog.close();
      document.getElementById('menu-btn')?.classList.remove('open');
    }
  });
}

// ── Best Times on Difficulty Buttons ──
function updateBestTimes() {
  const bt = playerStats.bestTimes || {};
  ['easy', 'medium', 'hard', 'extreme'].forEach(d => {
    const el = document.getElementById('best-' + d);
    if (!el) return;
    if (bt[d] == null) {
      el.textContent = '';
      return;
    }
    el.textContent = 'BEST: ' + formatTime(bt[d]);
  });
}

// ── Init rank HUD + best times + daily badge ──
// NOTE: These are called from index.html after loadPartials() completes,
// since DOM elements live in partials and aren't available at script load time.
