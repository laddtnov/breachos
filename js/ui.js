// ── SR Live Region Announcer (#29) ──
// Clear-then-set pattern forces re-announcement even for repeated messages.
function srAnnounce(msg) {
  const el = document.getElementById('sr-announce');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = msg; });
}

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
  srAnnounce(`${combo}x combo`);
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

  // rankProgress now points to <progress id="rank-bar"> — use .value directly
  if (rankProgress && rankXP) {
    if (next) {
      const progress = ((playerStats.xp - rank.xp) / (next.xp - rank.xp)) * 100;
      rankProgress.value = Math.min(Math.round(progress), 100);
      rankXP.textContent = playerStats.xp + '/' + next.xp + ' XP';
    } else {
      rankProgress.value = 100;
      rankXP.textContent = playerStats.xp + ' XP (MAX)';
    }
  }
}

// ── Game Mode Toggle ──
function setGameMode(mode) {
  gameState.mode = mode;
  document.querySelectorAll('.mode-btn').forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
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
  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');
  initGame();
}

// ── Glitch scheduling helper ──
function scheduleGlitchEvent() {
  const glitchDelay = 15000 + secureRandomInt(25) * 1000; // 15–40s
  gameState.glitchTimeout = setTimeout(triggerGlitchEvent, glitchDelay);
}

// ── Memory Peek helper ──
function runMemoryPeek() {
  gameState.isLocked = true;
  board.querySelectorAll('.card').forEach(c => c.classList.add('flipped'));
  const countdown = document.getElementById('peek-countdown');
  if (countdown) {
    countdown.classList.remove('hidden');
    let t = 2;
    countdown.textContent = `MEMORIZE — ${t}s`;
    srAnnounce(`Memory peek — memorize the cards for ${t} seconds`);
    const tick = setInterval(() => {
      t--;
      if (t <= 0) {
        clearInterval(tick);
        countdown.classList.add('hidden');
        board.querySelectorAll('.card').forEach(c => c.classList.remove('flipped'));
        gameState.isLocked = false;
      } else {
        countdown.textContent = `MEMORIZE — ${t}s`;
      }
    }, 1000);
  } else {
    setTimeout(() => {
      board.querySelectorAll('.card').forEach(c => c.classList.remove('flipped'));
      gameState.isLocked = false;
    }, 2000);
  }
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
  gameState.timewarpActive = false;
  gameState.timewarpCount = 0; // #20 Time Lord: reset warp counter each game
  gameState.trapCharId = null;
  gameState.trapSprung = false;
  gameState.glitchFired = false;
  clearTimeout(gameState.glitchTimeout);
  gameState.glitchTimeout = null;
  clearTimeout(idleTimer);
  clearInterval(gameState.timerInterval);
  if (typeof resetPauseState === 'function') resetPauseState();
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

  // ── Trap card: assign one random pair on hard/extreme (classic only) ──
  if ((gameState.difficulty === 'hard' || gameState.difficulty === 'extreme') && gameState.mode === 'classic') {
    gameState.trapCharId = selected[secureRandomInt(selected.length)].id;
    board.querySelectorAll(`[data-character="${gameState.trapCharId}"]`)
      .forEach(c => c.classList.add('trap-card'));
  }

  // ── Glitch Event: schedule on hard/extreme classic ──
  if ((gameState.difficulty === 'hard' || gameState.difficulty === 'extreme') && gameState.mode === 'classic') {
    scheduleGlitchEvent();
  }

  // ── Memory Peek: reveal all cards briefly at game start (classic only) ──
  if (gameState.memoryPeek && gameState.mode === 'classic') {
    runMemoryPeek();
  }

  // ── Mode buttons: sync visual state ──
  const ghostBtn = document.getElementById('ghost-mode-btn');
  if (ghostBtn) ghostBtn.classList.toggle('active', !!gameState.ghostMode);
  const peekBtn = document.getElementById('peek-mode-btn');
  if (peekBtn) peekBtn.classList.toggle('active', !!gameState.memoryPeek);

  updateRankHUD();
}

function restartGame() {
  initGame();
}

