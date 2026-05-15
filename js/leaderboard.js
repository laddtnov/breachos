// ── Leaderboard ──

let _lbActiveTab  = 'global';
let _lbCache      = null;
let _lbCacheTime  = 0;
let _lbDailyCache = null;
let _lbDailyCacheTime = 0;
const LB_TTL = 60_000;

function invalidateLeaderboardCache() {
  _lbCache = null;
  _lbCacheTime = 0;
  _lbDailyCache = null;
  _lbDailyCacheTime = 0;
}

async function fetchLeaderboard() {
  const now = Date.now();
  if (_lbCache && now - _lbCacheTime < LB_TTL) return _lbCache;
  const res = await fetch('/api/leaderboard/get');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const { leaderboard } = await res.json();
  _lbCache = leaderboard;
  _lbCacheTime = Date.now();
  return leaderboard;
}

async function fetchDailyLeaderboard() {
  const now = Date.now();
  if (_lbDailyCache && now - _lbDailyCacheTime < LB_TTL) return _lbDailyCache;
  const res = await fetch('/api/leaderboard/daily');
  if (!res.ok) throw new Error('Failed to fetch daily leaderboard');
  const { leaderboard } = await res.json();
  _lbDailyCache = leaderboard;
  _lbDailyCacheTime = Date.now();
  return leaderboard;
}

function switchLeaderboardTab(tab) {
  _lbActiveTab = tab;
  document.querySelectorAll('.lb-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  renderLeaderboard([]);
  const fetch = tab === 'daily' ? fetchDailyLeaderboard : fetchLeaderboard;
  fetch().then(data => renderLeaderboard(data, tab)).catch(() => renderLeaderboard(null));
}

function refreshLeaderboard() {
  invalidateLeaderboardCache();
  switchLeaderboardTab(_lbActiveTab);
}

function _openLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  if (!modal) return;
  _lbActiveTab = 'global';
  // Reset tab UI
  document.querySelectorAll('.lb-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === 'global');
  });
  renderLeaderboard([]);
  modal.showModal();
  fetchLeaderboard().then(data => renderLeaderboard(data, 'global')).catch(() => renderLeaderboard(null));
}

function toggleLeaderboardModal() {
  const modal = document.getElementById('leaderboard-modal');
  if (!modal) return;

  if (modal.open) { modal.close(); return; }

  const menuDialog = document.getElementById('menu-dialog');
  if (menuDialog?.open) {
    const onMenuClose = () => {
      menuDialog.removeEventListener('close', onMenuClose);
      _openLeaderboard();
    };
    menuDialog.addEventListener('close', onMenuClose);
    menuDialog.close();
    document.getElementById('menu-btn')?.classList.remove('open');
  } else {
    _openLeaderboard();
  }
}

function renderLeaderboard(data, tab) {
  const list    = document.getElementById('leaderboard-list');
  const updated = document.getElementById('leaderboard-updated');
  if (!list) return;

  const isDaily = (tab || _lbActiveTab) === 'daily';

  if (data === null) {
    list.innerHTML = `<li class="lb-message lb-error">SIGNAL LOST — COULD NOT REACH NET</li>`;
    return;
  }
  if (data.length === 0) {
    const msg = isDaily
      ? 'NO DAILY SCORES YET — COMPLETE TODAY\'S CHALLENGE'
      : 'NO AGENTS RANKED YET — BE THE FIRST';
    list.innerHTML = `<li class="lb-message">${msg}</li>`;
    return;
  }

  const selfId = typeof authState === 'undefined' ? null : authState?.user?.id;
  const MEDAL = { 1: '◈', 2: '◇', 3: '△' };
  const RANK_COLORS = {
    ROOKIE: 'rgba(150,150,150,0.7)', AGENT: 'rgba(0,243,255,0.6)',
    SPECIALIST: 'rgba(0,243,255,0.85)', GHOST: 'rgba(157,0,255,0.9)',
    NETRUNNER_ELITE: '#FFD700',
  };
  const DIFF_COLORS = { easy: '#00f3ff', medium: '#ffdc00', hard: '#ff6600', extreme: '#ff0055' };

  list.innerHTML = data.map(entry => {
    const isSelf   = selfId && entry.user_id === selfId;
    const posClass = entry.pos <= 3 ? `lb-pos-${entry.pos}` : '';
    const medal    = MEDAL[entry.pos] || entry.pos;

    if (isDaily) {
      const diffColor = DIFF_COLORS[entry.difficulty] || '#00f3ff';
      const time = typeof entry.time_secs === 'number'
        ? Math.floor(entry.time_secs / 60).toString().padStart(2,'0') + ':' +
          (entry.time_secs % 60).toString().padStart(2,'0')
        : '--:--';
      return `
        <li class="lb-entry ${posClass} ${isSelf ? 'lb-self' : ''}">
          <span class="lb-medal">${medal}</span>
          <span class="lb-username">${entry.username}${isSelf ? ' ◀' : ''}</span>
          <span class="lb-rank" style="color:${diffColor}">${(entry.difficulty || '').toUpperCase()}</span>
          <span class="lb-xp">${time}</span>
        </li>`;
    }

    const rankColor = RANK_COLORS[entry.rank_name] || 'rgba(0,243,255,0.6)';
    return `
      <li class="lb-entry ${posClass} ${isSelf ? 'lb-self' : ''}">
        <span class="lb-medal">${medal}</span>
        <span class="lb-username">${entry.username}${isSelf ? ' ◀' : ''}</span>
        <span class="lb-rank" style="color:${rankColor}">${entry.rank_name || 'ROOKIE'}</span>
        <span class="lb-xp">${Number(entry.xp).toLocaleString()} XP</span>
      </li>`;
  }).join('');

  if (updated) {
    updated.textContent = 'UPDATED ' + new Date().toLocaleTimeString();
  }
}

// Refresh if modal is open after sync
function refreshLeaderboardIfOpen() {
  const modal = document.getElementById('leaderboard-modal');
  if (!modal?.open) return;
  invalidateLeaderboardCache();
  switchLeaderboardTab(_lbActiveTab);
}
