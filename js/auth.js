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
    if (!res.ok) throw new Error('Server error');
    const { stats } = await res.json();
    const merged = mergeStats(playerStats, stats);
    playerStats = merged;
    saveStats(merged);
    if (typeof updateRankHUD === 'function') updateRankHUD();
  } catch (e) {
    console.warn('[SYNC] Load failed', e?.message);
    throw e;
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
  return data;
}

function authLogout() {
  clearAuth();
  updateAuthUI();
  showAuthPanel('choose');
}

// ── Panel navigation ──
function showAuthPanel(name) {
  ['choose','signup','emailsent','login','syncing','loggedin'].forEach(p => {
    document.getElementById('auth-panel-' + p)?.classList.add('hidden');
  });
  document.getElementById('auth-panel-' + name)?.classList.remove('hidden');
}

// ── Modal open/close ──
function toggleAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  if (modal.open) {
    modal.close();
    return;
  }

  // Show correct starting panel
  if (isLoggedIn()) {
    showAuthPanel('syncing');
    _runSync();
  } else {
    showAuthPanel('choose');
  }

  const menuDialog = document.getElementById('menu-dialog');
  if (menuDialog?.open) {
    const onMenuClose = () => {
      menuDialog.removeEventListener('close', onMenuClose);
      modal.showModal();
    };
    menuDialog.addEventListener('close', onMenuClose);
    menuDialog.close();
    document.getElementById('menu-btn')?.classList.remove('open');
  } else {
    modal.showModal();
  }
}

// ── Sync with status display ──
async function _runSync() {
  const title   = document.getElementById('sync-status-title');
  const msg     = document.getElementById('sync-status-msg');
  const spinner = document.getElementById('sync-spinner');
  const retry   = document.getElementById('sync-retry-btn');
  const modal   = document.getElementById('auth-modal');

  if (title)   title.textContent  = 'SYNCING...';
  if (msg)     msg.textContent    = 'Connecting to the net...';
  if (spinner) spinner.classList.remove('hidden');
  if (retry)   retry.classList.add('hidden');

  try {
    await syncSave();
    await syncLoad();
    if (title)   title.textContent = 'SYNCED ✔';
    if (msg)     msg.textContent   = 'Progress saved across all devices.';
    if (spinner) spinner.classList.add('hidden');
    // Auto-close after 1.5 s on success
    setTimeout(() => { if (modal?.open) modal.close(); }, 1500);
  } catch {
    if (title)   title.textContent = 'SYNC FAILED';
    if (msg)     msg.textContent   = 'Could not reach the net. Try again.';
    if (spinner) spinner.classList.add('hidden');
    if (retry)   retry.classList.remove('hidden');
  }
}

async function handleManualSync() {
  showAuthPanel('syncing');
  await _runSync();
}

// ── Register handler ──
async function handleRegister() {
  const email    = document.getElementById('reg-email')?.value.trim();
  const password = document.getElementById('reg-password')?.value;
  const username = document.getElementById('reg-username')?.value.trim();
  const btn      = document.getElementById('reg-btn');
  const err      = document.getElementById('reg-error');

  if (err) err.textContent = '';
  if (btn) { btn.textContent = 'CONNECTING...'; btn.disabled = true; }

  try {
    await authRegister(email, password, username);
    // Show "check your email" panel
    showAuthPanel('emailsent');
  } catch (e) {
    if (err) err.textContent = e.message;
    if (btn) { btn.textContent = 'CREATE ACCOUNT'; btn.disabled = false; }
  }
}

// ── Login handler ──
async function handleLogin() {
  const email    = document.getElementById('login-email')?.value.trim();
  const password = document.getElementById('login-password')?.value;
  const btn      = document.getElementById('login-btn');
  const err      = document.getElementById('login-error');

  if (err) err.textContent = '';
  if (btn) { btn.textContent = 'CONNECTING...'; btn.disabled = true; }

  try {
    await authLogin(email, password);
    // Show username panel briefly, then sync
    const usernameEl = document.getElementById('auth-username-display');
    if (usernameEl) usernameEl.textContent = authState.user?.username || 'NETRUNNER';
    showAuthPanel('syncing');
    await _runSync();
  } catch (e) {
    if (err) err.textContent = e.message;
    if (btn) { btn.textContent = 'CONNECT'; btn.disabled = false; }
  }
}

// ── Sync button label ──
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

// ── On page load ──
window.addEventListener('load', () => {
  updateAuthUI();
  if (isLoggedIn()) syncLoad().catch(() => {});
});
