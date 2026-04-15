import Phaser from "phaser";
import { SCENE, GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * GameOverScene — Displayed when the player loses all lives.
 */
export class GameOverScene extends Phaser.Scene {
  private coins = 0;
  private totalCoins = 0;
  private level = 1;

  constructor() {
    super({ key: SCENE.GAME_OVER });
  }

  init(data: { level?: number; coins?: number; totalCoins?: number }): void {
    this.level = data?.level ?? 1;
    this.coins = data?.coins ?? 0;
    this.totalCoins = data?.totalCoins ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    // Dark overlay
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.75,
      )
      .setOrigin(0.5);

    const cx = GAME_WIDTH / 2;

    // Title
    this.add
      .text(cx, 70, "GAME OVER", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "24px",
        color: "#ff4444",
        stroke: "#880000",
        strokeThickness: 4,
        letterSpacing: 6,
      })
      .setOrigin(0.5);

    // Stats
    this.add
      .text(
        cx,
        110,
        [
          `Level ${this.level}`,
          `Run Coins: ${this.coins}`,
          `Total Coins: ${this.totalCoins}`,
        ],
        {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "9px",
          color: "#ffcc66",
          letterSpacing: 2,
          lineSpacing: 6,
          align: "center",
        },
      )
      .setOrigin(0.5);

    // Buttons
    this.makeButton(cx, 155, "RETRY", () => this.retry());
    this.makeButton(cx, 180, "MAIN MENU", () => this.goMenu());

    // Keyboard
    this.input.keyboard!.once("keydown-R", () => this.retry());
    this.input.keyboard!.once("keydown-ENTER", () => this.retry());
    this.input.keyboard!.once("keydown-ESC", () => this.goMenu());

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ─────────────────────────────────────────────

  private makeButton(
    x: number,
    y: number,
    label: string,
    cb: () => void,
  ): void {
    const text = this.add
      .text(x, y, `[ ${label} ]`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "12px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5);

    text.setInteractive({ useHandCursor: true });

    text.on("pointerover", () => {
      text.setColor("#ffe080");
      text.setScale(1.1);
    });

    text.on("pointerout", () => {
      text.setColor("#ffffff");
      text.setScale(1);
    });

    text.on("pointerdown", () => {
      cb();
    });
  }

  // ─────────────────────────────────────────────
  // ✅ RETRY FIXED
  // ─────────────────────────────────────────────

  private retry(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // Stop current scenes
      this.scene.stop(SCENE.GAME_OVER);
      this.scene.stop(SCENE.HUD);
      this.scene.stop(SCENE.UI);
      this.scene.stop(SCENE.PAUSE);

      // Restart game
      this.scene.start(SCENE.GAME, { level: this.level });
      this.scene.launch(SCENE.HUD);
    });
  }

  // ─────────────────────────────────────────────
  // ✅ MAIN MENU FIXED (IMPORTANT)
  // ─────────────────────────────────────────────

  private goMenu(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.cameras.main.once("camerafadeoutcomplete", () => {
      // STOP EVERYTHING CLEANLY
      this.scene.stop(SCENE.GAME_OVER);
      this.scene.stop(SCENE.GAME);
      this.scene.stop(SCENE.HUD);
      this.scene.stop(SCENE.UI);
      this.scene.stop(SCENE.PAUSE);

      // 🔥 FORCE RESTART MENU (important)
      this.scene.start(SCENE.MAIN_MENU);
    });
  }
}
