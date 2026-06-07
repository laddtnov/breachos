// ── Table Themes ──

const TABLE_THEMES = [
  { id: 'cyber',  name: 'CYBER',        desc: 'Default cyan neon' },
  { id: 'blood',  name: 'BLOOD CIRCUIT', desc: 'Crimson red glow' },
  { id: 'matrix', name: 'MATRIX',       desc: 'Green terminal' },
  { id: 'solar',  name: 'SOLAR FLARE',  desc: 'Gold amber warmth' },
  { id: 'void',   name: 'VOID',         desc: 'Ultraviolet purple' },
  { id: 'ice',    name: 'ICE COLD',     desc: 'Arctic blue-white freeze' },
  { id: 'toxic',  name: 'TOXIC WASTE',  desc: 'Radioactive lime acid' },
  { id: 'ember',    name: 'EMBER CORE',   desc: 'Deep orange inferno' },
  { id: 'midnight', name: 'MIDNIGHT',     desc: 'Deep indigo electric' },
  { id: 'sakura',   name: 'SAKURA',       desc: 'Cherry blossom pink' },
  { id: 'storm',    name: 'STORM SURGE',  desc: 'Electric silver lightning' },
];

function applyTheme(themeId) {
  TABLE_THEMES.forEach(t => {
    document.body.classList.remove('theme-' + t.id);
  });
  if (themeId !== 'cyber') {
    document.body.classList.add('theme-' + themeId);
  }
}

function selectTheme(themeId) {
  playerStats.activeTheme = themeId;
  saveStats(playerStats);
  applyTheme(themeId);
  renderThemeModal();
}

function toggleThemeModal() {
  const modal = document.getElementById('theme-modal');
  if (!modal) return;
  modal.classList.toggle('hidden');
  if (!modal.classList.contains('hidden')) renderThemeModal();
}

function renderThemeModal() {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;

  const activeTheme = playerStats.activeTheme || 'cyber';

  grid.innerHTML = TABLE_THEMES.map(theme => {
    const isActive = activeTheme === theme.id;
    return `
      <button class="theme-item ${isActive ? 'active' : ''}"
              onclick="selectTheme('${theme.id}')"
              aria-pressed="${isActive}">
        <div class="theme-preview theme-preview-${theme.id}"></div>
        <span class="theme-name">${theme.name}</span>
        <span class="theme-desc">${theme.desc}</span>
      </button>
    `;
  }).join('');
}

// Apply saved theme on load
applyTheme(playerStats.activeTheme || 'cyber');
