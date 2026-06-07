// ── Achievement System ──

const ACHIEVEMENTS = [
  {
    id: 'zero_errors',
    name: 'ZERO ERRORS',
    symbol: '\u2714',
    desc: 'Win a game with no mismatches',
    check: (state, stats) => state.won && state.moves === state.matchedPairs,
  },
  {
    id: 'speedrunner',
    name: 'SPEEDRUNNER',
    symbol: '\u26A1',
    desc: 'Win a game in under 15 seconds',
    check: (state, stats) => state.won && state.seconds < 15,
  },
  {
    id: 'combo_master',
    name: 'COMBO MASTER',
    symbol: '\u2728',
    desc: 'Get a 5x combo in a single game',
    check: (state) => state.maxCombo >= 5,
  },
  {
    id: 'extreme_survivor',
    name: 'EXTREME SURVIVOR',
    symbol: '\u2622',
    desc: 'Win on EXTREME difficulty',
    check: (state) => state.won && state.difficulty === 'extreme',
  },
  {
    id: 'perfectionist',
    name: 'PERFECTIONIST',
    symbol: '\u2605',
    desc: 'Win on all 4 difficulties',
    check: (state, stats) => {
      const bt = stats.bestTimes || {};
      return bt.easy !== null && bt.medium !== null && bt.hard !== null && bt.extreme !== null;
    },
  },
  {
    id: 'grinder',
    name: 'GRINDER',
    symbol: '\u2699',
    desc: 'Play 50 games total',
    check: (state, stats) => stats.gamesPlayed >= 50,
  },
  {
    id: 'wave_rider',
    name: 'WAVE RIDER',
    symbol: '\u2601',
    desc: 'Reach Wave 5 in Survival Mode',
    check: (state, stats) => (stats.bestWave || 0) >= 5,
  },
  {
    id: 'unkillable',
    name: 'UNKILLABLE',
    symbol: '\u2694',
    desc: 'Reach Wave 10 in Survival Mode',
    check: (state, stats) => (stats.bestWave || 0) >= 10,
  },
  {
    id: 'devoted',
    name: 'DEVOTED',
    symbol: '\u2739',
    desc: 'Maintain a 7-day Daily Challenge streak',
    check: (state, stats) => (stats.dailyStreak || 0) >= 7,
  },
  {
    id: 'daily_warrior',
    name: 'DAILY WARRIOR',
    symbol: '\u2609',
    desc: 'Complete 30 Daily Challenges',
    check: (state, stats) => (stats.dailyCompleted || 0) >= 30,
  },
  {
    id: 'blitz_ace',
    name: 'BLITZ ACE',
    symbol: '\u23F1',
    desc: 'Win a Blitz game on Hard or Extreme',
    check: (state) => state.won && state.isBlitz && (state.difficulty === 'hard' || state.difficulty === 'extreme'),
  },
  {
    id: 'combo_king',
    name: 'COMBO KING',
    symbol: '\u265B',
    desc: 'Get a 10x combo in a single game',
    check: (state) => state.maxCombo >= 10,
  },
  {
    id: 'speed_demon',
    name: 'SPEED DEMON',
    symbol: '\u26A1',
    desc: 'Win a game in under 10 seconds',
    check: (state) => state.won && state.seconds < 10,
  },
  {
    id: 'veteran',
    name: 'VETERAN',
    symbol: '\u2726',
    desc: 'Play 100 games total',
    check: (state, stats) => (stats.gamesPlayed || 0) >= 100,
  },
  {
    id: 'no_mercy',
    name: 'NO MERCY',
    symbol: '\u221E',
    desc: 'Win on EXTREME with zero mismatches',
    check: (state) => state.won && state.difficulty === 'extreme' && state.moves === state.matchedPairs,
  },
  {
    id: 'daily_devotee',
    name: 'DAILY DEVOTEE',
    symbol: '\u262F',
    desc: 'Complete 7 Daily Challenges',
    check: (state, stats) => (stats.dailyCompleted || 0) >= 7,
  },
  {
    id: 'inner_circle',
    name: 'INNER CIRCLE',
    symbol: '\u25C8',
    desc: 'Discover the hidden protocol',
    check: (state) => !!state.konamiActivated,
  },
  {
    id: 'faster_than_wind',
    name: 'FASTER THAN WIND',
    symbol: '\uD83D\uDCA8',
    desc: 'Win on Easy in under 3 seconds',
    check: (state) => state.won && state.difficulty === 'easy' && state.seconds < 3,
  },
  {
    id: 'just_in_time',
    name: 'JUST IN TIME',
    symbol: '\u23F3',
    desc: 'Win with only 1 second left on the countdown',
    check: (state) => state.won && typeof state.countdown === 'number' && state.countdown <= 1 && state.countdown >= 0,
  },
  // #20 \u2014 5 gameplay modifier achievements
  {
    id: 'ghost_ninja',
    name: 'GHOST NINJA',
    symbol: '\uD83D\uDC7B',
    desc: 'Win a game with Ghost Mode active',
    check: (state) => state.won && state.ghostMode,
  },
  {
    id: 'trap_dodger',
    name: 'TRAP DODGER',
    symbol: '\u26A0',
    desc: 'Win on Hard without springing the trap',
    check: (state) => state.won && state.difficulty === 'hard' && !state.trapSprung,
  },
  {
    id: 'time_lord',
    name: 'TIME LORD',
    symbol: '\u23F1',
    desc: 'Trigger Time Warp 3 times in one game',
    check: (state) => (state.timewarpCount || 0) >= 3,
  },
  {
    id: 'photographic',
    name: 'PHOTOGRAPHIC',
    symbol: '\uD83D\uDC41',
    desc: 'Win on Extreme after using Memory Peek',
    check: (state) => state.won && state.difficulty === 'extreme' && state.memoryPeek,
  },
  {
    id: 'glitch_hunter',
    name: 'GLITCH HUNTER',
    symbol: '\u2588',
    desc: 'Win while a Glitch Event is active',
    check: (state) => state.won && state.glitchActiveOnWin,
  },
];

