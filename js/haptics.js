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
    const btn = document.getElementById('haptic-toggle-mobile');
    if (btn) {
      btn.textContent = Haptics.enabled ? 'HAPTICS: ON' : 'HAPTICS: OFF';
      btn.classList.toggle('haptics-off', !Haptics.enabled);
    }
    // Confirm buzz when enabling
    if (Haptics.enabled && Haptics._supported) navigator.vibrate(150);
  },

  syncButton() {
    const btn = document.getElementById('haptic-toggle-mobile');
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

  flip()  { Haptics._fire(50); },
  match() { Haptics._fire([80, 40, 80]); },
  error() { Haptics._fire(150); },

  combo(n) {
    if (!Haptics._supported || !Haptics.enabled) return;
    if      (n >= 7) navigator.vibrate([100, 30, 100, 30, 100, 30, 100]);
    else if (n >= 5) navigator.vibrate([80, 25, 80, 25, 80]);
    else if (n >= 3) navigator.vibrate([70, 20, 70, 20, 70]);
    else             navigator.vibrate([60, 20, 60]);
  },

  win()  { Haptics._fire([100, 40, 100, 40, 180]); },
  lose() { Haptics._fire([220, 60, 150]); },
};

// Read saved preference after object is fully created
Haptics.enabled = localStorage.getItem('breachos_haptics') !== 'off';
