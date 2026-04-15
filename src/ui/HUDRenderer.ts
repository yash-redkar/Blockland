import Phaser from 'phaser';
import { GAME_WIDTH, HUD_MARGIN } from '../config';

/**
 * HUDRenderer — Builds and updates phase-5 HUD using Phaser GameObjects.
 *
 * Layout (all setScrollFactor(0) so they stick to the camera):
 *
 *   [ ♥ ♥ ♥ ]          [ coin 12 ]        [ LV 1  0:00 ]
 *     hearts row           center             right
 *
 * Hearts: individual icon_heart sprites, greyed when lost.
 * Coin:   icon_coin sprite + text counter; both pop-scale on change.
 */
export class HUDRenderer {
  private scene: Phaser.Scene;

  // ♥ row — one sprite per max life slot
  private readonly MAX_LIVES = 3;
  private heartSprites: Phaser.GameObjects.Image[] = [];

  // Coin display
  private coinIcon!:  Phaser.GameObjects.Image;
  private coinsText!: Phaser.GameObjects.Text;

  // Right side
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  build(lives: number, coins: number, level: number): void {
    const M   = HUD_MARGIN;
    const D   = 20; // depth

    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize:   '8px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 2,
    };

    // ── HUD bar backdrop ─────────────────────────────────────────────────────
    this.scene.add
      .rectangle(0, 0, GAME_WIDTH, 20, 0x000000, 0.42)
      .setOrigin(0, 0)
      .setDepth(D - 1)
      .setScrollFactor(0);

    // ── Hearts row ───────────────────────────────────────────────────────────
    // Each heart is a separate icon_heart sprite; greyed ones show lost lives.
    for (let i = 0; i < this.MAX_LIVES; i++) {
      const heart = this.scene.add
        .image(M + 2 + i * 15, M + 5, 'icon_heart')
        .setOrigin(0, 0)
        .setDepth(D)
        .setScrollFactor(0);
      this.heartSprites.push(heart);
    }
    this.setLives(lives);

    // ── Coin counter (center-left) ───────────────────────────────────────────
    this.coinIcon = this.scene.add
      .image(GAME_WIDTH / 2 - 20, M + 5, 'icon_coin')
      .setOrigin(0, 0)
      .setDepth(D)
      .setScrollFactor(0);

    this.coinsText = this.scene.add
      .text(GAME_WIDTH / 2 - 6, M + 2, `x ${coins}`, textStyle)
      .setOrigin(0, 0)
      .setDepth(D)
      .setScrollFactor(0);

    // ── Level + timer (right) ────────────────────────────────────────────────
    this.levelText = this.scene.add
      .text(GAME_WIDTH - M, M + 2, `LV ${level}`, {
        ...textStyle,
        color: '#ffe080',
      })
      .setOrigin(1, 0)
      .setDepth(D)
      .setScrollFactor(0);

    this.timerText = this.scene.add
      .text(GAME_WIDTH - M, M + 11, '0:00', {
        ...textStyle,
        fontSize: '6px',
        color: '#aaccff',
      })
      .setOrigin(1, 0)
      .setDepth(D)
      .setScrollFactor(0);
  }

  // ─── Setters ───────────────────────────────────────────────────────────────

  setLives(n: number): void {
    this.heartSprites.forEach((heart, i) => {
      // Hearts beyond remaining lives are greyed out
      if (i < n) {
        heart.clearTint();
      } else {
        heart.setTint(0x444444);
      }
    });

    // Brief scale pop on the first heart as tactile feedback
    if (this.heartSprites[0]) this.scalePop(this.heartSprites[0]);
  }

  setCoins(n: number): void {
    this.coinsText?.setText(`x ${n}`);
    // Pop both coin icon and counter text
    if (this.coinIcon)  this.scalePop(this.coinIcon);
    if (this.coinsText) this.scalePop(this.coinsText);
  }

  setLevel(n: number): void {
    this.levelText?.setText(`LV ${n}`);
  }

  setTimer(ms: number): void {
    const secs = Math.floor(ms / 1000);
    const m    = Math.floor(secs / 60);
    const s    = String(secs % 60).padStart(2, '0');
    this.timerText?.setText(`${m}:${s}`);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private scalePop(target: Phaser.GameObjects.GameObject): void {
    this.scene.tweens.add({
      targets:  target,
      scaleX:   1.4,
      scaleY:   1.4,
      duration: 80,
      ease:     'Back.Out',
      yoyo:     true,
    });
  }
}