// ── Ghost Mode Toggle ──
function toggleGhostMode() {
  gameState.ghostMode = !gameState.ghostMode;
  const btn = document.getElementById('ghost-mode-btn');
  if (btn) btn.classList.toggle('active', gameState.ghostMode);
}

// ── Memory Peek Toggle ──
function toggleMemoryPeek() {
  gameState.memoryPeek = !gameState.memoryPeek;
  const btn = document.getElementById('peek-mode-btn');
  if (btn) btn.classList.toggle('active', gameState.memoryPeek);
}

// ── Custom Difficulty ──
function showCustomPanel() {
  const panel = document.getElementById('custom-panel');
  if (!panel) return;
  panel.classList.toggle('hidden');
  if (!panel.classList.contains('hidden')) {
    const saved = loadCustomLoadout();
    document.getElementById('custom-pairs').value  = saved.pairs;
    document.getElementById('custom-moves').value  = saved.maxMoves;
    document.getElementById('custom-timer').value  = saved.countdown;
    updateCustomPreview();
  }
}

function updateCustomPreview() {
  const pairs    = Number.parseInt(document.getElementById('custom-pairs').value, 10);
  const moves    = Number.parseInt(document.getElementById('custom-moves').value, 10);
  const timer    = Number.parseInt(document.getElementById('custom-timer').value, 10);
  const pairsVal = document.getElementById('custom-pairs-val');
  const movesVal = document.getElementById('custom-moves-val');
  const timerVal = document.getElementById('custom-timer-val');
  const preview  = document.getElementById('custom-preview');
  if (pairsVal) pairsVal.textContent = pairs;
  if (movesVal) movesVal.textContent = moves;
  if (timerVal) timerVal.textContent = timer === 0 ? 'OFF' : timer + 's';
  if (preview)  preview.textContent  = `${pairs} pairs · ${pairs * 2} cards · ${moves} moves · ${timer ? timer + 's timer' : 'no timer'}`;
}

function startCustomDifficulty() {
  const pairs   = Number.parseInt(document.getElementById('custom-pairs').value, 10);
  const moves   = Number.parseInt(document.getElementById('custom-moves').value, 10);
  const timer   = Number.parseInt(document.getElementById('custom-timer').value, 10);
  difficulties.custom = {
    pairs,
    maxMoves:  moves,
    countdown: timer,
    gridClass: gridClassForPairs(pairs),
    label:     'CUSTOM',
  };
  if (gameState.mode === 'blitz') gameState.mode = 'classic';
  const panel = document.getElementById('custom-panel');
  if (panel) panel.classList.add('hidden');
  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');
  gameState.difficulty = 'custom';
  initGame();
}

function saveCustomGame() {
  const pairs   = Number.parseInt(document.getElementById('custom-pairs').value, 10);
  const moves   = Number.parseInt(document.getElementById('custom-moves').value, 10);
  const timer   = Number.parseInt(document.getElementById('custom-timer').value, 10);
  saveCustomLoadout({ pairs, maxMoves: moves, countdown: timer });
  const btn = document.getElementById('custom-save-btn');
  if (btn) { btn.textContent = '✓ SAVED'; setTimeout(() => { btn.textContent = '💾 SAVE'; }, 1200); }
}

// ── Onboarding ──
let onboardingStep = 0;

function initOnboarding() {
  if (localStorage.getItem('breachos_onboarding_done')) return;
  const modal = document.getElementById('onboarding-modal');
  // WCAG 2.1.2 — showModal() provides native focus trap (#51)
  if (modal) modal.showModal();
}

function onboardingNext() {
  onboardingStep = Math.min(onboardingStep + 1, 2);
  updateOnboardingStep();
}

function onboardingPrev() {
  onboardingStep = Math.max(onboardingStep - 1, 0);
  updateOnboardingStep();
}

