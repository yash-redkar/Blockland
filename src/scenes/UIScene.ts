import Phaser from "phaser";
import { SCENE, GAME_WIDTH } from "../config";

/**
 * UIScene — Phase 5 game-events-driven UI overlay.
 *
 * Runs in PARALLEL with GameScene (launched via scene.launch('UIScene')).
 * Draws ABOVE GameScene and HUDScene (depth-sorted by scene order in main.ts).
 *
 * Listens on this.game.events (the global Phaser.Events.EventEmitter, shared
 * across all scenes) for:
 *   'levelNameShow' (name: string) → fades in a centred level name banner,
 *                                    waits 2.5 s, then fades it out.
 *
 * The HUD hearts/coins are owned by HUDScene/HUDRenderer (already upgraded in
 * Phase 5). UIScene only owns the level-name banner and any future world-space
 * overlays that don't belong to HUDScene.
 *
 * FONT NOTE:
 *   Phaser's BitmapText requires a pre-loaded bitmap font (PNG + XML).
 *   Because no 'pixel-font' asset exists yet on disk, this scene falls back
 *   to Phaser.GameObjects.Text with 'Courier New' — the existing font stack.
 *
 *   To replace with a true bitmap font:
 *     1. Add to PreloadScene.preload():
 *          this.load.bitmapFont(
 *            'pixel-font',
 *            'assets/fonts/pixel-font.png',
 *            'assets/fonts/pixel-font.xml',
 *          );
 *     2. Replace this.add.text(...) calls with this.add.bitmapText(...).
 */
export class UIScene extends Phaser.Scene {
  private levelBanner!: Phaser.GameObjects.Container;
  private levelNameText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SCENE.UI });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.buildLevelBanner();

    // Listen for events emitted on the global game event bus
    this.game.events.on("levelNameShow", this.showLevelName, this);

    // Clean up listener when this scene is stopped
    this.events.once("shutdown", () => {
      this.game.events.off("levelNameShow", this.showLevelName, this);
    });
  }

  // ─── Level Name Banner ─────────────────────────────────────────────────────

  private buildLevelBanner(): void {
    const cx = GAME_WIDTH / 2;
    const cy = 26;

    // Backdrop pill
    const pill = this.add
      .rectangle(cx, cy, 156, 20, 0x000000, 0.52)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(60);

    // Name text — 'Courier New' fallback; swap to bitmapText when font asset is ready
    this.levelNameText = this.add
      .text(cx, cy, "", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "8px",
        color: "#ffee55",
        stroke: "#664400",
        strokeThickness: 1,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(61);

    // Group both into a container so we tween them together
    this.levelBanner = this.add.container(0, 0, [pill, this.levelNameText]);
    this.levelBanner.setAlpha(0); // hidden until a level starts
  }

  private showLevelName(name: string): void {
    this.levelNameText.setText(name.toUpperCase());
    this.levelBanner.setAlpha(0);

    // Fade in
    this.tweens.add({
      targets: this.levelBanner,
      alpha: 1,
      duration: 350,
      ease: "Quad.easeIn",
      onComplete: () => {
        // Hold for 2.5 s then fade out
        this.time.delayedCall(2500, () => {
          this.tweens.add({
            targets: this.levelBanner,
            alpha: 0,
            duration: 400,
            ease: "Quad.easeOut",
          });
        });
      },
    });
  }
}
