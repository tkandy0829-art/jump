class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMusicPlaying = false;

  private init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
    this.masterGain.gain.value = 0.3;
  }

  // Music disabled as per user request
  public async startMusic() {
    this.isMusicPlaying = false;
  }

  public stopMusic() {
    this.isMusicPlaying = false;
  }

  public playJump() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.1);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.1);
  }

  // Jingle effect for 1 second
  public playCollectJingle() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    for (let i = 0; i < 5; i++) {
        const time = now + i * 0.15;
        const osc = this.audioCtx.createOscillator();
        const g = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + i * 200, time);
        g.gain.setValueAtTime(0.1, time);
        g.gain.exponentialRampToValueAtTime(0.0001, time + 0.4);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.4);
    }
  }

  // Explosion effect for 1.5 seconds
  public playStompExplosion() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const duration = 1.5;
    
    // Noise buffer for explosion
    const bufferSize = this.audioCtx.sampleRate * duration;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(20, now + duration);

    const g = this.audioCtx.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    noise.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);

    noise.start(now);
    noise.stop(now + duration);
  }

  // Death effect for 2 seconds
  public playDeathSound() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const duration = 2.0;

    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(40, now + duration);

    g.gain.setValueAtTime(0.3, now);
    for (let i = 0; i < 10; i++) {
        g.gain.setValueAtTime(0.3, now + i * 0.2);
        g.gain.setValueAtTime(0.05, now + i * 0.2 + 0.1);
    }
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playGunshot() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
    
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(now + 0.2);
  }
}

export const soundEngine = new SoundEngine();
