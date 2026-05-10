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

function getUnlockedSkins(xp) {
  const skins = ['default'];
  for (const r of RANKS) {
    if (xp >= r.xp && r.skin !== 'default' && !skins.includes(r.skin)) {
      skins.push(r.skin);
    }
  }
  // Survival reward skin: reach wave 5
  if ((playerStats.bestWave || 0) >= 5 && !skins.includes('survivor')) {
    skins.push('survivor');
  }
  // Daily reward skin: 7-day streak
  if ((playerStats.dailyStreak || 0) >= 7 && !skins.includes('chrono')) {
    skins.push('chrono');
  }
  // Plasma: 20 total wins
  if ((playerStats.gamesWon || 0) >= 20 && !skins.includes('plasma')) {
    skins.push('plasma');
  }
  // Acid: reach 7x combo
  if ((playerStats.bestCombo || 0) >= 7 && !skins.includes('acid')) {
    skins.push('acid');
  }
  // Shadow: play 100 games
  if ((playerStats.gamesPlayed || 0) >= 100 && !skins.includes('shadow')) {
    skins.push('shadow');
  }
  return skins;
}
