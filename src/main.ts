import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { GameScene } from "./scenes/GameScene";
import { HUDScene } from "./scenes/HUDScene";
import { GameOverScene } from "./scenes/GameOverScene";
import { LevelCompleteScene } from "./scenes/LevelCompleteScene";
import { CharacterUnlockScene } from "./scenes/CharacterUnlockScene";
import { PauseScene } from "./scenes/PauseScene";
import { UIScene } from "./scenes/UIScene";
import { GAME_WIDTH, GAME_HEIGHT, GAME_ZOOM, GRAVITY_Y } from "./config";

/**
 * main.ts — Phaser game entry point.
 *
 * Key config decisions:
 *
 *  type: Phaser.AUTO
 *    → Uses WebGL if available, falls back to Canvas.
 *    → WebGL is required for future shader effects (Phase 6).
 *
 *  width/height: 480x270
 *    → 16:9 at a low internal resolution — scaled up by zoom.
 *    → All game coordinates are in these "logic pixels".
 *
 *  zoom: 3
 *    → 480*3 = 1440 × 270*3 = 810 — fits inside most 1080p screens.
 *    → Integer zoom is CRITICAL for pixel art: fractional zoom blurs edges.
 *
 *  pixelArt: true
 *    → Sets canvas image-rendering: pixelated inside Phaser AND all textures
 *       use NEAREST neighbor filtering (no bilinear blur on upscale).
 *
 *  antialias: false
 *    → Enforces crisp pixel edges at the WebGL context level.
 *    → pixelArt:true sets texture filtering; antialias:false sets context AA.
 *
 *  roundPixels: true
 *    → Forces all game objects to snap to integer pixel positions before draw.
 *    → Without this, camera scroll causes ½-pixel jitter on sprite edges.
 *
 *  Scene order:
 *    → Scenes are rendered bottom-up in the array order.
 *    → HUDScene is registered near end; GameOverScene / LevelCompleteScene
 *       overlay GameScene. CharacterUnlockScene can overlay any active scene.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  zoom: GAME_ZOOM,
  pixelArt: true, // disables NEAREST neighbour texture filtering
  antialias: false, // crisp pixel edges at WebGL context level
  roundPixels: true, // snaps objects to integer coords — eliminates sub-pixel jitter
  autoRound: true, // rounds scaled canvas size to whole pixels
  backgroundColor: "#5C94FC", // Mario-blue sky default (overridden per-level)
  parent: "game-container",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: GRAVITY_Y },
      debug: false, // ← Set to `true` to visualize hitboxes during dev
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    GameScene,
    HUDScene,
    UIScene,
    GameOverScene,
    LevelCompleteScene,
    CharacterUnlockScene,
    PauseScene,
  ],
};

export default new Phaser.Game(config);
