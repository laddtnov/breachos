// ── Rank & Stats Functions ──

function loadStats() {
  try {
    const saved = JSON.parse(localStorage.getItem('cyberpunk_match_stats'));
    if (saved) return { ...DEFAULT_STATS, ...saved };
  } catch (e) {
    console.warn('[Netrunner.ERROR]', {
      message: e?.message,
      stack: e?.stack
    });
  }
  return { ...DEFAULT_STATS };
}

function saveStats(stats) {
  localStorage.setItem('cyberpunk_match_stats', JSON.stringify(stats));
  // Push to server if user is logged in (auth.js loads after rank.js)
  if (typeof syncSave === 'function') syncSave().catch(() => {});
}

function getRankForXP(xp) {
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (xp >= r.xp) rank = r;
  }
  return rank;
}

function getNextRank(currentRankName) {
  const idx = RANKS.findIndex(r => r.name === currentRankName);
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

function calculateXP(difficulty, moves, maxMoves, seconds, won, maxCombo = 0) {
  if (!won) return 5;
  const base = { easy: 20, medium: 50, hard: 100, extreme: 200 };
  const moveBonus = Math.max(0, Math.floor((maxMoves - moves) / maxMoves * 50));
  const timeBonus = Math.max(0, 50 - Math.floor(seconds / 10));
  const comboBonus = maxCombo >= 2 ? maxCombo * 10 : 0;
  return (base[difficulty] || 20) + moveBonus + timeBonus + comboBonus;
}

// Reward skin unlock rules — each condition evaluated lazily at call time.
// Table-driven to keep getUnlockedSkins() complexity within Sonar S3776 limit.
const REWARD_SKIN_RULES = [
  { id: 'survivor', met: () => (playerStats.bestWave    || 0) >= 5   },  // Survival Wave 5
  { id: 'chrono',   met: () => (playerStats.dailyStreak || 0) >= 7   },  // 7-day streak
  { id: 'plasma',   met: () => (playerStats.gamesWon    || 0) >= 20  },  // 20 total wins
  { id: 'acid',     met: () => (playerStats.bestCombo   || 0) >= 7   },  // 7x combo
  { id: 'shadow',   met: () => (playerStats.gamesPlayed || 0) >= 100 },  // 100 games played
  { id: 'graffiti', met: () => typeof loadAchievements === 'function' && loadAchievements().length >= 5 }, // #18: 5 achievements
];

function getUnlockedSkins(xp) {
  const skins = ['default'];
  for (const r of RANKS) {
    if (xp >= r.xp && r.skin !== 'default' && !skins.includes(r.skin)) {
      skins.push(r.skin);
    }
  }
  for (const { id, met } of REWARD_SKIN_RULES) {
    if (met()) skins.push(id);
  }
  return skins;
}
