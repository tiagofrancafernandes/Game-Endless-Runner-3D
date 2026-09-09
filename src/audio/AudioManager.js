/**
 * AudioManager - Web Audio API procedural sound synthesizer
 * Provides retro/arcade sound effects and dynamic background music
 * with 0 external audio files needed.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;

    this.isMuted = false;
    this.sfxEnabled = true;
    this.musicEnabled = true;
    this.isMusicPlaying = false;
    this.musicInterval = null;
    this.musicStep = 0;

    // Load saved settings
    this.loadSettings();
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxEnabled ? 0.7 : 0;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicEnabled ? 0.25 : 0;
      this.musicGain.connect(this.masterGain);

      if (this.musicEnabled) {
        this.startMusic();
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('endless_runner_audio');
      if (saved) {
        const data = JSON.parse(saved);
        this.isMuted = !!data.isMuted;
        this.sfxEnabled = data.sfxEnabled !== undefined ? !!data.sfxEnabled : true;
        this.musicEnabled = data.musicEnabled !== undefined ? !!data.musicEnabled : true;
      }
    } catch (e) {
      console.warn('Could not read audio settings:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('endless_runner_audio', JSON.stringify({
        isMuted: this.isMuted,
        sfxEnabled: this.sfxEnabled,
        musicEnabled: this.musicEnabled
      }));
    } catch (e) {
      console.warn('Could not save audio settings:', e);
    }
  }

  toggleMute() {
    this.ensureContext();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.6, this.ctx.currentTime);
    }
    this.saveSettings();
    return this.isMuted;
  }

  toggleSfx() {
    this.ensureContext();
    this.sfxEnabled = !this.sfxEnabled;
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.sfxEnabled ? 0.7 : 0, this.ctx.currentTime);
    }
    this.saveSettings();
    if (this.sfxEnabled) {
      this.playClick();
    }
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.ensureContext();
    this.musicEnabled = !this.musicEnabled;
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.musicEnabled ? 0.25 : 0, this.ctx.currentTime);
    }
    if (this.musicEnabled && !this.isMusicPlaying) {
      this.startMusic();
    } else if (!this.musicEnabled && this.isMusicPlaying) {
      this.stopMusic();
    }
    this.saveSettings();
    return this.musicEnabled;
  }

  playJump() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.15);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  playFruit() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.04 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.13);
    });
  }

  playHit() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Low pitch drop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);

    // Noise buffer for impact crunch
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.linearRampToValueAtTime(100, now + 0.15);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
  }

  playClick() {
    if (!this.sfxEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  startMusic() {
    if (this.isMusicPlaying || !this.musicEnabled) return;
    this.isMusicPlaying = true;

    // Upbeat electronic melodic sequence
    const tempo = 135; // BPM
    const stepTime = (60 / tempo) / 2; // 8th notes (approx 0.22s)
    
    // Bass notes & Lead melody pattern
    const bassNotes = [110, 110, 130.81, 146.83, 110, 110, 164.81, 146.83]; // A2, C3, D3, E3
    const leadNotes = [
      440, 0, 523.25, 659.25, 587.33, 0, 440, 523.25,
      659.25, 0, 587.33, 523.25, 440, 392, 440, 0
    ];

    let step = 0;
    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.musicEnabled || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Bass note
      const bassFreq = bassNotes[step % bassNotes.length];
      if (bassFreq > 0) {
        const bOsc = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bOsc.type = 'sawtooth';
        bOsc.frequency.setValueAtTime(bassFreq, now);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(350, now);

        bGain.gain.setValueAtTime(0.15, now);
        bGain.gain.exponentialRampToValueAtTime(0.01, now + stepTime * 0.9);

        bOsc.connect(filter);
        filter.connect(bGain);
        bGain.connect(this.musicGain);

        bOsc.start(now);
        bOsc.stop(now + stepTime * 0.9);
      }

      // Lead note
      const leadFreq = leadNotes[step % leadNotes.length];
      if (leadFreq > 0) {
        const lOsc = this.ctx.createOscillator();
        const lGain = this.ctx.createGain();
        lOsc.type = 'triangle';
        lOsc.frequency.setValueAtTime(leadFreq, now);

        lGain.gain.setValueAtTime(0.08, now);
        lGain.gain.exponentialRampToValueAtTime(0.005, now + stepTime * 0.7);

        lOsc.connect(lGain);
        lGain.connect(this.musicGain);

        lOsc.start(now);
        lOsc.stop(now + stepTime * 0.7);
      }

      step = (step + 1) % 16;
    }, stepTime * 1000);
  }

  stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }
}

export const audioManager = new AudioManager();
