import Phaser from "phaser";
import { SCENE, GAME_WIDTH, GAME_HEIGHT } from "../config";

/**
 * LevelCompleteScene — Overlay when player reaches the flag/door.
 * Receives data: { level, coins, time, nextLevel }
 */
export class LevelCompleteScene extends Phaser.Scene {
  private level = 1;
  private nextLevel = 2;
  private coins = 0;
  private totalCoins = 0;
  private timeMs = 0;

  constructor() {
    super({ key: SCENE.LEVEL_COMPLETE });
  }

  init(data: {
    level?: number;
    coins?: number;
    totalCoins?: number;
    time?: number;
    nextLevel?: number;
  }): void {
    this.level = data?.level ?? 1;
    this.nextLevel = data?.nextLevel ?? this.level + 1;
    this.coins = data?.coins ?? 0;
    this.totalCoins = data?.totalCoins ?? 0;
    this.timeMs = data?.time ?? 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    // Background overlay
    this.add
      .rectangle(
        GAME_WIDTH / 2,
        GAME_HEIGHT / 2,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x002200,
        0.8,
      )
      .setOrigin(0.5);

    const cx = GAME_WIDTH / 2;

    this.spawnStars();

    this.add
      .text(cx, 52, "LEVEL COMPLETE!", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "18px",
        color: "#ffe040",
        stroke: "#664400",
        strokeThickness: 4,
        letterSpacing: 4,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Results card
    const secs = Math.floor(this.timeMs / 1000);
    const m = Math.floor(secs / 60);
    const ss = String(secs % 60).padStart(2, "0");
    const timeStr = `${m}:${ss}`;

    this.add
      .text(
        cx,
        105,
        [
          `LEVEL    ${this.level}`,
          `RUN      ${this.coins}`,
          `TOTAL    ${this.totalCoins}`,
          `TIME     ${timeStr}`,
        ],
        {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          color: "#ccffcc",
          letterSpacing: 2,
          lineSpacing: 6,
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(10);

    this.makeButton(cx, 158, "NEXT LEVEL", () => this.goNextLevel());
    this.makeButton(cx, 180, "MAIN MENU", () => this.goMenu());

    this.input.keyboard!.once("keydown-ENTER", () => this.goNextLevel());
    this.input.keyboard!.once("keydown-ESC", () => this.goMenu());

    this.cameras.main.fadeIn(350, 0, 0, 0);
  }

  private spawnStars(): void {
    for (let i = 0; i < 20; i++) {
      const x = Phaser.Math.Between(10, GAME_WIDTH - 10);
      const y = Phaser.Math.Between(10, GAME_HEIGHT - 10);
      const star = this.add
        .text(x, y, "★", {
          fontSize: `${Phaser.Math.Between(6, 14)}px`,
          color: "#ffe040",
        })
        .setAlpha(0)
        .setDepth(5);

      this.tweens.add({
        targets: star,
        alpha: 0.8,
        y: y - Phaser.Math.Between(10, 25),
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        duration: Phaser.Math.Between(400, 1000),
        delay: Phaser.Math.Between(0, 500),
        ease: "Sine.Out",
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    cb: () => void,
  ): void {
    const text = this.add
      .text(x, y, `[ ${label} ]`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "9px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2,
        letterSpacing: 2,
      })
      .setOrigin(0.5)
      .setDepth(10);

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
      console.log("Button clicked:", label);
      cb();
    });
  }

  private goNextLevel(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop(SCENE.LEVEL_COMPLETE);
      this.scene.start(SCENE.GAME, { level: this.nextLevel });
      this.scene.launch(SCENE.HUD, { level: this.nextLevel });
    });
  }

  private goMenu(): void {
    this.scene.stop(SCENE.PAUSE);
    this.scene.stop(SCENE.UI);
    this.scene.stop(SCENE.HUD);
    this.scene.stop(SCENE.GAME);
    this.scene.start(SCENE.MAIN_MENU);
  }
}