function loadAchievements() {
  try {
    const saved = JSON.parse(localStorage.getItem('cyberpunk_achievements'));
    if (saved) return saved;
  } catch (e) {
    console.warn('[Netrunner.ERROR]', { message: e?.message, stack: e?.stack });
  }
  return [];
}

function saveAchievements(unlocked) {
  localStorage.setItem('cyberpunk_achievements', JSON.stringify(unlocked));
}

let unlockedAchievements = loadAchievements();

function checkAchievements(gameResult) {
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS) {
    if (unlockedAchievements.includes(ach.id)) continue;
    if (ach.check(gameResult, playerStats)) {
      unlockedAchievements.push(ach.id);
      newlyUnlocked.push(ach);
    }
  }

  if (newlyUnlocked.length > 0) {
    saveAchievements(unlockedAchievements);
    showAchievementPopup(newlyUnlocked);
  }
}

function showAchievementPopup(achievements) {
  const popup = document.getElementById('achievement-popup');
  if (!popup) return;

  const DURATION = 3500;
  let idx = 0;

  function showNext() {
    if (idx >= achievements.length) {
      popup.classList.add('hidden');
      return;
    }
    const ach = achievements[idx];
    popup.querySelector('.achievement-symbol').textContent = ach.symbol;
    popup.querySelector('.achievement-name').textContent   = ach.name;
    popup.querySelector('.achievement-desc').textContent   = ach.desc;

    // Progress indicator (e.g. "2 / 3" if multiple unlock at once)
    const counter = popup.querySelector('.achievement-counter');
    if (counter) {
      counter.textContent = achievements.length > 1
        ? (idx + 1) + ' / ' + achievements.length
        : '';
    }

    // Haptic buzz on unlock
    if (typeof Haptics !== 'undefined') Haptics.match();

    popup.classList.remove('hidden', 'achievement-slide');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        popup.classList.add('achievement-slide');
      });
    });

    idx++;
    setTimeout(showNext, DURATION);
  }
  showNext();
}

function toggleAchievementModal() {
  const modal = document.getElementById('achievement-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) renderAchievementModal();
}

function renderAchievementModal() {
  const grid = document.getElementById('achievement-grid');
  const countEl = document.getElementById('achievement-count');
  if (!grid) return;
  // WCAG 4.1.2 — list semantics on the container (#50)
  grid.setAttribute('role', 'list');

  const unlocked = unlockedAchievements.length;
  const total = ACHIEVEMENTS.length;

  if (countEl) {
    countEl.innerHTML = `UNLOCKED: <span>${unlocked}</span> / ${total}`;
  }

  grid.innerHTML = ACHIEVEMENTS.map(ach => {
    const isUnlocked = unlockedAchievements.includes(ach.id);
    return `
      <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}"
           role="listitem"
           aria-label="${ach.name} — ${ach.desc} — ${isUnlocked ? 'Unlocked' : 'Locked'}">
        <span class="achievement-item-symbol" aria-hidden="true">${isUnlocked ? ach.symbol : '🔒'}</span>
        <div class="achievement-info">
          <span class="achievement-item-name">${ach.name}</span>
          <span class="achievement-item-desc">${ach.desc}</span>
        </div>
      </div>
    `;
  }).join('');
}
