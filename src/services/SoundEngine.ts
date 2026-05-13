/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class SoundEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicOscillators: OscillatorNode[] = [];
  private isMusicPlaying = false;

  private init() {
    if (this.audioCtx) return;
    this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.connect(this.audioCtx.destination);
    this.masterGain.gain.value = 0.2;
  }

  public async startMusic() {
    this.init();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    if (this.audioCtx?.state === 'suspended') {
      await this.audioCtx.resume();
    }

    const playNote = (freq: number, time: number, duration: number) => {
      if (!this.audioCtx || !this.masterGain) return;
      const osc = this.audioCtx.createOscillator();
      const g = this.audioCtx.createGain();
      
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      
      g.gain.setValueAtTime(0.1, time);
      g.gain.exponentialRampToValueAtTime(0.0001, time + duration);
      
      osc.connect(g);
      g.connect(this.masterGain);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    // Simple procedural tech-loop
    const notes = [261.63, 293.66, 311.13, 349.23, 392.00, 415.30, 466.16]; // Cm scale
    let step = 0;
    const loop = () => {
      if (!this.isMusicPlaying) return;
      const now = this.audioCtx!.currentTime;
      const tempo = 0.125;
      
      // Bass line
      if (step % 4 === 0) {
        playNote(65.41, now, 0.4); // C2
      }
      
      // Melody
      if (Math.random() > 0.5) {
        const note = notes[Math.floor(Math.random() * notes.length)];
        playNote(note, now, 0.2);
      }

      step++;
      setTimeout(loop, tempo * 1000);
    };
    loop();
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
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.1);
  }

  public playStomp() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.2);
    g.gain.setValueAtTime(0.2, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.2);
  }

  public playCollect() {
    this.init();
    if (!this.audioCtx || !this.masterGain) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.setValueAtTime(1200, now + 0.05);
    g.gain.setValueAtTime(0.1, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start();
    osc.stop(now + 0.1);
  }
}

export const soundEngine = new SoundEngine();
