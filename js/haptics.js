// ── Haptic Feedback (Vibration API) ──

const Haptics = {
  _supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,

  _ok() {
    return this._supported && !document.body.classList.contains('safe-mode');
  },

  flip()  { if (this._ok()) navigator.vibrate(10); },

  match() { if (this._ok()) navigator.vibrate([40, 25, 40]); },

  error() { if (this._ok()) navigator.vibrate(80); },

  combo(n) {
    if (!this._ok()) return;
    if      (n >= 7) navigator.vibrate([50, 15, 50, 15, 50, 15, 50]);
    else if (n >= 5) navigator.vibrate([40, 15, 40, 15, 40]);
    else if (n >= 3) navigator.vibrate([30, 15, 30, 15, 30]);
    else             navigator.vibrate([20, 15, 20]);
  },

  win()  { if (this._ok()) navigator.vibrate([50, 30, 50, 30, 100]); },

  lose() { if (this._ok()) navigator.vibrate([150, 50, 100]); },
};
