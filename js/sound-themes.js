// ── Sound Themes ──

const SOUND_THEMES = {
  cyber: {
    name: 'CYBER',
    desc: 'Default digital pulses',
    flip: { type: 'noise', filterFreq: 2000, filterQ: 1.5, gain: 0.15, dur: 0.05 },
    match: { type: 'square', freqs: [400, 600], ramp: 2, gain: 0.08, dur: 0.25 },
    error: { type: 'sawtooth', freq: 120, detune: 15, gain: 0.1, dur: 0.2 },
    win: { type: 'sine', notes: [523.25, 659.25, 783.99, 1046.5], gain: 0.12, spacing: 0.12 },
    tick: { type: 'square', freq: 1000, warnFreq: 1500, gain: 0.06 },
  },
  retro: {
    name: 'RETRO 8-BIT',
    desc: 'Classic chiptune beeps',
    flip: { type: 'noise', filterFreq: 4000, filterQ: 3, gain: 0.1, dur: 0.03 },
    match: { type: 'square', freqs: [262, 524], ramp: 1, gain: 0.1, dur: 0.15 },
    error: { type: 'square', freq: 80, detune: 0, gain: 0.12, dur: 0.15 },
    win: { type: 'square', notes: [262, 330, 392, 524], gain: 0.1, spacing: 0.1 },
    tick: { type: 'square', freq: 800, warnFreq: 1200, gain: 0.05 },
  },
  synth: {
    name: 'SYNTHWAVE',
    desc: 'Warm analog tones',
    flip: { type: 'noise', filterFreq: 1200, filterQ: 0.8, gain: 0.1, dur: 0.08 },
    match: { type: 'sine', freqs: [330, 440], ramp: 1.5, gain: 0.1, dur: 0.35 },
    error: { type: 'triangle', freq: 150, detune: 10, gain: 0.08, dur: 0.3 },
    win: { type: 'sine', notes: [440, 554.37, 659.25, 880], gain: 0.1, spacing: 0.15 },
    tick: { type: 'sine', freq: 660, warnFreq: 880, gain: 0.04 },
  },
  glitch: {
    name: 'GLITCH',
    desc: 'Harsh digital noise',
    flip: { type: 'noise', filterFreq: 6000, filterQ: 5, gain: 0.2, dur: 0.03 },
    match: { type: 'sawtooth', freqs: [200, 800], ramp: 4, gain: 0.08, dur: 0.15 },
    error: { type: 'sawtooth', freq: 60, detune: 50, gain: 0.15, dur: 0.25 },
    win: { type: 'sawtooth', notes: [300, 600, 900, 1200], gain: 0.08, spacing: 0.08 },
    tick: { type: 'sawtooth', freq: 2000, warnFreq: 3000, gain: 0.04 },
  },
  minimal: {
    name: 'MINIMAL',
    desc: 'Clean soft pings',
    flip: { type: 'noise', filterFreq: 1500, filterQ: 1, gain: 0.08, dur: 0.04 },
    match: { type: 'sine', freqs: [520, 780], ramp: 1.2, gain: 0.06, dur: 0.3 },
    error: { type: 'sine', freq: 200, detune: 0, gain: 0.06, dur: 0.15 },
    win: { type: 'sine', notes: [440, 550, 660, 880], gain: 0.08, spacing: 0.18 },
    tick: { type: 'sine', freq: 500, warnFreq: 700, gain: 0.03 },
  },
  horror: {
    name: 'HORROR',
    desc: 'Dark unsettling dread',
    flip: { type: 'noise', filterFreq: 400, filterQ: 0.5, gain: 0.12, dur: 0.1 },
    match: { type: 'triangle', freqs: [110, 165], ramp: 0.5, gain: 0.1, dur: 0.5 },
    error: { type: 'sawtooth', freq: 55, detune: 30, gain: 0.14, dur: 0.4 },
    win: { type: 'triangle', notes: [220, 261.63, 329.63, 440], gain: 0.1, spacing: 0.2 },
    tick: { type: 'triangle', freq: 300, warnFreq: 180, gain: 0.06 },
  },
  jazz: {
    name: 'JAZZ RUNNER',
    desc: 'Smooth late-night vibes',
    flip: { type: 'noise', filterFreq: 800, filterQ: 0.6, gain: 0.07, dur: 0.06 },
    match: { type: 'sine', freqs: [370, 466], ramp: 0.8, gain: 0.08, dur: 0.4 },
    error: { type: 'triangle', freq: 233, detune: 5, gain: 0.07, dur: 0.25 },
    win: { type: 'sine', notes: [392, 466.16, 587.33, 783.99], gain: 0.09, spacing: 0.14 },
    tick: { type: 'sine', freq: 440, warnFreq: 587, gain: 0.04 },
  },
  rave: {
    name: 'RAVE CORE',
    desc: 'High-energy floor bangers',
    flip: { type: 'noise', filterFreq: 8000, filterQ: 8, gain: 0.18, dur: 0.02 },
    match: { type: 'square', freqs: [880, 1320], ramp: 6, gain: 0.09, dur: 0.1 },
    error: { type: 'sawtooth', freq: 40, detune: 80, gain: 0.18, dur: 0.2 },
    win: { type: 'square', notes: [440, 880, 1320, 1760], gain: 0.09, spacing: 0.06 },
    tick: { type: 'square', freq: 1800, warnFreq: 2400, gain: 0.05 },
  },
  ambient: {
    name: 'AMBIENT VOID',
    desc: 'Floating space station drones',
    flip: { type: 'noise', filterFreq: 600, filterQ: 0.3, gain: 0.06, dur: 0.12 },
    match: { type: 'sine', freqs: [220, 277], ramp: 0.4, gain: 0.07, dur: 0.6 },
    error: { type: 'triangle', freq: 90, detune: 8, gain: 0.06, dur: 0.5 },
    win: { type: 'sine', notes: [261.63, 329.63, 392, 523.25], gain: 0.08, spacing: 0.22 },
    tick: { type: 'sine', freq: 380, warnFreq: 280, gain: 0.03 },
  },
  arcade: {
    name: 'ARCADE',
    desc: 'Classic pinball machine tones',
    flip: { type: 'noise', filterFreq: 5000, filterQ: 6, gain: 0.14, dur: 0.025 },
    match: { type: 'square', freqs: [600, 900], ramp: 5, gain: 0.1, dur: 0.12 },
    error: { type: 'square', freq: 100, detune: 20, gain: 0.13, dur: 0.18 },
    win: { type: 'square', notes: [523.25, 659.25, 783.99, 1046.5], gain: 0.1, spacing: 0.09 },
    tick: { type: 'square', freq: 1200, warnFreq: 1600, gain: 0.06 },
  },
  neonbass: {
    name: 'NEON BASS',
    desc: 'Deep sub-bass neon vibrations',
    flip: { type: 'noise', filterFreq: 300, filterQ: 2, gain: 0.16, dur: 0.07 },
    match: { type: 'sine', freqs: [55, 110], ramp: 0.6, gain: 0.14, dur: 0.4 },
    error: { type: 'sawtooth', freq: 35, detune: 25, gain: 0.16, dur: 0.35 },
    win: { type: 'sine', notes: [110, 138.59, 164.81, 220], gain: 0.13, spacing: 0.18 },
    tick: { type: 'sine', freq: 160, warnFreq: 120, gain: 0.07 },
  },
};

