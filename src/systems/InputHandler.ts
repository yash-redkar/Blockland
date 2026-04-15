import Phaser from 'phaser';

/**
 * InputHandler — Thin wrapper around Phaser's KeyboardPlugin.
 *
 * Design decisions:
 * - Accepts a `scene` at construction so it auto-cleans when the scene shuts.
 * - Exposes simple boolean / numeric properties so Player.ts reads state
 *   without knowing about Phaser internals.
 * - `isJumpJustPressed` is consumed on read (one-shot) to prevent
 *   accidental multi-frame jump triggers from a held key.
 */
export class InputHandler {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd: {
    up:    Phaser.Input.Keyboard.Key;
    left:  Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    down:  Phaser.Input.Keyboard.Key;
  };
  private shiftKey: Phaser.Input.Keyboard.Key;
  private spaceKey: Phaser.Input.Keyboard.Key;

  /** Consumed once-per-frame flag for jump input */
  private _jumpConsumed = false;

  constructor(scene: Phaser.Scene) {
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.wasd = {
      up:    scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      left:  scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      down:  scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };
    this.shiftKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.spaceKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /** -1 = left, 0 = neutral, 1 = right */
  get horizontal(): number {
    const left  = this.cursors.left.isDown  || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    if (left && !right)  return -1;
    if (right && !left)  return 1;
    return 0;
  }

  get isRunning(): boolean {
    return this.shiftKey.isDown;
  }

  /**
   * Returns true on the frame the jump key is first pressed.
   * Automatically resets after being read once so physics can only act on it once.
   */
  get isJumpJustPressed(): boolean {
    const pressed =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);

    if (pressed && !this._jumpConsumed) {
      this._jumpConsumed = true;
      return true;
    }
    return false;
  }

  /**
   * True every frame the jump key is held down.
   * Used by variable-height system to cut velocity on early release.
   */
  get isJumpHeld(): boolean {
    return (
      this.cursors.up.isDown ||
      this.wasd.up.isDown    ||
      this.spaceKey.isDown
    );
  }

  /**
   * True when the player is holding ↓ / S (fast fall trigger).
   */
  get isDownHeld(): boolean {
    return this.cursors.down.isDown || this.wasd.down.isDown;
  }

  /** Call at the start of each update cycle to reset the jump consumption flag. */
  resetJump(): void {
    this._jumpConsumed = false;
  }
}
