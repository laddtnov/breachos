// ── Leaderboard ──

let _lbCache     = null;
let _lbCacheTime = 0;
const LB_TTL     = 60_000; // 60 s

function invalidateLeaderboardCache() {
  _lbCache = null;
  _lbCacheTime = 0;
}

async function fetchLeaderboard() {
  const now = Date.now();
  if (_lbCache && now - _lbCacheTime < LB_TTL) return _lbCache;

  const res = await fetch('/api/leaderboard/get');
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  const { leaderboard } = await res.json();
  _lbCache     = leaderboard;
  _lbCacheTime = Date.now();
  return leaderboard;
}

function _openLeaderboard() {
  const modal = document.getElementById('leaderboard-modal');
  if (!modal) return;
  renderLeaderboard([]);
  modal.showModal();
  fetchLeaderboard().then(renderLeaderboard).catch(() => renderLeaderboard(null));
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

function renderLeaderboard(data) {
  const list    = document.getElementById('leaderboard-list');
  const updated = document.getElementById('leaderboard-updated');
  if (!list) return;

  if (data === null) {
    list.innerHTML = `<li class="lb-message lb-error">SIGNAL LOST — COULD NOT REACH NET</li>`;
    return;
  }

  if (data.length === 0) {
    list.innerHTML = `<li class="lb-message">NO AGENTS RANKED YET — BE THE FIRST</li>`;
    return;
  }

  const selfId = typeof authState !== 'undefined' ? authState?.user?.id : null;

  const MEDAL = { 1: '◈', 2: '◇', 3: '△' };
  const RANK_COLORS = {
    'ROOKIE':         'rgba(150,150,150,0.7)',
    'AGENT':          'rgba(0,243,255,0.6)',
    'SPECIALIST':     'rgba(0,243,255,0.85)',
    'GHOST':          'rgba(157,0,255,0.9)',
    'NETRUNNER_ELITE':'#FFD700',
  };

  list.innerHTML = data.map(entry => {
    const isSelf  = selfId && entry.user_id === selfId;
    const posClass = entry.pos <= 3 ? `lb-pos-${entry.pos}` : '';
    const rankColor = RANK_COLORS[entry.rank_name] || 'rgba(0,243,255,0.6)';
    const medal = MEDAL[entry.pos] || entry.pos;
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

// Refresh leaderboard after sync if modal is open
function refreshLeaderboardIfOpen() {
  const modal = document.getElementById('leaderboard-modal');
  if (!modal?.open) return;
  invalidateLeaderboardCache();
  fetchLeaderboard().then(renderLeaderboard).catch(() => {});
}
