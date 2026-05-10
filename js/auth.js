// ── Auth & Cross-Device Sync ──

const AUTH_TOKEN_KEY = 'breachos_auth_token';
const AUTH_USER_KEY  = 'breachos_auth_user';

const authState = {
  token: localStorage.getItem(AUTH_TOKEN_KEY) || null,
  user:  JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null'),
};

function isLoggedIn() {
  return !!authState.token;
}

function persistAuth(token, user) {
  authState.token = token;
  authState.user  = user;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function clearAuth() {
  authState.token = null;
  authState.user  = null;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

// ── Merge: always take the higher value for numeric stats ──
function mergeStats(local, remote) {
  if (!remote || typeof remote !== 'object') return local;
  const nums = ['xp','gamesPlayed','gamesWon','bestCombo','totalMatches',
                'bestWave','dailyCompleted','blitzWins','perfectWins','dailyStreak'];
  const merged = { ...local };
  for (const key of nums) {
    merged[key] = Math.max(local[key] || 0, remote[key] || 0);
  }
  merged.unlockedAchievements = [
    ...new Set([...(local.unlockedAchievements || []), ...(remote.unlockedAchievements || [])]),
  ];
  merged.unlockedSkins = [
    ...new Set([...(local.unlockedSkins || []), ...(remote.unlockedSkins || [])]),
  ];
  // keep local preferences
  merged.activeSkin       = local.activeSkin;
  merged.activeTheme      = local.activeTheme;
  merged.activeSoundTheme = local.activeSoundTheme;
  return merged;
}

// ── Sync ──
async function syncSave() {
  if (!isLoggedIn()) return;
  try {
    await fetch('/api/sync/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`,
      },
      body: JSON.stringify({ stats: playerStats }),
    });
  } catch (e) {
    console.warn('[SYNC] Save failed', e?.message);
  }
}

async function syncLoad() {
  if (!isLoggedIn()) return;
  try {
    const res = await fetch('/api/sync/load', {
      headers: { 'Authorization': `Bearer ${authState.token}` },
    });
    if (res.status === 401) { clearAuth(); updateAuthUI(); return; }
    if (!res.ok) return;
    const { stats } = await res.json();
    const merged = mergeStats(playerStats, stats);
    playerStats = merged;
    saveStats(merged);
    if (typeof updateRankHUD === 'function') updateRankHUD();
  } catch (e) {
    console.warn('[SYNC] Load failed', e?.message);
  }
}

// ── API calls ──
async function authRegister(email, password, username) {
  const res  = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  persistAuth(data.token, data.user);
  updateAuthUI();
  await syncLoad();
  return data;
}

async function authLogin(email, password) {
  const res  = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  persistAuth(data.token, data.user);
  updateAuthUI();
  await syncLoad();
  return data;
}

function authLogout() {
  clearAuth();
  updateAuthUI();
}

// ── UI helpers ──
function updateAuthUI() {
  const loggedIn = isLoggedIn();
  const label    = loggedIn ? `SYNC: ${authState.user?.username || 'ON'}` : 'SYNC';

  const desktop = document.getElementById('sync-btn');
  if (desktop) {
    desktop.textContent = label;
    desktop.classList.toggle('sync-active', loggedIn);
  }

  const mobile = document.getElementById('sync-btn-mobile');
  if (mobile) {
    mobile.textContent = label;
    mobile.classList.toggle('sync-active', loggedIn);
  }
}

// ── Debug toast (temporary — remove after root cause found) ──
function _dbg(msg) {
  let el = document.getElementById('_auth_dbg');
  if (!el) {
    el = document.createElement('div');
    el.id = '_auth_dbg';
    el.style.cssText = 'position:fixed;bottom:10px;left:10px;right:10px;z-index:99999;background:#000;color:#0f0;font:12px monospace;padding:8px;border:1px solid #0f0;border-radius:4px;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = '[AUTH] ' + msg;
  clearTimeout(el._t);
  el._t = setTimeout(() => el.remove(), 6000);
}

function toggleAuthModal() {
  const modal = document.getElementById('auth-modal');
  _dbg('called. modal=' + (modal ? 'found' : 'NULL'));
  if (!modal) return;

  if (modal.open) {
    _dbg('closing open modal');
    modal.close();
    return;
  }

  const menuDialog = document.getElementById('menu-dialog');
  _dbg('menuDialog.open=' + (menuDialog?.open));

  if (menuDialog?.open) {
    const onMenuClose = () => {
      menuDialog.removeEventListener('close', onMenuClose);
      _dbg('menu closed — calling showModal');
      renderAuthModal();
      try {
        modal.showModal();
        _dbg('showModal() OK — modal.open=' + modal.open);
      } catch(e) {
        _dbg('showModal() ERROR: ' + e.message);
      }
    };
    menuDialog.addEventListener('close', onMenuClose);
    _dbg('closing menu...');
    menuDialog.close();
    document.getElementById('menu-btn')?.classList.remove('open');
  } else {
    renderAuthModal();
    try {
      modal.showModal();
      _dbg('showModal() OK (no menu) modal.open=' + modal.open);
    } catch(e) {
      _dbg('showModal() ERROR: ' + e.message);
    }
  }
}

function renderAuthModal() {
  const loggedIn  = document.getElementById('auth-logged-in');
  const loggedOut = document.getElementById('auth-logged-out');
  if (!loggedIn || !loggedOut) return;

  if (isLoggedIn()) {
    loggedIn.classList.remove('hidden');
    loggedOut.classList.add('hidden');
    const el = document.getElementById('auth-username-display');
    if (el) el.textContent = authState.user?.username || 'NETRUNNER';
  } else {
    loggedIn.classList.add('hidden');
    loggedOut.classList.remove('hidden');
  }
}

function switchAuthTab(tab) {
  document.getElementById('auth-signup-panel')?.classList.toggle('hidden', tab !== 'signup');
  document.getElementById('auth-login-panel')?.classList.toggle('hidden', tab !== 'login');
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
}

async function handleRegister() {
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const username = document.getElementById('reg-username')?.value.trim();
  const btn      = document.getElementById('reg-btn');
  const err      = document.getElementById('reg-error');

  err.textContent = '';
  btn.textContent = 'CONNECTING...';
  btn.disabled = true;

  try {
    await authRegister(email, password, username);
    toggleAuthModal();
  } catch (e) {
    err.textContent  = e.message;
    btn.textContent  = 'SIGN UP';
    btn.disabled     = false;
  }
}

async function handleLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const btn      = document.getElementById('login-btn');
  const err      = document.getElementById('login-error');

  err.textContent = '';
  btn.textContent = 'CONNECTING...';
  btn.disabled = true;

  try {
    await authLogin(email, password);
    toggleAuthModal();
  } catch (e) {
    err.textContent  = e.message;
    btn.textContent  = 'LOG IN';
    btn.disabled     = false;
  }
}

async function handleManualSync() {
  const btn = document.getElementById('manual-sync-btn');
  if (btn) { btn.textContent = 'SYNCING...'; btn.disabled = true; }
  await syncSave();
  await syncLoad();
  if (btn) {
    btn.textContent = 'SYNCED ✔';
    setTimeout(() => { btn.textContent = 'SYNC NOW'; btn.disabled = false; }, 2000);
  }
}

// ── On page load: pull latest progress ──
window.addEventListener('load', () => {
  updateAuthUI();
  if (isLoggedIn()) syncLoad().catch(() => {});
});
