// ── Sound Engine (Web Audio API) ──
const SoundEngine = {
  ctx: null,
  enabled: localStorage.getItem('breachos_sound') !== 'off',
  soundTheme: null,

  init() {
    if (this.ctx) return;
    const AudioCtx = globalThis.AudioContext || globalThis.webkitAudioContext;

    if (AudioCtx) {
      this.ctx = new AudioCtx();
    } else {
      console.warn('[Netrunner.AUDIO] AudioContext not supported');
      this.ctx = null;
    }
  },

  _shouldPlay() {
    return this.enabled && this.ctx && !document.body.classList.contains('safe-mode');
  },

  _getTheme() {
    return this.soundTheme || {
      flip: { filterFreq: 2000, filterQ: 1.5, gain: 0.15, dur: 0.05 },
      match: { type: 'square', freqs: [400, 600], ramp: 2, gain: 0.08, dur: 0.25 },
      error: { type: 'sawtooth', freq: 120, detune: 15, gain: 0.1, dur: 0.2 },
      win: { type: 'sine', notes: [523.25, 659.25, 783.99, 1046.5], gain: 0.12, spacing: 0.12 },
      tick: { type: 'square', freq: 1000, warnFreq: 1500, gain: 0.06 },
    };
  },

  flip() {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const t = this._getTheme().flip;
    const bufferSize = ctx.sampleRate * t.dur;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Non-cryptographic randomness is intentional here (audio noise generation)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // NOSONAR
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = t.filterFreq;
    filter.Q.value = t.filterQ;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(t.gain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t.dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + t.dur);
  },

  match() {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const t = this._getTheme().match;

    t.freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = t.type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * t.ramp, now + 0.2);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(t.gain, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t.dur + i * 0.05);

      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.05);
      osc.stop(now + t.dur + 0.05);
    });
  },

  error() {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const t = this._getTheme().error;

    const osc = ctx.createOscillator();
    osc.type = t.type;
    osc.frequency.setValueAtTime(t.freq, now);
    osc.detune.setValueAtTime(t.detune, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(t.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t.dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + t.dur);
  },

  win() {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const t = this._getTheme().win;

    t.notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = t.type;
      osc.frequency.value = freq;

      const gain = ctx.createGain();
      const start = now + i * t.spacing;
      gain.gain.setValueAtTime(t.gain, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

      const delay = ctx.createDelay();
      delay.delayTime.value = 0.15;
      const delayGain = ctx.createGain();
      delayGain.gain.value = 0.3;

      osc.connect(gain).connect(ctx.destination);
      gain.connect(delay).connect(delayGain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  },

  lose() {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.6;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Non-cryptographic randomness is intentional here (audio noise generation)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // NOSONAR
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const waveshaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i * 2) / 256 - 1;
      curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.3);
    }
    waveshaper.curve = curve;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.6);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(waveshaper).connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.6);
  },

  tick(warning = false) {
    if (!this._shouldPlay()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const t = this._getTheme().tick;
    const freq = warning ? t.warnFreq : t.freq;
    const dur = warning ? 0.02 : 0.03;

    const osc = ctx.createOscillator();
    osc.type = t.type;
    osc.frequency.value = freq;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(t.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur);
  },

  toggle() {
    this.enabled = !this.enabled;
    localStorage.setItem('breachos_sound', this.enabled ? 'on' : 'off');
    const label = this.enabled ? 'SOUND: ON' : 'SOUND: OFF';
    const btn = document.getElementById('sound-toggle');
    if (btn) btn.textContent = label;
    const btnMobile = document.getElementById('sound-toggle-mobile');
    if (btnMobile) {
      btnMobile.textContent = label;
      btnMobile.classList.toggle('sound-off', !this.enabled);
    }
  }
};
