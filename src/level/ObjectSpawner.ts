import Phaser from "phaser";
import { LevelConfig, MovingHazardDef } from "../data/LevelConfig";
import { Enemy } from "../entities/Enemy";
import { Lava } from "../entities/Lava";
import { TILE_SIZE } from "../config";

export interface SpawnResult {
  coins: Phaser.Physics.Arcade.StaticGroup;
  spikes: Phaser.Physics.Arcade.StaticGroup;
  enemies: Enemy[];
  lavas: Lava[];
  flagBody: Phaser.Physics.Arcade.StaticGroup;
  spawn: { x: number; y: number };
}

/**
 * ObjectSpawner — Creates all game entities from a LevelConfig objects list.
 *
 * Entity classes used:
 *  Enemy  — patrol AI class
 *  Lava   — continuous damage zone
 *
 * Coins, spikes, and the flag are simple physics images (less overhead).
 */
export class ObjectSpawner {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  spawnFromConfig(config: LevelConfig): SpawnResult {
    const coins = this.scene.physics.add.staticGroup();
    const spikes = this.scene.physics.add.staticGroup();
    const enemies: Enemy[] = [];
    const lavas: Lava[] = [];
    const flagBody = this.scene.physics.add.staticGroup();
    let spawn = { x: 3 * TILE_SIZE, y: config.worldHeight - 3 * TILE_SIZE };

    for (const obj of config.objects) {
      switch (obj.type) {
        case "spawn":
          spawn = { x: obj.px, y: obj.py };
          break;

        case "coin":
          this.spawnCoin(coins, obj.px, obj.py);
          break;

        case "spike":
          this.spawnSpike(
            spikes,
            obj.px + TILE_SIZE / 2,
            obj.py + TILE_SIZE / 2,
          );
          break;

        case "lava": {
          const w = obj.w ?? TILE_SIZE;
          const variant: "water" | "lava" = config.id === 1 ? "water" : "lava";
          lavas.push(new Lava(this.scene, obj.px, obj.py, w, variant));
          break;
        }

        case "enemy": {
          const e = new Enemy(
            this.scene,
            obj.px,
            obj.py,
            config.enemySpeedMult,
            obj.patrolRange ?? 96,
            obj.enemyMode ?? "ground",
          );
          enemies.push(e);
          break;
        }

        case "flag":
          this.spawnFlag(flagBody, obj.px, obj.py);
          break;
      }
    }

    return { coins, spikes, enemies, lavas, flagBody, spawn };
  }

  // ─── Entity factories ──────────────────────────────────────────────────────

  private spawnCoin(
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
  ): void {
    const coin = group.create(x, y, "icon_coin") as Phaser.Physics.Arcade.Image;
    coin.setDepth(5).refreshBody();

    // Float up/down tween
    this.scene.tweens.add({
      targets: coin,
      y: y - 4,
      duration: 700 + Math.random() * 200,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });

    // Subtle rotation
    this.scene.tweens.add({
      targets: coin,
      scaleX: -1,
      duration: 1000 + Math.random() * 300,
      ease: "Linear",
      yoyo: true,
      repeat: -1,
    });
  }

  private spawnSpike(
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
  ): void {
    const spike = group.create(x, y, "spike") as Phaser.Physics.Arcade.Image;
    spike.setDepth(5).refreshBody();
    // Shrink hitbox to be more forgiving (tip area only)
    (spike.body as Phaser.Physics.Arcade.StaticBody)
      .setSize(10, 10)
      .setOffset(3, 0);
    spike.refreshBody();
  }

  private spawnFlag(
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number,
    y: number,
  ): void {
    const f = group.create(x, y, "flag") as Phaser.Physics.Arcade.Image;
    f.setDepth(5).setOrigin(0, 1).refreshBody();

    // Pennant wave
    this.scene.tweens.add({
      targets: f,
      x: x + 2,
      duration: 500,
      ease: "Sine.InOut",
      yoyo: true,
      repeat: -1,
    });
  }

  /**
   * Spawns a spike that moves along a horizontal or vertical path (yoyo loop).
   */
  spawnMovingSpike(
    group: Phaser.Physics.Arcade.StaticGroup,
    config: MovingHazardDef,
  ): void {
    const { px, py, direction, range, speed } = config;
    const T = TILE_SIZE;

    const spike = this.scene.physics.add.sprite(
      px + T / 2,
      py + T / 2,
      "spike",
    );
    spike.setDepth(5);

    const body = spike.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setImmovable(true);
    body.setSize(10, 10).setOffset(3, 0);

    const targetX =
      direction === "horizontal" ? px + T / 2 + range * T : px + T / 2;
    const targetY =
      direction === "vertical" ? py + T / 2 + range * T : py + T / 2;

    const dist = range * T;
    const duration = (dist / (speed * T)) * 1000;

    this.scene.tweens.add({
      targets: spike,
      x: targetX,
      y: targetY,
      duration: duration,
      ease: "Linear",
      yoyo: true,
      repeat: -1,
    });

    // Add to spikes group for logic to work (collisions, etc.)
    group.add(spike);
  }
}