function updateOnboardingStep() {
  document.querySelectorAll('.onboarding-step').forEach((el, i) => {
    el.classList.toggle('hidden', i !== onboardingStep);
  });
  document.querySelectorAll('.onboarding-dot').forEach((el, i) => {
    el.classList.toggle('active', i === onboardingStep);
  });
  const prev  = document.getElementById('onboarding-prev');
  const next  = document.getElementById('onboarding-next');
  const start = document.getElementById('onboarding-start');
  if (prev)  prev.classList.toggle('hidden', onboardingStep === 0);
  if (next)  next.classList.toggle('hidden', onboardingStep === 2);
  if (start) start.classList.toggle('hidden', onboardingStep !== 2);
}

function completeOnboarding() {
  localStorage.setItem('breachos_onboarding_done', '1');
  const modal = document.getElementById('onboarding-modal');
  if (modal) modal.close();
}

// Stores the element that was focused before a modal opened so we can restore it on close (#33)
let _prevFocus = null;

function showDifficultySelect() {
  _prevFocus = document.activeElement;
  clearInterval(gameState.timerInterval);
  document.body.classList.remove('countdown-critical');
  document.getElementById('back-to-game-btn').classList.remove('hidden');
  // WCAG 2.1.2 — showModal() provides native focus trap (#31)
  rulesModal.showModal();
  updateBestTimes();
  if (typeof updateDailyButton === 'function') updateDailyButton();
  // WCAG 2.4.3 — move focus into the modal
  const firstBtn = rulesModal.querySelector('button:not([disabled])');
  if (firstBtn) firstBtn.focus();
}

function closeDifficultySelect() {
  rulesModal.close();
  document.getElementById('back-to-game-btn').classList.add('hidden');
  // Resume timer if game was in progress
  if (gameState.timerStarted && gameState.matchedPairs < gameState.totalPairs) {
    startTimer();
  }
  // WCAG 2.4.3 — return focus to the element that triggered the modal
  if (_prevFocus) { _prevFocus.focus(); _prevFocus = null; }
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
  if (skinModal.open) {
    skinModal.close();
  } else {
    skinModal.showModal();
    renderSkinModal();
  }
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
    // #18 — Neon Graffiti skin: unlock at 5 achievements
    { id: 'graffiti',  name: 'NEON GRAFFITI', rank: '__ACH_5',         desc: 'Spray-paint borders, drip gradient' },
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
      '__ACH_5': 'Unlock 5 Achievements', // #18 Graffiti skin
    };
    const lockLabel = LOCK_LABELS[skin.rank] ?? `Unlock at ${skin.rank}`;
    return `
      <button class="skin-item ${unlocked ? 'unlocked' : 'locked'} ${active ? 'active' : ''}"
              onclick="${unlocked ? `selectSkin('${skin.id}')` : ''}"
              aria-pressed="${active}"
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
  const isSafe = body.classList.contains('safe-mode');
  const label = isSafe ? 'SAFE MODE' : 'CYBER MODE';
  const dt = document.getElementById('status-text');
  const mb = document.getElementById('status-text-mobile');
  if (dt) dt.innerText = label;
  if (mb) mb.innerText = label;
  // Keep aria-pressed in sync on both desktop and mobile buttons
  const btn = document.getElementById('glitch-toggle');
  if (btn) btn.setAttribute('aria-pressed', String(isSafe));
}

window.onblur = () => document.title = "SYSTEM ERROR...";
window.onfocus = () => document.title = "Breachos";

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
    // Sync sound button state each time menu opens
    const soundBtn = document.getElementById('sound-toggle-mobile');
    if (soundBtn) {
      const on = SoundEngine.enabled;
      soundBtn.textContent = on ? 'SOUND: ON' : 'SOUND: OFF';
      soundBtn.classList.toggle('sound-off', !on);
    }
    // Sync haptic button state each time menu opens
    if (typeof Haptics !== 'undefined') Haptics.syncButton();
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

// ── Sync sound button label on load ──
function syncSoundButton() {
  const on = SoundEngine.enabled;
  const label = on ? 'SOUND: ON' : 'SOUND: OFF';
  const btn = document.getElementById('sound-toggle');
  if (btn) btn.textContent = label;
}

// ── Init rank HUD + best times + daily badge ──
// NOTE: These are called from index.html after loadPartials() completes,
// since DOM elements live in partials and aren't available at script load time.
