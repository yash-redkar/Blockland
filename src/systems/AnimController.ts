import Phaser from 'phaser';

/**
 * AnimController — data-driven animation state machine for any character sprite.
 *
 * Priority order (highest → lowest):
 *   hurt → airborne (jump/fall) → land window → run → idle
 *
 * The 'land' state persists for LAND_WINDOW_MS after touching ground so the
 * squash frame is visible even at high frame rates.
 *
 * Animation keys are namespaced with the character key prefix so the controller
 * works with multi-character spritesheets ('explorer-idle', 'knight-run', etc.).
 * Call setCharKey() when the player switches character.
 */
export class AnimController {
  private current: string = '';
  private wasOnGround: boolean = false;
  private landUntil: number = 0;

  private static readonly LAND_WINDOW_MS = 200;

  constructor(private charKey: string) {}

  /** Call when the active character changes so key prefixes stay correct. */
  setCharKey(key: string): void {
    this.charKey = key;
    this.current = ''; // force re-evaluation next frame
  }

  /**
   * Drives animation selection each frame.
   *
   * @param sprite   - The Arcade sprite whose anims are controlled
   * @param vx       - Current horizontal velocity
   * @param vy       - Current vertical velocity (negative = up in Phaser)
   * @param onGround - true when body.blocked.down
   * @param isHurt   - true while damage iframes are active
   * @param time     - scene.time.now (ms)
   */
  update(
    sprite: Phaser.Physics.Arcade.Sprite,
    vx: number,
    vy: number,
    onGround: boolean,
    isHurt: boolean,
    time: number,
  ): void {
    let next = this.current;

    // ── Determine target state ───────────────────────────────────────────────
    if (isHurt) {
      next = 'hurt';
    } else if (!onGround) {
      next = vy < -50 ? 'jump' : 'fall';
    } else if (time < this.landUntil) {
      next = 'land';
    } else if (Math.abs(vx) > 20) {
      next = 'run';
    } else {
      next = 'idle';
    }

    // ── Landing transition — open the land window ───────────────────────────
    if (!this.wasOnGround && onGround) {
      this.landUntil = time + AnimController.LAND_WINDOW_MS;
      next = 'land';
    }
    this.wasOnGround = onGround;

    // ── Play only on change ──────────────────────────────────────────────────
    if (next !== this.current) {
      this.current = next;
      const fullKey = `${this.charKey}-${next}`;
      if (sprite.anims.exists(fullKey)) {
        sprite.play(fullKey, true);
      }
    }
  }

  /** Returns the current logical state key (without char prefix). */
  get state(): string {
    return this.current;
  }
}
