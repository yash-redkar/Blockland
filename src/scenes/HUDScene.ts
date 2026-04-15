import Phaser from "phaser";
import { SCENE } from "../config";
import { HUDRenderer } from "../ui/HUDRenderer";

/**
 * HUDScene — Runs in parallel over GameScene (launched via scene.launch()).
 *
 * Why a separate scene?
 * → Phaser renders scenes in a stack. A separate HUD scene runs at a fixed
 *   camera position (no follow-cam) so HUD elements never scroll with the world.
 * → We avoid mixing UI GameObjects with world geometry in GameScene.
 * → The two scenes communicate via events emitted on GameScene's event emitter.
 *
 * Listens for:
 *   'coin-collected'  (data: totalCoins)
 *   'life-lost'       (data: livesRemaining)
 *   'timer-update'    (data: elapsedMs)
 *   'level-complete'
 */
export class HUDScene extends Phaser.Scene {
  private hudRenderer!: HUDRenderer;
  private lives = 1;
  private coins = 0;
  private currentLevel = 1;

  constructor() {
    super({ key: SCENE.HUD, active: false });
  }

  init(data: { level?: number }): void {
    this.currentLevel = data?.level ?? 1;
    this.lives = 1;
    this.coins = 0;
  }

  create(): void {
    this.cameras.main.setBackgroundColor("rgba(0,0,0,0)");

    this.hudRenderer = new HUDRenderer(this);
    this.hudRenderer.build(this.lives, this.coins, this.currentLevel);

    this.bindGameEvents();
  }

  // ─── Events ────────────────────────────────────────────────────────────────

  private bindGameEvents(): void {
    const gameScene = this.scene.get(SCENE.GAME);

    gameScene.events.on(
      "coin-collected",
      (total: number) => {
        this.coins = total;
        this.hudRenderer.setCoins(this.coins);
      },
      this,
    );

    gameScene.events.on(
      "life-lost",
      (remaining: number) => {
        this.lives = remaining;
        this.hudRenderer.setLives(this.lives);
        this.cameras.main.shake(200, 0.01);
      },
      this,
    );

    gameScene.events.on(
      "timer-update",
      (elapsed: number) => {
        this.hudRenderer.setTimer(elapsed);
      },
      this,
    );

    // Clean up listeners when HUD scene is stopped
    this.events.once("shutdown", () => {
      gameScene.events.off("coin-collected");
      gameScene.events.off("life-lost");
      gameScene.events.off("timer-update");
    });
  }
}
