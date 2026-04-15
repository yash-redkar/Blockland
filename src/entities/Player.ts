import Phaser from "phaser";
import { InputHandler } from "../systems/InputHandler";
import { CameraController } from "../systems/CameraController";
import { ParticleSystem } from "../systems/ParticleSystem";
import { AnimController } from "../systems/AnimController";
import { AudioSystem } from "../systems/AudioSystem";
import {
  JUMP_VELOCITY,
  GRAVITY_NORMAL,
  GRAVITY_FALLING,
  GRAVITY_FASTFALL,
  APEX_THRESHOLD,
  APEX_GRAVITY_SCALE,
  JUMP_CUT_MIN_VY,
  JUMP_CUT_FACTOR,
  COYOTE_MS,
  BUFFER_MS,
  SQUASH_TAKEOFF,
  SQUASH_LAND,
  SQUASH_RESTORE_MS,
} from "../systems/JumpConfig";
import {
  PLAYER_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_DRAG,
  PLAYER_AIR_DRAG,
} from "../config";

// ─── State Machine ─────────────────────────────────────────────────────────
export type PlayerAnimState =
  | "idle"
  | "run"
  | "jump"
  | "fall"
  | "hurt"
  | "dead";

/**
 * Player — Composition-based player controller.
 *
 * WHY composition instead of extending Phaser.Physics.Arcade.Sprite?
 * → Phaser's GameObject base class has a `this.state = 0` in its constructor
 *   which conflicts with TypeScript class getters named 'state', causing a
 *   "Cannot set property state which has only a getter" runtime error.
 * → Composition avoids all Phaser inheritance name conflicts and is more
 *   flexible for future refactors (e.g., swapping sprites without re-creating
 *   the controller object).
 *
 * Character switching (Phase 2/5):
 * → Pass `characterKey` matching a CharacterRegistry entry.
 * → Sprite texture and all animation keys update automatically.
 */
export class Player {
  private static readonly BASE_SCALE = 1;

  // ── The actual renderable / physics object ────────────────────────────────
  readonly sprite: Phaser.Physics.Arcade.Sprite;

  // ── Dependencies ──────────────────────────────────────────────────────────
  private input: InputHandler;
  private cam: CameraController;
  private audio: AudioSystem;
  private scene: Phaser.Scene;
  private charKey: string;

  // ── Animation State ───────────────────────────────────────────────────────
  private _animState: PlayerAnimState = "idle";
  private _facingLeft = false;

  // ── Lives & Damage ────────────────────────────────────────────────────────
  private _lives = 1;
  private _coins = 0;
  private _iframes = 0;
  private readonly IFRAME_DURATION = 600;

  // ── Coyote Time & Jump Buffer ─────────────────────────────────────────────────
  /** scene.time.now when player last touched ground — used for coyote time. */
  private lastGroundedTime = 0;
  /** scene.time.now when jump key was last pressed — used for jump buffer. */
  private jumpPressedTime = -9999;

  // ── Phase 6: landing dust tracking ────────────────────────────────────────
  private prevGrounded = false;
  private trailTimer = 0;

