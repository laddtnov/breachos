// ── Haptic Feedback (Vibration API) ──

const Haptics = {
  _supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  enabled: true,

  _fire(pattern) {
    if (Haptics._supported && Haptics.enabled) {
      navigator.vibrate(pattern);
    }
  },

  toggle() {
    Haptics.enabled = !Haptics.enabled;
    localStorage.setItem('breachos_haptics', Haptics.enabled ? 'on' : 'off');
    // Render through syncButton rather than repeating the label logic here.
    // The copy that used to live in this function is how the two drifted:
    // syncButton was updated and this one was not, so the state flipped while
    // the button kept reading HAPTICS: ON and looked dead. setPreset already
    // delegates the same way, which is why the BUZZ control never broke.
    Haptics.syncButton();
    // Confirm buzz when enabling
    if (Haptics.enabled && Haptics._supported) navigator.vibrate(150);
  },

  syncButton() {
    // The control lives in the SETTINGS modal. It was #haptic-toggle-mobile in
    // the old flat mobile menu, which v1.7.0 removed.
    const btn = document.getElementById('haptic-toggle');
    if (!btn) return;
    if (!Haptics._supported) {
      btn.textContent = 'HAPTICS: N/A';
      btn.disabled = true;
      return;
    }
    btn.textContent = Haptics.enabled ? 'HAPTICS: ON' : 'HAPTICS: OFF';
    btn.classList.toggle('haptics-off', !Haptics.enabled);
    btn.disabled = false;
  },

  // Patterns come from js/haptic-patterns.js so they stay testable.
  _pattern(event, level) {
    return hapticPattern(Haptics.preset, event, level);
  },

  setPreset(id) {
    Haptics.preset = hapticPresetIds().includes(id) ? id : HAPTIC_DEFAULT_PRESET;
    localStorage.setItem('breachos_haptic_preset', Haptics.preset);
    Haptics.syncPresetButton();
    // Preview the new strength so the choice is felt, not just read.
    if (Haptics.enabled && Haptics._supported) navigator.vibrate(Haptics._pattern('match'));
  },

  cyclePreset() {
    const ids = hapticPresetIds();
    const next = ids[(ids.indexOf(Haptics.preset) + 1) % ids.length];
    Haptics.setPreset(next);
  },

  syncPresetButton() {
    // Match the HAPTICS toggle: on a device with no Vibration API the control
    // reads N/A rather than sitting there inert with no explanation.
    const label = Haptics._supported
      ? (HAPTIC_PRESET_LABELS[Haptics.preset] ?? Haptics.preset)
      : 'N/A';
    const status = document.getElementById('haptic-preset-status');
    if (status) status.textContent = label;
    const btn = document.getElementById('haptic-preset-btn');
    if (btn) btn.disabled = !Haptics._supported;
  },

  flip()  { Haptics._fire(Haptics._pattern('flip')); },
  match() { Haptics._fire(Haptics._pattern('match')); },
  error() { Haptics._fire(Haptics._pattern('error')); },
  combo(n) { Haptics._fire(Haptics._pattern('combo', n)); },
  win()  { Haptics._fire(Haptics._pattern('win')); },
  lose() { Haptics._fire(Haptics._pattern('lose')); },
};

// Read saved preferences after object is fully created
Haptics.enabled = localStorage.getItem('breachos_haptics') !== 'off';
Haptics.preset = localStorage.getItem('breachos_haptic_preset') ?? HAPTIC_DEFAULT_PRESET;
if (!hapticPresetIds().includes(Haptics.preset)) Haptics.preset = HAPTIC_DEFAULT_PRESET;
