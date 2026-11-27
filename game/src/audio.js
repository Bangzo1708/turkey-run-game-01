// audio.js — all sound is synthesized live with WebAudio: no audio files,
// no copyrighted music, just oscillators and noise shaped into a farmyard.
// Every sound is a small function so the game can call it by name.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  // Browsers only allow audio after a user gesture; call from the first
  // click or key press, then everything else just works.
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  _tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise(dur, vol, filterFreq) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start(t0);
  }

  // The turkey's own voice: two quick low gobbles.
  gobble() {
    this._tone(180, 0.09, 'sawtooth', 0.16, 120);
    setTimeout(() => this._tone(150, 0.12, 'sawtooth', 0.16, 90), 110);
  }

  jump() {
    this._tone(280, 0.18, 'sine', 0.2, 620);
  }

  slide() {
    this._noise(0.22, 0.12, 900);
  }

  dash() {
    this._noise(0.18, 0.2, 2400);
    this._tone(500, 0.14, 'triangle', 0.12, 900);
  }

  corn() {
    this._tone(880, 0.08, 'sine', 0.18);
    setTimeout(() => this._tone(1320, 0.12, 'sine', 0.16), 70);
  }

  goldenCorn() {
    [660, 880, 1100, 1320].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.12, 'triangle', 0.16), i * 60),
    );
  }

  thud() {
    this._noise(0.16, 0.3, 300);
    this._tone(90, 0.16, 'sine', 0.25, 50);
  }

  knifeWhizz() {
    this._noise(0.25, 0.14, 3200);
  }

  ovenSizzle() {
    this._noise(0.5, 0.1, 5000);
  }

  // Rising alarm when the farmer gets dangerously close.
  farmerClose() {
    this._tone(220, 0.16, 'square', 0.1, 330);
    setTimeout(() => this._tone(220, 0.16, 'square', 0.1, 330), 200);
  }

  caught() {
    [392, 330, 262, 196].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.28, 'sawtooth', 0.18), i * 180),
    );
  }

  escaped() {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => this._tone(f, 0.22, 'triangle', 0.2), i * 130),
    );
  }

  click() {
    this._tone(700, 0.05, 'sine', 0.12);
  }

  // A cheerful plucked banjo-ish loop: C major pentatonic over a walking bass.
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const melody = [523, 587, 659, 784, 880, 784, 659, 587];
    const bass = [131, 98, 110, 131];
    this.musicTimer = setInterval(() => {
      if (this.muted) return;
      const m = melody[this.musicStep % melody.length];
      const b = bass[Math.floor(this.musicStep / 2) % bass.length];
      this._tone(m, 0.22, 'triangle', 0.07);
      if (this.musicStep % 2 === 0) this._tone(b, 0.4, 'sine', 0.09);
      this.musicStep++;
    }, 260);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
