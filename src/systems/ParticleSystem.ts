import Phaser from 'phaser';

/**
 * ParticleSystem — Static utility class for one-shot particle bursts.
 *
 * All methods are static so they can be called from any scene
 * without instantiating a manager object.
 *
 * Phase 6 CG showcase:
 *  - coinPickup   → gold pixel burst
 *  - landingDust  → white/gray puff
 *  - enemyDeath   → red debris chunks
 *  - levelFlare   → full-screen star sparkle
 */
export class ParticleSystem {

  /**
   * Gold burst when a coin is collected.
   */
  static coinPickup(scene: Phaser.Scene, x: number, y: number): void {
    ParticleSystem.burst(scene, x, y, {
      key: 'icon_coin',
      count: 8,
      speed: { min: 30, max: 80 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: 0xffd700,
      gravity: 120,
    });
  }

  /**
   * Dusty puff when the player lands on the ground.
   */
  static landingDust(scene: Phaser.Scene, x: number, y: number): void {
    // Emit two puffs going left and right
    for (const sign of [-1, 1]) {
      ParticleSystem.burst(scene, x + sign * 4, y, {
        key: 'particle',
        count: 4,
        speed: { min: 10, max: 35 },
        angle: { min: sign < 0 ? 160 : 20, max: sign < 0 ? 200 : -20 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 300,
        tint: 0xbbbbaa,
        gravity: 0,
      });
    }
  }

  /**
   * Red debris on enemy stomp.
   */
  static enemyDeath(scene: Phaser.Scene, x: number, y: number): void {
    ParticleSystem.burst(scene, x, y, {
      key: 'particle',
      count: 10,
      speed: { min: 40, max: 120 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: 500,
      tint: 0xe05050,
      gravity: 200,
    });
  }

  /**
   * Flash + sparkle on level complete.
   */
  static levelFlare(scene: Phaser.Scene): void {
    const { width, height } = scene.scale;
    for (let i = 0; i < 12; i++) {
      const sx = Phaser.Math.Between(20, width - 20);
      const sy = Phaser.Math.Between(20, height - 20);
      ParticleSystem.burst(scene, sx, sy, {
        key: 'icon_coin',
        count: 3,
        speed: { min: 20, max: 60 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: 700,
        tint: 0xffd700,
        gravity: 0,
        delay: i * 60,
      });
    }
  }

  // ─── Internal burst helper ─────────────────────────────────────────────────

  private static burst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    opts: {
      key: string;
      count: number;
      speed: { min: number; max: number };
      scale: { start: number; end: number };
      alpha: { start: number; end: number };
      lifespan: number;
      tint?: number;
      gravity?: number;
      angle?: { min: number; max: number };
      delay?: number;
    },
  ): void {
    const textureKey = scene.textures.exists(opts.key) ? opts.key : 'particle';
    if (!scene.textures.exists(textureKey)) return;

    const emitter = scene.add.particles(x, y, textureKey, {
      speed       : opts.speed,
      angle       : opts.angle ?? { min: 0, max: 360 },
      scale       : opts.scale,
      alpha       : opts.alpha,
      lifespan    : opts.lifespan,
      quantity    : opts.count,
      tint        : opts.tint,
      gravityY    : opts.gravity ?? 0,
      emitting    : false,
      delay       : opts.delay ?? 0,
    }).setDepth(20);

    emitter.explode(opts.count, 0, 0);

    // Auto-destroy after lifespan ends
    scene.time.delayedCall(opts.lifespan + (opts.delay ?? 0) + 200, () => {
      emitter.destroy();
    });
  }
}