// Apply sound theme to engine
function applySoundTheme(themeId) {
  SoundEngine.soundTheme = SOUND_THEMES[themeId] || SOUND_THEMES.cyber;
}

function selectSoundTheme(themeId) {
  playerStats.activeSoundTheme = themeId;
  saveStats(playerStats);
  applySoundTheme(themeId);
  renderSoundThemeModal();
}

function toggleSoundThemeModal() {
  const modal = document.getElementById('sound-theme-modal');
  if (!modal) return;
  if (modal.open) {
    modal.close();
  } else {
    modal.showModal();
    renderSoundThemeModal();
  }
}

function renderSoundThemeModal() {
  const grid = document.getElementById('sound-theme-grid');
  if (!grid) return;

  const activeId = playerStats.activeSoundTheme || 'cyber';

  grid.innerHTML = Object.entries(SOUND_THEMES).map(([id, theme]) => {
    const isActive = activeId === id;
    return `
      <button class="sound-theme-item ${isActive ? 'active' : ''}"
              onclick="selectSoundTheme('${id}')"
              aria-pressed="${isActive}">
        <span class="sound-theme-name">${theme.name}</span>
        <span class="sound-theme-desc">${theme.desc}</span>
        <button class="sound-theme-preview" onclick="event.stopPropagation(); previewSoundTheme('${id}')">&#9654; PREVIEW</button>
      </button>
    `;
  }).join('');
}

function previewSoundTheme(themeId) {
  const prev = SoundEngine.soundTheme;
  applySoundTheme(themeId);
  SoundEngine.match();
  setTimeout(() => {
    SoundEngine.soundTheme = prev;
  }, 500);
}

// Init on load
applySoundTheme(playerStats.activeSoundTheme || 'cyber');
