// ── Statistics Dashboard (DOSSIER) ──

function toggleDossierModal() {
  const modal = document.getElementById('dossier-modal');
  if (!modal) return;
  if (modal.open) {
    modal.close();
  } else {
    modal.showModal();
    renderDossier();
  }
}

function renderDossier() {
  const stats = playerStats;
  const winRate = stats.gamesPlayed > 0
    ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100)
    : 0;

  // Overall stats
  document.getElementById('dos-games-played').textContent = stats.gamesPlayed;
  document.getElementById('dos-games-won').textContent = stats.gamesWon;
  document.getElementById('dos-win-rate').textContent = winRate + '%';
  document.getElementById('dos-total-xp').textContent = stats.xp;
  document.getElementById('dos-rank').textContent = stats.rank;
  document.getElementById('dos-best-combo').textContent = (stats.bestCombo || 0) + 'x';
  document.getElementById('dos-total-matches').textContent = stats.totalMatches || 0;
  document.getElementById('dos-achievements').textContent = unlockedAchievements.length + '/' + ACHIEVEMENTS.length;

  // Badge grid — earned badges lit, locked ones as silhouettes with a tooltip.
  if (typeof renderAchievementBadges === 'function') renderAchievementBadges();

  // Per-difficulty breakdown
  const diffs = ['easy', 'medium', 'hard', 'extreme'];
  const wpd = stats.winsPerDifficulty || {};
  const bt = stats.bestTimes || {};

  const tbody = document.getElementById('dos-diff-body');
  tbody.innerHTML = diffs.map(d => {
    const wins = wpd[d] || 0;
    const best = bt[d] !== null && bt[d] !== undefined ? formatTime(bt[d]) : '--:--';
    const label = difficulties[d].label;
    return `
      <tr>
        <td class="dos-diff-name dos-${d}">${label}</td>
        <td>${wins}</td>
        <td>${best}</td>
      </tr>
    `;
  }).join('');

  renderGameHistory();
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function renderGameHistory() {
  const tbody = document.getElementById('dos-history-body');
  if (!tbody) return;
  const history = playerStats.gameHistory || [];

  if (history.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="dos-history-empty">No missions recorded yet</td></tr>';
    return;
  }

  const modeLabel = { classic: 'CLASSIC', blitz: 'BLITZ', survival: 'SURVIVAL', daily: 'DAILY' };
  const diffLabel  = { easy: 'EASY', medium: 'MED', hard: 'HARD', extreme: 'EXT' };

  tbody.innerHTML = history.map(g => {
    const resultClass = g.result === 'win' ? 'dos-result-win' : 'dos-result-lose';
    const resultText  = g.result === 'win' ? 'WIN' : 'LOSE';
    return `
      <tr>
        <td><span class="dos-result-badge ${resultClass}">${resultText}</span></td>
        <td>${modeLabel[g.mode] || g.mode.toUpperCase()}</td>
        <td class="dos-diff-name dos-${g.difficulty}">${diffLabel[g.difficulty] || g.difficulty.toUpperCase()}</td>
        <td>${g.moves}</td>
        <td>${formatTime(g.time)}</td>
        <td class="dos-history-xp">+${g.xp}</td>
      </tr>
      <tr class="dos-history-meta"><td colspan="6">${timeAgo(g.ts)} · combo ${g.combo}x</td></tr>
    `;
  }).join('');
}
