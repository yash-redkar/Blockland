import Phaser from 'phaser';
import { SCENE, GAME_WIDTH, GAME_HEIGHT } from '../config';
import { CharacterRegistry, CharacterDef } from '../data/PlayerState';

/**
 * CharacterUnlockScene — Modal overlay when a 500-coin milestone is hit.
 * Launched on top of GameScene (doesn't stop GameScene).
 * Receives: { characterKey: string }
 */
export class CharacterUnlockScene extends Phaser.Scene {
  private characterKey = 'knight';

  constructor() {
    super({ key: SCENE.CHAR_UNLOCK });
  }

  init(data: { characterKey?: string }): void {
    this.characterKey = data?.characterKey ?? 'knight';
  }

  create(): void {
    this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');

    const char = CharacterRegistry.get(this.characterKey);
    if (!char) {
      this.scene.stop(SCENE.CHAR_UNLOCK);
      return;
    }

    const cx = GAME_WIDTH / 2;

    // Dark overlay
    this.add
      .rectangle(cx, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000033, 0.82)
      .setOrigin(0.5);

    // Header
    this.add.text(cx, 36, '★  UNLOCK!  ★', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#ffd700',
      stroke: '#664400',
      strokeThickness: 3,
      letterSpacing: 4,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(cx, 56, 'NEW CHARACTER UNLOCKED', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '6px',
      color: '#aaaaee',
      letterSpacing: 3,
    }).setOrigin(0.5).setDepth(10);

    // Character portrait
    this.drawPortrait(cx, 112, char);

    // Character name
    this.add.text(cx, 148, char.label.toUpperCase(), {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '14px',
      color: char.bodyColor,
      stroke: '#000000',
      strokeThickness: 3,
      letterSpacing: 5,
    }).setOrigin(0.5).setDepth(10);

    this.add.text(cx, 167, `Unlocked at ${char.milestoneCoins} coins`, {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '6px',
      color: '#aaaaaa',
      letterSpacing: 1,
    }).setOrigin(0.5).setDepth(10);

    // Character sprite preview
    if (this.textures.exists(char.key)) {
      this.add.sprite(cx + 50, 112, char.key, 0)
        .setScale(3)
        .setDepth(10)
        .setOrigin(0.5);
    }

    // Continue button
    const btn = this.add.text(cx, 205, '[ CONTINUE ]', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '9px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(10);

    btn.on('pointerover', () => btn.setColor('#ffd700'));
    btn.on('pointerout',  () => btn.setColor('#ffffff'));
    btn.on('pointerdown', () => this.dismiss());

    this.input.keyboard!.once('keydown-ENTER', () => this.dismiss());
    this.input.keyboard!.once('keydown-SPACE',  () => this.dismiss());

    this.cameras.main.fadeIn(400, 0, 0, 0);
    this.spawnSparkles(cx, 112);
  }

  private drawPortrait(cx: number, cy: number, char: CharacterDef): void {
    const g = this.add.graphics().setDepth(10);
    const W = 30, H = 44;
    const ox = cx - W / 2 - 30;
    const oy = cy - H / 2;

    // Body
    g.fillStyle(Phaser.Display.Color.HexStringToColor(char.bodyColor).color);
    g.fillRect(ox + 4, oy + 6, W - 8, H - 14);

    // Head
    g.fillStyle(Phaser.Display.Color.HexStringToColor(
      this.colorLighten(char.bodyColor, 20)
    ).color);
    g.fillRect(ox + 4, oy + 2, W - 8, 6);

    // Eye
    g.fillStyle(Phaser.Display.Color.HexStringToColor(char.eyeColor).color);
    g.fillRect(ox + W - 10, oy + 5, 4, 3);

    // Legs
    g.fillStyle(Phaser.Display.Color.HexStringToColor(char.legColor).color);
    const lw = Math.floor((W - 8) / 2) - 1;
    g.fillRect(ox + 4, oy + H - 12, lw, 8);
    g.fillRect(ox + W / 2 + 2, oy + H - 12, lw, 8);

    // Outline
    g.lineStyle(1, 0x000000, 0.5);
    g.strokeRect(ox + 4, oy + 6, W - 8, H - 14);
  }

  private spawnSparkles(cx: number, cy: number): void {
    if (!this.textures.exists('particle')) return;

    const emitter = this.add.particles(cx, cy, 'particle', {
      speed: { min: 30, max: 80 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      alpha: { start: 1, end: 0 },
      tint: 0xffd700,
      lifespan: 700,
      quantity: 2,
      frequency: 100,
    }).setDepth(15);

    this.time.delayedCall(2500, () => emitter.destroy());
  }

  private colorLighten(hex: string, amount: number): string {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    return Phaser.Display.Color.RGBToString(
      Math.min(255, c.red   + amount),
      Math.min(255, c.green + amount),
      Math.min(255, c.blue  + amount),
    );
  }

  private dismiss(): void {
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop(SCENE.CHAR_UNLOCK);
    });
  }
}
