import Phaser from "phaser";

/**
 * Lava — continuous damage zone.
 *
 * Rendered as a glowing red/orange rectangle.
 * GameScene calls `overlaps(playerSprite)` to handle damage with cooldown.
 *
 * The lava surface animates with a sine-wave shimmer via a tween on alpha.
 */
export class Lava {
  /** The physics image used for overlap detection */
  readonly body: Phaser.Physics.Arcade.Image;

  /** Damage cooldown tracker (ms since last damage) */
  private damageCooldown = 0;
  private readonly DAMAGE_INTERVAL = 600; // ms between lava hits
  private readonly variant: "lava" | "water";

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    variant: "lava" | "water" = "lava",
  ) {
    this.variant = variant;

    // Body: invisible physics zone
    this.body = scene.physics.add
      .image(x + width / 2, y + 8, "__DEFAULT")
      .setDisplaySize(width, 16)
      .setAlpha(0)
      .setDepth(4)
      .setImmovable(true);

    (this.body.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);

    // Visual: layered glowing lava effect
    this.buildVisual(scene, x, y, width);
  }

  /** Returns true if player can be damaged (respects cooldown). */
  tryDamage(delta: number): boolean {
    this.damageCooldown = Math.max(0, this.damageCooldown - delta);
    if (this.damageCooldown <= 0) {
      this.damageCooldown = this.DAMAGE_INTERVAL;
      return true;
    }
    return false;
  }

  private buildVisual(
    scene: Phaser.Scene,
    x: number,
    y: number,
    w: number,
  ): void {
    if (this.variant === "water") {
      const base = scene.add
        .rectangle(x + w / 2, y + 8, w, 16, 0x2075cf)
        .setDepth(3)
        .setOrigin(0.5);

      const surf = scene.add
        .rectangle(x + w / 2, y + 2, w, 4, 0x7bd3ff)
        .setDepth(4)
        .setOrigin(0.5);

      scene.tweens.add({
        targets: [surf],
        alpha: { from: 0.55, to: 1 },
        duration: 500 + Math.random() * 250,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });

      for (let i = 0; i < Math.ceil(w / 16); i++) {
        const bx = x + 8 + i * 16;
        const bubble = scene.add
          .circle(bx, y + 10, 2, 0xdaf6ff, 0.8)
          .setDepth(5);
        scene.tweens.add({
          targets: bubble,
          y: y - 4,
          alpha: 0,
          duration: 700 + Math.random() * 500,
          ease: "Sine.Out",
          delay: Math.random() * 700,
          repeat: -1,
          onRepeat: () => {
            bubble.setY(y + 10);
            bubble.setAlpha(0.8);
          },
        });
      }

      void base;
      return;
    }

    // Base lava rectangle
    const base = scene.add
      .rectangle(x + w / 2, y + 8, w, 16, 0xdd2200)
      .setDepth(3)
      .setOrigin(0.5);

    // Bright surface stripe
    const surf = scene.add
      .rectangle(x + w / 2, y + 2, w, 4, 0xff6600)
      .setDepth(4)
      .setOrigin(0.5);

    // Glow shimmer — alternating alpha tween
    scene.tweens.add({
      targets: [surf],
      alpha: { from: 0.6, to: 1 },
      duration: 400 + Math.random() * 200,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });

    // Bubbles (small circles that float up)
    for (let i = 0; i < Math.ceil(w / 16); i++) {
      const bx = x + 8 + i * 16;
      const bubble = scene.add.circle(bx, y + 10, 2, 0xff8800, 0.8).setDepth(5);
      scene.tweens.add({
        targets: bubble,
        y: y - 6,
        alpha: 0,
        duration: 600 + Math.random() * 400,
        ease: "Sine.Out",
        delay: Math.random() * 600,
        repeat: -1,
        onRepeat: () => {
          bubble.setY(y + 10);
          bubble.setAlpha(0.8);
        },
      });
    }

    // Keep visuals above physics body for depth ordering
    void base; // referenced for depth
  }
}
