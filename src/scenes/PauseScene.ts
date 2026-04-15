import Phaser from 'phaser';
import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config';

/**
 * PauseScene — Semi-transparent overlay that pauses GameScene.
 *
 * Launched via:  this.scene.pause('GameScene'); this.scene.launch('PauseScene');
 * Dismissed via: this.scene.resume('GameScene'); this.scene.stop();
 *
 * Three buttons built from Phaser Rectangle + Text objects (no DOM).
 * Each button dims on hover and brightens on click, matching the retro aesthetic.
 */
export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.PAUSE });
  }

  create(): void {
    const cx = GAME_WIDTH  / 2;
    const cy = GAME_HEIGHT / 2;

    // ── Semi-transparent backdrop ───────────────────────────────────────────
    this.add
      .rectangle(cx, cy, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55)
      .setScrollFactor(0)
      .setDepth(50);

    // ── "PAUSED" title ──────────────────────────────────────────────────────
    this.add
      .text(cx, cy - 60, 'PAUSED', {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '18px',
        color: '#ffee33',
        stroke: '#886600',
        strokeThickness: 3,
        letterSpacing: 6,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(51);

    // ── Buttons ─────────────────────────────────────────────────────────────
    const buttons: Array<{ label: string; action: () => void }> = [
      {
        label: 'RESUME',
        action: () => {
          this.scene.resume(SCENE.GAME);
          this.scene.stop();
        },
      },
      {
        label: 'RESTART',
        action: () => {
          this.scene.stop(SCENE.GAME);
          this.scene.start(SCENE.GAME);
        },
      },
      {
        label: 'QUIT',
        action: () => {
          this.scene.stop(SCENE.GAME);
          this.scene.start(SCENE.MAIN_MENU);
        },
      },
    ];

    buttons.forEach((btn, i) => {
      const by = cy - 14 + i * 38;

      // Button background rect
      const bg = this.add
        .rectangle(cx, by, 120, 22, 0x112266, 0.95)
        .setStrokeStyle(1, 0x4488ff, 0.8)
        .setScrollFactor(0)
        .setDepth(51)
        .setInteractive({ useHandCursor: true });

      const label = this.add
        .text(cx, by, btn.label, {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: '9px',
          color: '#ffffff',
          letterSpacing: 3,
        })
        .setOrigin(0.5)
        .setScrollFactor(0)
        .setDepth(52);

      // Hover highlight
      bg.on('pointerover', () => {
        bg.setFillStyle(0x2255cc, 1);
        label.setColor('#ffee55');
        this.tweens.add({ targets: bg, scaleX: 1.06, duration: 60, ease: 'Back.Out' });
      });
      bg.on('pointerout', () => {
        bg.setFillStyle(0x112266, 0.95);
        label.setColor('#ffffff');
        this.tweens.add({ targets: bg, scaleX: 1.0, duration: 60 });
      });
      bg.on('pointerdown', () => btn.action());
    });

    // ── Dismiss on Escape or P ──────────────────────────────────────────────
    this.input.keyboard!.once('keydown-ESC', () => {
      this.scene.resume(SCENE.GAME);
      this.scene.stop();
    });
    this.input.keyboard!.once('keydown-P', () => {
      this.scene.resume(SCENE.GAME);
      this.scene.stop();
    });
  }
}
