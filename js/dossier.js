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
}
