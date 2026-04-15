import Phaser from 'phaser';
import { WORLD_WIDTH, WORLD_HEIGHT, GAME_HEIGHT } from '../config';

/**
 * CameraController — wraps scene.cameras.main with platformer-specific logic.
 *
 * Responsibilities:
 *  - Set world bounds so camera never shows empty void
 *  - Smooth follow-cam with lerp (interpolation factor)
 *  - Optional deadzone so tiny player movements don't jitter the camera
 *  - Screen shake utility (called by Player on damage)
 *
 * Design note: passing the scene in gives us access to the camera
 * AND makes it easy to unit-test without a full Phaser boot.
 */
export class CameraController {
  private camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene) {
    this.camera = scene.cameras.main;
  }

  /**
   * Attach camera to a target game object (typically the Player sprite).
   *
   * @param target    The object to follow
   * @param lerpX     Horizontal lerp factor (0 = locked, 1 = instant, ~0.1 = smooth)
   * @param lerpY     Vertical lerp factor — slightly less than X feels natural
   */
  follow(
    target: Phaser.GameObjects.GameObject,
    lerpX = 0.08,
    lerpY = 0.12,
  ): void {
    this.camera.startFollow(target, true, lerpX, lerpY);

    // Phase 6: Fixed 60x40 deadzone for tighter platforming feel
    this.camera.setDeadzone(60, 40);
  }

  /**
   * Adjusts the camera's follow offset — used for lookahead transitions.
   */
  setFollowOffset(x: number, y: number): void {
    this.camera.setFollowOffset(x, y);
  }

  /**
   * Constrain the camera so it never pans outside the level bounds.
   * Call after follow() for correct initialization order.
   */
  setBounds(worldWidth = WORLD_WIDTH, worldHeight = WORLD_HEIGHT): void {
    this.camera.setBounds(0, 0, worldWidth, worldHeight);
  }

  /**
   * Rounds the camera scroll to integer pixels, preventing sub-pixel rendering
   * which causes fuzzy pixel art on non-retina displays.
   * Call once per frame in the scene's update() BEFORE Phaser's own camera render.
   */
  snapToPixel(): void {
    this.camera.scrollX = Math.round(this.camera.scrollX);
    this.camera.scrollY = Math.round(this.camera.scrollY);
  }

  /**
   * Trigger a screen shake — typically on player damage or landing hard.
   *
   * @param duration  milliseconds
   * @param intensity fraction of game resolution (e.g. 0.004 = ~ 1px at 270px height)
   */
  shake(duration = 180, intensity = 0.004): void {
    this.camera.shake(duration, intensity);
  }

  /**
   * Instantly position the camera centered on a point (for level start).
   */
  snapTo(x: number, y: number): void {
    this.camera.centerOn(x, y);
  }

  /**
   * Flash the screen white/red — useful for hit effects.
   */
  flash(duration = 200, r = 255, g = 50, b = 50): void {
    this.camera.flash(duration, r, g, b);
  }

  /**
   * Lock the camera's Y-axis to a fixed horizontal-scrolling level.
   * Call instead of follow() for wide, non-vertical levels.
   */
  lockY(): void {
    this.camera.scrollY = GAME_HEIGHT / 2;
  }
}
