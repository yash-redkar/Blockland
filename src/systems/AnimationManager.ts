import Phaser from 'phaser';

/**
 * AnimationManager — registers global named animations from pre-generated textures.
 *
 * All animation keys follow the pattern:  `{entityName}-{state}`
 * e.g.  'player-idle', 'player-run', 'player-jump'
 *
 * Animations are registered on the GLOBAL AnimationManager (scene.anims)
 * so they are accessible from any scene after PreloadScene runs.
 *
 * When we swap in real spritesheets later, only this class needs updating —
 * Player.ts simply plays animation keys and doesn't care about the frames.
 */
export class AnimationManager {
  private anims: Phaser.Animations.AnimationManager;

  constructor(scene: Phaser.Scene) {
    this.anims = scene.anims;
  }

  /**
   * Register player animations.
   * The 'player' texture is a horizontal strip generated in PreloadScene:
   *   Frame 0:   idle   (1 frame)
   *   Frame 1-4: run    (4 frames)
   *   Frame 5:   jump   (1 frame)
   *   Frame 6:   fall   (1 frame)
   *   Frame 7:   hurt   (1 frame)
   */
  registerPlayerAnimations(): void {
    const defs: Array<{
      key: string;
      start: number;
      end: number;
      frameRate: number;
      repeat: number;
    }> = [
      { key: 'player-idle', start: 0, end: 0, frameRate: 4,  repeat: -1 },
      { key: 'player-run',  start: 1, end: 4, frameRate: 10, repeat: -1 },
      { key: 'player-jump', start: 5, end: 5, frameRate: 1,  repeat:  0 },
      { key: 'player-fall', start: 6, end: 6, frameRate: 1,  repeat:  0 },
      { key: 'player-hurt', start: 7, end: 7, frameRate: 1,  repeat:  0 },
    ];

    for (const def of defs) {
      if (!this.anims.exists(def.key)) {
        this.anims.create({
          key: def.key,
          frames: this.anims.generateFrameNumbers('player', {
            start: def.start,
            end: def.end,
          }),
          frameRate: def.frameRate,
          repeat: def.repeat,
        });
      }
    }
  }
}
