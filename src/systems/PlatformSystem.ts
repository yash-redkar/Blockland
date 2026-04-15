import Phaser from "phaser";
import { TimedPlatformDef } from "../data/LevelConfig";
import { TILE_SIZE } from "../config";

/**
 * PlatformSystem — Phase 4 dynamic platform mechanics.
 *
 * Three platform types:
 *   createMoving()  — tween-driven, immovable body, loops between two points
 *   createBounce()  — static; launches player upward on overlap
 *
 * The class accesses `(scene as any).player` so it stays decoupled from
 * the concrete Player type. GameScene must set this.player before calling
 * any create* method.
 *
 * All textures ('platform-moving', 'platform-bounce')
 * are generated in PreloadScene.generateEnvironmentTextures().
 */
export class PlatformSystem {
  private scene: Phaser.Scene;
  public movingGroup: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.movingGroup = scene.physics.add.group();
  }

  // ─── Moving Platform ──────────────────────────────────────────────────────

  /**
   * Creates a platform that tweens between (x,y) and (endX,endY) continuously.
   * The physics body is immovable and gravity-free so Phaser carries the player
   * along while they stand on it.
   *
   * @param speed Pixels per second (default 80)
   */
  createMoving(
    x: number,
    y: number,
    endX: number,
    endY: number,
    speed = 80,
  ): Phaser.Physics.Arcade.Image {
    const p = this.scene.physics.add.image(x, y, "platform-moving");
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;

    const dist = Phaser.Math.Distance.Between(x, y, endX, endY);

    this.scene.tweens.add({
      targets: p,
      x: endX,
      y: endY,
      duration: (dist / speed) * 1000,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    this.movingGroup.add(p);
    return p;
  }

  // ─── Bounce Platform ──────────────────────────────────────────────────────

  /**
   * Creates a static trampoline that launches the player with high upward
   * velocity and compresses the platform visually on contact.
   *
   * Bounce velocity is intentionally limited so launches feel controlled.
   */
  createBounce(
    x: number,
    y: number,
  ): Phaser.Types.Physics.Arcade.ImageWithStaticBody {
    const p = this.scene.physics.add.staticImage(x, y, "platform-bounce");

    this.scene.physics.add.overlap(
      (this.scene as any).player.sprite ?? (this.scene as any).player,
      p,
      () => {
        const player = (this.scene as any).player;
        // Access body via Player's body getter or directly on sprite
        const body: Phaser.Physics.Arcade.Body =
          player.body ?? (player.sprite?.body as Phaser.Physics.Arcade.Body);

        if (body) body.setVelocityY(-620);

        // Compress the pad then spring back
        this.scene.tweens.add({
          targets: p,
          scaleY: 0.6,
          duration: 80,
          yoyo: true,
        });
      },
    );

    return p;
  }

  // ─── Timed Platforms ──────────────────────────────────────────────────────

  /**
   * Creates a platform that loops between VISIBLE → WARNING → HIDDEN.
   * During the warning phase, it flashes with increasing speed.
   */
  createTimed(config: TimedPlatformDef): Phaser.Physics.Arcade.Image {
    const {
      x,
      y,
      w,
      visibleDuration,
      hiddenDuration,
      phaseOffset = 0,
      warningTime = 0.5,
    } = config;

    const p = this.scene.physics.add.image(x, y, "platform-moving");
    p.setDisplaySize(w * TILE_SIZE, 12);
    const body = p.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.allowGravity = false;
    this.movingGroup.add(p);

    const runCycle = () => {
      if (!p.active) return;

      const warningDelay = Math.max(0, visibleDuration - warningTime);

      // 1. VISIBLE State
      this.scene.time.delayedCall(warningDelay * 1000, () => {
        if (!p.active) return;

        // 2. WARNING State (Increasing speed blink)
        this.runIncreasingBlink(p, warningTime, () => {
          if (!p.active) return;

          // 3. HIDDEN State
          p.setVisible(false);
          body.setEnable(false);

          this.scene.time.delayedCall(hiddenDuration * 1000, () => {
            if (!p.active) return;

            // Back to VISIBLE
            p.setVisible(true);
            p.setAlpha(1);
            body.setEnable(true);
            runCycle();
          });
        });
      });
    };

    if (phaseOffset > 0) {
      this.scene.time.delayedCall(phaseOffset * 1000, runCycle);
    } else {
      runCycle();
    }

    return p;
  }

  /** Recursively speeds up the blinking during the warning phase */
  private runIncreasingBlink(
    targets: Phaser.GameObjects.Image,
    timeLeft: number,
    onComplete: () => void,
  ): void {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    // Blink faster as timeLeft gets smaller
    const duration = Math.max(25, (timeLeft / 0.5) * 80);

    this.scene.tweens.add({
      targets,
      alpha: 0.2,
      duration: duration,
      yoyo: true,
      onComplete: () => {
        if (!targets.active) return;
        this.runIncreasingBlink(
          targets,
          timeLeft - (duration * 2) / 1000,
          onComplete,
        );
      },
    });
  }
}
