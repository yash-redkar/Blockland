/**
 * AudioSystem — Procedural retro sound effects using the Web Audio API.
 *
 * Why procedural?
 * → No external assets (.mp3, .ogg) required.
 * → Instant feedback even in a zero-asset environment.
 * → Precisely controllable frequency and timing.
 *
 * Sounds:
 *  - playJump() : Rapidly rising sine wave sweep.
 *  - playCoin() : High-frequency "ping" with a harmonic pop.
 *  - playHit()  : Low-frequency noise blast/thump.
 */
export class AudioSystem {
  private ctx: AudioContext;

  constructor() {
    // Falls back to standard browser AudioContext if Phaser isn't injected
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();
  }

  /**
   * Rising sweep for jumps.
   */
  playJump(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  /**
   * Dual-tone "ding" for coins.
   */
  playCoin(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1320, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  /**
   * Low noise thump for hits/damage.
   */
  playHit(): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  /**
   * Resume the context if it was suspended by browser autoplay policy.
   * Call this on the first user interaction (e.g. game start).
   */
  resume(): void {
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
}
