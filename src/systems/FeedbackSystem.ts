import Phaser from "phaser";

/**
 * FeedbackSystem — Centralized manager for Phase 6 "juice".
 *
 * Responsibilities:
 *  - Particle emitters (Landing dust, Enemy stomp)
 *  - Camera effects (Screen shake, flash)
 *  - UI Feedback (Floating score text)
 *  - Global time manipulation (Death slow-mo)
 */
export class FeedbackSystem {
  private scene: Phaser.Scene;
  private dustEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private stompEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Initializes particle systems and generates textures if they are missing.
   * Call this in the Scene's create() or init().
   */
  init(): void {
    // ── Pre-check: Textures ──────────────────────────────────────────────────
    // If the PreloadScene didn't create these, we generate them on-the-fly.
    if (!this.scene.textures.exists("particle-dust")) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xccbbaa);
      g.fillCircle(4, 4, 4);
      g.generateTexture("particle-dust", 8, 8);
      g.destroy();
    }
    if (!this.scene.textures.exists("particle-star")) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffdd44);
      g.fillCircle(4, 4, 4);
      g.generateTexture("particle-star", 8, 8);
      g.destroy();
    }

    // ── Dust Emitter ─────────────────────────────────────────────────────────
    this.dustEmitter = this.scene.add.particles(0, 0, "particle-dust", {
      speed: { min: 20, max: 55 },
      angle: { min: 200, max: 340 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 320,
      quantity: 6,
      emitting: false,
    });
    this.dustEmitter.setDepth(15);

    // ── Stomp Emitter (Stars) ────────────────────────────────────────────────
    this.stompEmitter = this.scene.add.particles(0, 0, "particle-star", {
      speed: { min: 60, max: 140 },
      angle: { min: 220, max: 320 },
      scale: { start: 0.7, end: 0 },
      lifespan: 450,
      quantity: 10,
      emitting: false,
    });
    this.stompEmitter.setDepth(15);
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  /**
   * Dusty puff + subtle shake on landing.
   */
  landingDust(x: number, y: number): void {
    this.dustEmitter.setPosition(x, y);
    this.dustEmitter.explode(8);
    this.scene.cameras.main.shake(80, 0.005);
  }

  /**
   * Star explosion + camera shake on enemy stomp.
   */
  enemyStomp(x: number, y: number): void {
    this.stompEmitter.setPosition(x, y);
    this.stompEmitter.explode(12);
    this.scene.cameras.main.shake(110, 0.009);
  }

  /**
   * Heavier shake + red flash when player is hit.
   */
  playerHit(_x: number, _y: number): void {
    this.scene.cameras.main.shake(160, 0.013);
    this.scene.cameras.main.flash(120, 255, 50, 50, true);
  }

  /**
   * Floating "+10" or "+100" text that drifts upward and fades.
   */
  floatScore(x: number, y: number, value: number): void {
    // Check if the bitmap font exists, otherwise fallback to plain Text
    const fontExists = this.scene.cache.bitmapFont.has("pixel-font");
    const t = fontExists
      ? (this.scene.add.bitmapText(x, y, "pixel-font", `+${value}`, 13) as any)
      : this.scene.add.text(x, y, `+${value}`, {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "10px",
          color: "#ffffff",
          stroke: "#000000",
          strokeThickness: 2,
        });

    t.setOrigin(0.5).setDepth(100);

    this.scene.tweens.add({
      targets: t,
      y: y - 52,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeOut",
      onComplete: () => t.destroy(),
    });
  }

  /**
   * Slows down physics briefly for dramatic death sequences.
   */
  deathSlowMo(): void {
    const world = this.scene.physics.world;
    world.timeScale = 3.5; // High timescale = slower motion in Arcade Physics

    this.scene.time.delayedCall(500, () => {
      world.timeScale = 1.0;
    });
  }
}
