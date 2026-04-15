import Phaser from "phaser";

export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  private patrolLeft: number;
  private patrolRight: number;
  private speed: number;
  private mode: "ground" | "drop" | "platform";

  private direction: number = 1;
  private baseY: number; // 🔥 lock Y for platform enemies

  private _alive = true;
  get alive(): boolean {
    return this._alive;
  }

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    speedMult = 1.0,
    patrolRange = 80,
    mode: "ground" | "drop" | "platform" = "ground",
  ) {
    this.mode = mode;
    this.baseY = y; // 🔥 remember original Y

    this.patrolLeft = mode === "drop" ? x : x - patrolRange;
    this.patrolRight = mode === "drop" ? x : x + patrolRange;
    this.speed = mode === "drop" ? 0 : 55 * speedMult;

    this.sprite = scene.physics.add
      .sprite(x, y, "enemy", 0)
      .setDepth(6)
      .setOrigin(0.5, 1);

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    body.setSize(16, 16);
    body.setOffset(0, 0);
    body.setCollideWorldBounds(true);

    // 🔥 IMPORTANT FIXES
    body.setBounce(0);
    body.setFrictionX(0);

    if (mode === "platform") {
      body.setAllowGravity(false);
      body.setImmovable(true);

      // 🔥 ignore vertical collision problems
      body.checkCollision.up = false;
      body.checkCollision.down = false;
    } else {
      body.setAllowGravity(true);
    }

    body.setVelocityX(this.speed);
  }

  tick(): void {
    if (!this._alive || !this.sprite.active) return;

    const body = this.sprite.body as Phaser.Physics.Arcade.Body;

    // 🚫 DROP enemy
    if (this.mode === "drop") return;

    // 🔥 PLATFORM enemy → lock Y (NO sinking ever)
    if (this.mode === "platform") {
      this.sprite.y = this.baseY;
      body.setVelocityY(0);
    }

    // ✅ GROUND enemy edge detection
    if (this.mode === "ground") {
      if (!body.blocked.down) {
        this.direction *= -1;
      }
    }

    // ✅ WALL collision
    if (body.blocked.left) {
      this.direction = 1;
    } else if (body.blocked.right) {
      this.direction = -1;
    }

    // ✅ Patrol limits
    if (this.sprite.x <= this.patrolLeft) {
      this.direction = 1;
    } else if (this.sprite.x >= this.patrolRight) {
      this.direction = -1;
    }

    // ✅ MOVE (smooth)
    body.setVelocityX(this.speed * this.direction);

    // Flip
    this.sprite.setFlipX(this.direction < 0);

    // Animation
    if (this.sprite.scene.anims.exists("enemy-walk")) {
      if (this.sprite.anims.currentAnim?.key !== "enemy-walk") {
        this.sprite.play("enemy-walk", true);
      }
    }
  }

  stomp(): void {
    if (!this._alive) return;
    this._alive = false;
    this.sprite.destroy();
  }
}