  // ── Phase 3: Animation state machine ─────────────────────────────────
  private animController!: AnimController;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    input: InputHandler,
    cam: CameraController,
    audio: AudioSystem,
    characterKey = "explorer",
  ) {
    this.scene = scene;
    this.input = input;
    this.cam = cam;
    this.audio = audio;
    this.charKey = characterKey;

    this.sprite = scene.physics.add.sprite(x, y, characterKey, 0);
    this.sprite.setDepth(10);

    this.animController = new AnimController(characterKey);

    this.configurePhysicsBody();
    this.sprite.play(`${characterKey}-idle`);
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  get x(): number {
    return this.sprite.x;
  }
  get y(): number {
    return this.sprite.y;
  }
  get lives(): number {
    return this._lives;
  }
  get coins(): number {
    return this._coins;
  }
  get animState(): PlayerAnimState {
    return this._animState;
  }

  get body(): Phaser.Physics.Arcade.Body {
    return this.sprite.body as Phaser.Physics.Arcade.Body;
  }

  /** Swap to a different character texture & re-sync the animation controller */
  switchCharacter(key: string): void {
    this.charKey = key;
    this.sprite.setTexture(key, 0);
    this.animController.setCharKey(key);
  }

  collectCoin(): void {
    this._coins++;
    this.sprite.setTint(0xffff00);
    this.scene.time.delayedCall(300, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
    this.scene.events.emit("coin-collected", this._coins);
  }

  tick(delta: number): void {
    if (this._animState === "dead") return;

    this.input.resetJump();
    this.updateTimers(delta);
    this.handleMovement();
    this.handleJump();
    this.cam.snapToPixel();

    // ── Squash & Stretch ─────────────────────────────────────────────────
    const grounded = this.body.blocked.down;
    if (grounded && !this.prevGrounded) {
      if (Math.abs(this.body.velocity.y) > 80) this.onLand();
    } else if (!grounded && this.prevGrounded && this.body.velocity.y < 0) {
      this.onJumpTakeoff();
    }
    this.prevGrounded = grounded;

    // ── Facing direction ──────────────────────────────────────────────────
    const vx = this.body.velocity.x;
    if (vx < -5) this.sprite.setFlipX(true);
    else if (vx > 5) this.sprite.setFlipX(false);

    // ── Animation state machine ─────────────────────────────────────────
    this.animController.update(
      this.sprite,
      this.body.velocity.x,
      this.body.velocity.y,
      this.body.blocked.down,
      this._iframes > 0,
      this.scene.time.now,
    );
    this._animState = this.animController.state as PlayerAnimState;

    this.updateTrail();
  }

  takeDamage(): void {
    if (this._iframes > 0 || this._animState === "dead") return;

    this._lives--;
    this._iframes = this.IFRAME_DURATION;
    this._animState = "hurt";
    this.sprite.play(`${this.charKey}-hurt`, true);

    const kbDir = this._facingLeft ? 1 : -1;
    this.body.setVelocity(kbDir * 100, -200);

    // Audio hit feedback
    this.audio.playHit();

    // Invincibility flash (80ms cadence, 8 toggles)
    let flashCount = 0;
    this.scene.time.addEvent({
      delay: 80,
      repeat: 7,
      callback: () => {
        if (!this.sprite.active) return;
        this.sprite.setAlpha(flashCount % 2 === 0 ? 0.3 : 1);
        flashCount++;
      },
      callbackScope: this,
    });

    this.cam.shake();
    this.cam.flash();

    this.scene.events.emit("life-lost", this._lives);
    this.scene.events.emit("playerHit", this.sprite.x, this.sprite.y);

    if (this._lives <= 0) this.die();
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  private configurePhysicsBody(): void {
    // Tiny Hero source frames are 32x32. Keep a consistent visual size from spawn.
    this.sprite.setScale(Player.BASE_SCALE);
    const body = this.body;
    // Keep hitbox narrow enough so edge standing matches the sprite silhouette.
    body.setSize(18, 24);
    body.setOffset(7, 8);
    body.setMaxVelocityX(PLAYER_RUN_SPEED * 1.1);
    body.setMaxVelocityY(600);
    body.setDragX(PLAYER_DRAG);
    body.setCollideWorldBounds(true);
  }

  private updateTimers(delta: number): void {
    // iframes blink
    if (this._iframes > 0) {
      this._iframes -= delta;
      this.sprite.setAlpha(Math.floor(this._iframes / 80) % 2 === 0 ? 1 : 0.3);
    } else {
      this.sprite.setAlpha(1);
    }
  }

  private handleMovement(): void {
    const dir = this.input.horizontal;
    const speed = this.input.isRunning ? PLAYER_RUN_SPEED : PLAYER_SPEED;
    const body = this.body;

    if (dir !== 0) {
      body.setVelocityX(dir * speed);
      this._facingLeft = dir < 0;
      // NOTE: setFlipX is handled centrally in tick() using velocity, not input
      body.setDragX(body.blocked.down ? PLAYER_DRAG : PLAYER_AIR_DRAG);
    } else {
      body.setDragX(PLAYER_DRAG);
    }
  }

  private handleJump(): void {
    const body = this.body;
    const vy = body.velocity.y;
    const now = this.scene.time.now;

    // ── Track last grounded time for coyote ──────────────────────────────
    if (body.blocked.down) this.lastGroundedTime = now;

    // ── Register jump press into buffer ────────────────────────────────
    if (this.input.isJumpJustPressed) this.jumpPressedTime = now;

    // ── Coyote + buffer jump ─────────────────────────────────────────
    const canCoyote = now - this.lastGroundedTime < COYOTE_MS;
    const hasBuffer = now - this.jumpPressedTime < BUFFER_MS;

    if ((body.blocked.down || canCoyote) && hasBuffer) {
      body.setVelocityY(JUMP_VELOCITY);
      this.lastGroundedTime = 0; // consume coyote
      this.jumpPressedTime = -9999; // consume buffer
    }

    // ── Variable height: cut velocity when key released mid-rise ───────────
    if (!this.input.isJumpHeld && vy < JUMP_CUT_MIN_VY) {
      body.setVelocityY(vy * JUMP_CUT_FACTOR);
    }

    // ── Dynamic gravity ────────────────────────────────────────────────
    const atApex = Math.abs(vy) < APEX_THRESHOLD && !body.blocked.down;
    const fastFall = this.input.isDownHeld && !body.blocked.down && vy > 0;

    const targetGravity = fastFall
      ? GRAVITY_FASTFALL
      : atApex
        ? GRAVITY_NORMAL * APEX_GRAVITY_SCALE
        : vy > 0
          ? GRAVITY_FALLING
          : GRAVITY_NORMAL;

    // body.setGravityY is relative to world gravity
    body.setGravityY(targetGravity - this.scene.physics.world.gravity.y);
  }

  // updateAnimState, setAnimState, and updateAnimation have been replaced
  // by AnimController — see src/systems/AnimController.ts.

  // ─── Polish helpers ──────────────────────────────────────────────────────

  /**
   * Called the frame the player leaves the ground heading upward.
   * Applies a quick vertical stretch for takeoff "juice".
   */
  private onJumpTakeoff(): void {
    // Phase 6: Jump sound and event
    this.audio.playJump();
    this.scene.events.emit("playerJumped", this.body.velocity.y);

    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(
      Player.BASE_SCALE * SQUASH_TAKEOFF.scaleX,
      Player.BASE_SCALE * SQUASH_TAKEOFF.scaleY,
    );
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: Player.BASE_SCALE,
      scaleY: Player.BASE_SCALE,
      duration: SQUASH_TAKEOFF.duration,
      ease: "Quad.easeOut",
      yoyo: false,
    });
  }

  /**
   * Called the first frame the player touches the ground after being airborne.
   * Squashes the sprite, spawns landing dust, and broadcasts `playerLanded`
   * so external systems (particles, camera shake) can react.
   */
  private onLand(): void {
    // Phase 6: Broadcast landing event for FeedbackSystem
    this.scene.events.emit("playerLanded", this.sprite.x, this.sprite.y + 12);

    // Spawn foot-level dust
    ParticleSystem.landingDust(this.scene, this.sprite.x, this.sprite.y + 12);

    // Squash toward floor
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setScale(
      Player.BASE_SCALE * SQUASH_LAND.scaleX,
      Player.BASE_SCALE * SQUASH_LAND.scaleY,
    );
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: Player.BASE_SCALE,
      scaleY: Player.BASE_SCALE,
      duration: SQUASH_LAND.duration,
      ease: "Quad.easeOut",
      yoyo: true, // briefly overshoot then settle
      onComplete: () => {
        this.scene.tweens.add({
          targets: this.sprite,
          scaleX: Player.BASE_SCALE,
          scaleY: Player.BASE_SCALE,
          duration: SQUASH_RESTORE_MS,
          ease: "Back.Out",
        });
      },
    });

    // Broadcast to the scene — particle systems and camera shake can listen
    this.scene.events.emit(
      "playerLanded",
      this.sprite.x,
      this.sprite.y + this.sprite.displayHeight / 2,
    );
  }

  private die(): void {
    this._animState = "dead";
    const deathKey = this.sprite.anims.exists(`${this.charKey}-death`)
      ? `${this.charKey}-death`
      : `${this.charKey}-dead`;
    this.sprite.play(deathKey, true);
    this.sprite.setTint(0xff4444);
    this.body.setVelocity(0, 0);
    this.body.enable = false;

    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 80,
      alpha: 0,
      angle: 180,
      duration: 600,
      ease: "Quad.easeIn",
      onComplete: () => {
        this.scene.events.emit("player-dead");
      },
    });
  }

  private updateTrail(): void {
    if (
      Math.abs(this.body.velocity.x) <= 150 &&
      Math.abs(this.body.velocity.y) <= 200
    ) {
      return;
    }
    if (this.scene.time.now - this.trailTimer <= 40) return;

    this.trailTimer = this.scene.time.now;
    const ghost = this.scene.add
      .image(this.sprite.x, this.sprite.y, this.sprite.texture.key)
      .setFrame(this.sprite.frame.name as string | number)
      .setAlpha(0.35)
      .setDisplaySize(this.sprite.displayWidth, this.sprite.displayHeight)
      .setFlipX(this.sprite.flipX)
      .setDepth(this.sprite.depth - 1)
      .setTint(0x88aaff);

    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }
}
