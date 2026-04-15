import Phaser from "phaser";
import { TILE_SIZE } from "../config";
import { LevelConfig } from "../data/LevelConfig";

/**
 * TilemapLoader — Builds the static tilemap geometry from a LevelConfig.
 *
 * Phase 1/2/3: Uses LevelConfig TypeScript objects for all level data.
 * Phase 3+: Can be extended to load Tiled JSON via this.scene.make.tilemap().
 *
 * Exposes:
 *   groundLayer    — solid ground tiles (StaticGroup)
 *   platformLayer  — static floating platforms (StaticGroup)
 *
 * World dims are set from the LevelConfig, updating physics world bounds.
 */
export class TilemapLoader {
  private scene: Phaser.Scene;

  groundLayer!: Phaser.Physics.Arcade.StaticGroup;
  platformLayer!: Phaser.Physics.Arcade.StaticGroup;

  worldWidth = 2400;
  worldHeight = 480;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Build the level geometry from a LevelConfig.
   * Generates ground row and static platforms.
   */
  buildFromConfig(config: LevelConfig): void {
    this.worldWidth = config.worldWidth;
    this.worldHeight = config.worldHeight;

    this.groundLayer = this.scene.physics.add.staticGroup();
    this.platformLayer = this.scene.physics.add.staticGroup();

    const T = TILE_SIZE;

    // Build a quick lookup of bottom-row hazard spans so we can carve pits.
    const pitTiles = new Set<number>();
    const tileCount = Math.ceil(this.worldWidth / T);
    for (const obj of config.objects) {
      if (obj.type !== "lava") continue;
      const w = obj.w ?? T;
      // Add a 1-tile safety margin on both sides so narrow hazards become
      // real pits and the player cannot "bridge" across them.
      const startTile = Math.max(0, Math.floor(obj.px / T) - 1);
      const endTile = Math.min(tileCount - 1, Math.ceil((obj.px + w) / T));
      for (let t = startTile; t <= endTile; t++) {
        pitTiles.add(t);
      }
    }

    // ── Ground floor (bottom row with hazard gaps) ────────────────────────
    const groundY = this.worldHeight - T;

    for (let i = 0; i < tileCount; i++) {
      if (pitTiles.has(i)) {
        continue;
      }
      this.groundLayer
        .create(i * T + T / 2, groundY, "tile_ground")
        .setOrigin(0.5)
        .refreshBody();
    }

    // ── Platforms from config ───────────────────────────────────────────────
    for (const plat of config.platforms) {
      const py = plat.y * T;

      // Static platforms only
      for (let j = 0; j < plat.w; j++) {
        this.platformLayer
          .create((plat.x + j) * T + T / 2, py, "tile_platform")
          .setOrigin(0.5)
          .refreshBody();
      }
    }
  }

  /**
   * Returns the spawn position (pixels) — just the default (3 tiles from left, near ground).
   * ObjectSpawner will override this from the Objects list.
   */
  getDefaultSpawn(): { x: number; y: number } {
    return { x: 3 * TILE_SIZE, y: this.worldHeight - 3 * TILE_SIZE };
  }
}
