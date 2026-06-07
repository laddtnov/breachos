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
    const isActive = btn.dataset.tab === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
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
  const setSingleMessage = (text, isError = false) => {
    list.replaceChildren();
    const li = document.createElement('li');
    li.classList.add('lb-message');
    if (isError) li.classList.add('lb-error');
    li.textContent = text;
    list.appendChild(li);
  };

  if (data === null) {
    setSingleMessage('SIGNAL LOST — COULD NOT REACH NET', true);
    srAnnounce('Leaderboard error — could not load rankings'); // WCAG 4.1.3
    return;
  }
  if (data.length === 0) {
    const msg = isDaily
      ? 'NO DAILY SCORES YET — COMPLETE TODAY\'S CHALLENGE'
      : 'NO AGENTS RANKED YET — BE THE FIRST';
    setSingleMessage(msg);
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

  const fragment = document.createDocumentFragment();
  data.forEach(entry => {
    const isSelf   = selfId && entry.user_id === selfId;
    const posClass = entry.pos <= 3 ? `lb-pos-${entry.pos}` : '';
    const medal    = MEDAL[entry.pos] || entry.pos;
    const item = document.createElement('li');
    item.classList.add('lb-entry');
    if (posClass) item.classList.add(posClass);
    if (isSelf) item.classList.add('lb-self');

    const medalEl = document.createElement('span');
    medalEl.className = 'lb-medal';
    medalEl.textContent = String(medal);
    item.appendChild(medalEl);

    const usernameEl = document.createElement('span');
    usernameEl.className = 'lb-username';
    usernameEl.textContent = `${entry.username || ''}${isSelf ? ' ◀' : ''}`;
    item.appendChild(usernameEl);

    if (isDaily) {
      const diffColor = DIFF_COLORS[entry.difficulty] || '#00f3ff';
      const time = typeof entry.time_secs === 'number'
        ? Math.floor(entry.time_secs / 60).toString().padStart(2,'0') + ':' +
          (entry.time_secs % 60).toString().padStart(2,'0')
        : '--:--';
      const rankEl = document.createElement('span');
      rankEl.className = 'lb-rank';
      rankEl.style.color = diffColor;
      rankEl.textContent = String(entry.difficulty || '').toUpperCase();
      item.appendChild(rankEl);

      const xpEl = document.createElement('span');
      xpEl.className = 'lb-xp';
      xpEl.textContent = time;
      item.appendChild(xpEl);

      fragment.appendChild(item);
      return;
    }

    const rankColor = RANK_COLORS[entry.rank_name] || 'rgba(0,243,255,0.6)';
    const rankEl = document.createElement('span');
    rankEl.className = 'lb-rank';
    rankEl.style.color = rankColor;
    rankEl.textContent = entry.rank_name || 'ROOKIE';
    item.appendChild(rankEl);

    const xpEl = document.createElement('span');
    xpEl.className = 'lb-xp';
    xpEl.textContent = `${Number(entry.xp).toLocaleString()} XP`;
    item.appendChild(xpEl);

    fragment.appendChild(item);
  });
  list.replaceChildren(fragment);
  srAnnounce(`Leaderboard updated — ${data.length} ${data.length === 1 ? 'entry' : 'entries'}`); // WCAG 4.1.3

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
