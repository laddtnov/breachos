// ── Haptic Feedback (Vibration API) ──

const Haptics = {
  _supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  enabled: localStorage.getItem('breachos_haptics') !== 'off',

  _ok() {
    return this._supported && this.enabled &&
           !document.body.classList.contains('safe-mode');
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('breachos_haptics', this.enabled ? 'on' : 'off');
    const label = this.enabled ? 'HAPTICS: ON' : 'HAPTICS: OFF';
    const btn = document.getElementById('haptic-toggle-mobile');
    if (btn) {
      btn.textContent = label;
      btn.classList.toggle('haptics-off', !this.enabled);
    }
    if (this.enabled) navigator.vibrate?.(60); // confirm buzz when turning on
  },

  syncButton() {
    const btn = document.getElementById('haptic-toggle-mobile');
    if (!btn) return;
    const on = this._supported && this.enabled;
    btn.textContent = this._supported
      ? (this.enabled ? 'HAPTICS: ON' : 'HAPTICS: OFF')
      : 'HAPTICS: N/A';
    btn.classList.toggle('haptics-off', !on);
    btn.disabled = !this._supported;
  },

  test()  { return this._supported ? navigator.vibrate(300) : false; },

  flip()  { if (this._ok()) navigator.vibrate(30); },

  match() { if (this._ok()) navigator.vibrate([60, 40, 60]); },

  error() { if (this._ok()) navigator.vibrate(120); },

  combo(n) {
    if (!this._ok()) return;
    if      (n >= 7) navigator.vibrate([80, 30, 80, 30, 80, 30, 80]);
    else if (n >= 5) navigator.vibrate([70, 25, 70, 25, 70]);
    else if (n >= 3) navigator.vibrate([60, 20, 60, 20, 60]);
    else             navigator.vibrate([50, 20, 50]);
  },

  win()  { if (this._ok()) navigator.vibrate([80, 40, 80, 40, 150]); },

  lose() { if (this._ok()) navigator.vibrate([200, 60, 130]); },
};
