import Phaser from "phaser";
import { SCENE } from "../config";
import { CharacterRegistry, CharacterDef } from "../data/PlayerState";

/**
 * PreloadScene — Generates ALL programmatic textures for the game.
 *
 * Marco / Metal-Slug-inspired character art:
 *   Frame size: 20×28 px per frame, 10 frames total.
 *   Frame 0  : idle
 *   Frame 1-6: run (6-frame smooth cycle)
 *   Frame 7  : jump (arms up, body stretch)
 *   Frame 8  : fall (arms spread)
 *   Frame 9  : hurt (red flash, knockback pose)
 *
 * Enemy: 16×18 px per frame, 4-frame walk cycle.
 */
export class PreloadScene extends Phaser.Scene {
  private static readonly PLAYER_FRAME_W = 32;
  private static readonly PLAYER_FRAME_H = 32;

  constructor() {
    super({ key: SCENE.PRELOAD });
  }

  preload(): void {
    const { width, height } = this.scale;

    // Outer track
    const barBg = this.add.rectangle(width / 2, height / 2, 220, 14, 0x111133);
    barBg.setOrigin(0.5);

    // Filled portion — grows left→right
    const bar = this.add.rectangle(
      width / 2 - 110,
      height / 2,
      0,
      10,
      0xffcc00,
    );
    bar.setOrigin(0, 0.5);

    // Pulsing "LOADING..." label above bar
    const loadTxt = this.add
      .text(width / 2, height / 2 - 20, "LOADING...", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "10px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: loadTxt,
      alpha: 0.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Live percentage counter below bar
    const pctTxt = this.add
      .text(width / 2, height / 2 + 14, "0%", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "8px",
        color: "#ffcc00",
      })
      .setOrigin(0.5);

    this.load.on("progress", (v: number) => {
      bar.width = 220 * v;
      pctTxt.setText(`${Math.round(v * 100)}%`);
    });

    this.load.on("complete", () => {
      pctTxt.setText("100%");
    });

    // Bitmap font loading disabled until assets exist on disk.

    const heroSheets = [
      {
        key: "explorer",
        base: "free-pixel-art-tiny-hero-sprites/2 Owlet_Monster/Owlet_Monster",
      },
      {
        key: "knight",
        base: "free-pixel-art-tiny-hero-sprites/3 Dude_Monster/Dude_Monster",
      },
      {
        key: "mage",
        base: "free-pixel-art-tiny-hero-sprites/1 Pink_Monster/Pink_Monster",
      },
      // Keep fourth unlock slot mapped to pink variant for now.
      {
        key: "robot",
        base: "free-pixel-art-tiny-hero-sprites/1 Pink_Monster/Pink_Monster",
      },
    ] as const;

    for (const hero of heroSheets) {
      this.load.spritesheet(
        `${hero.key}-idle-sheet`,
        `${hero.base}_Idle_4.png`,
        {
          frameWidth: PreloadScene.PLAYER_FRAME_W,
          frameHeight: PreloadScene.PLAYER_FRAME_H,
        },
      );
      this.load.spritesheet(`${hero.key}-run-sheet`, `${hero.base}_Run_6.png`, {
        frameWidth: PreloadScene.PLAYER_FRAME_W,
        frameHeight: PreloadScene.PLAYER_FRAME_H,
      });
      this.load.spritesheet(
        `${hero.key}-jump-sheet`,
        `${hero.base}_Jump_8.png`,
        {
          frameWidth: PreloadScene.PLAYER_FRAME_W,
          frameHeight: PreloadScene.PLAYER_FRAME_H,
        },
      );
      this.load.spritesheet(
        `${hero.key}-hurt-sheet`,
        `${hero.base}_Hurt_4.png`,
        {
          frameWidth: PreloadScene.PLAYER_FRAME_W,
          frameHeight: PreloadScene.PLAYER_FRAME_H,
        },
      );
      this.load.spritesheet(
        `${hero.key}-death-sheet`,
        `${hero.base}_Death_8.png`,
        {
          frameWidth: PreloadScene.PLAYER_FRAME_W,
          frameHeight: PreloadScene.PLAYER_FRAME_H,
        },
      );
    }

    // Fallback: load 'Press Start 2P' via Google Fonts URL
    // We use context.load correctly by injecting a stylesheet or using Phaser's loader
    // For this specific project, we'll assume the user might want a real bitmap font
    // but we'll stick to the requested "boilerplate" loading logic.
  }

  create(): void {
    this.preparePlayerTextures();
    this.generateEnvironmentTextures();
    this.generateHazardTextures();
    this.generateParallaxTextures();
    this.generateUITextures();
    this.registerAnimations();
    this.scene.start(SCENE.MAIN_MENU);
  }

  private preparePlayerTextures(): void {
    for (const char of CharacterRegistry.CHARACTERS) {
      const idleSheetKey = `${char.key}-idle-sheet`;
      if (!this.textures.exists(idleSheetKey)) {
        continue;
      }

      if (this.textures.exists(char.key)) {
        this.textures.remove(char.key);
      }

      const src = this.textures
        .get(idleSheetKey)
        .getSourceImage() as HTMLImageElement;
      this.textures.addSpriteSheet(char.key, src, {
        frameWidth: PreloadScene.PLAYER_FRAME_W,
        frameHeight: PreloadScene.PLAYER_FRAME_H,
      });
    }

    // Final fallback path: if any character texture is still missing,
    // create generated sprites so gameplay never breaks.
    if (
      CharacterRegistry.CHARACTERS.some(
        (char) => !this.textures.exists(char.key),
      )
    ) {
      this.generateAllCharacterTextures();
    }
  }

  // ─── Characters ─────────────────────────────────────────────────────────────

  private generateAllCharacterTextures(): void {
    for (const char of CharacterRegistry.CHARACTERS) {
      this.generateCharacterSpritesheet(char);
    }
  }

  /**
   * Each character is a 10-frame horizontal spritesheet (20×28 px per frame).
   * Inspired by Metal Slug / Super Mario proportions.
   *
   * Frame layout:
   *   0        = idle  (slight lean, ready stance)
   *   1-6      = run   (6-frame cycle with full arm/leg swing)
   *   7        = jump  (arms raised, vertical body stretch)
   *   8        = fall  (arms spread, horizontal stretch)
   *   9        = hurt  (red, knockback curl)
   */
  private generateCharacterSpritesheet(char: CharacterDef): void {
    const FW = 20,
      FH = 28;
    const FRAMES = 10;

    if (this.textures.exists(char.key)) return;

    const canvas = document.createElement("canvas");
    canvas.width = FW * FRAMES;
    canvas.height = FH;
    const ctx = canvas.getContext("2d")!;

    const bodyC = char.bodyColor;
    const eyeC = char.eyeColor;
    const legC = char.legColor;
    const skinC = "#f5c278"; // warm skin tone
    const dark = this.darken(bodyC, 35);
    const legDk = this.darken(legC, 35);
    const midC = this.darken(bodyC, 15);

    // ── Run-leg offsets (6 frames) ───────────────────────────────────────────
    // Each entry: [leftLegY, rightLegY, leftFootY, rightFootY]
    const runLegs = [
      [0, 3, 0, 2], // f1: left forward, right back
      [1, 4, 0, 3], // f2
      [3, 3, 2, 2], // f3: mid-stride contact
      [3, 0, 2, 0], // f4: right forward, left back
      [4, 1, 3, 0], // f5
      [3, 0, 2, 0], // f6: stride recovery
    ];

    // Run-arm offsets [leftArmY, rightArmY]
    const runArms = [
      [-3, 2],
      [-5, 3],
      [-4, 1],
      [2, -3],
      [3, -5],
      [1, -4],
    ];

    for (let f = 0; f < FRAMES; f++) {
      const ox = f * FW;
      const isHurt = f === 9;
      const isJump = f === 7;
      const isFall = f === 8;
      const isIdle = f === 0;
      const isRun = f >= 1 && f <= 6;
      const runIdx = isRun ? f - 1 : 0;

      const bc = isHurt ? "#ff4444" : bodyC;
      const lc = isHurt ? "#cc2222" : legC;
      const sk = isHurt ? "#ffaaaa" : skinC;
      const bm = isHurt ? "#cc2222" : midC;
      const bd = isHurt ? "#aa1111" : dark;
      const ld = isHurt ? "#aa1111" : legDk;

      // ── 1. LEGS & BOOTS ──────────────────────────────────────────────────
      const legW = 4;
      const lx = 5; // left leg x
      const rx = 11; // right leg x

      if (isJump) {
        // Legs bent backwards (curl)
        ctx.fillStyle = lc;
        ctx.fillRect(ox + lx, FH - 9, legW, 6);
        ctx.fillRect(ox + rx, FH - 9, legW, 6);
        ctx.fillStyle = ld;
        ctx.fillRect(ox + lx - 1, FH - 5, legW + 2, 4);
        ctx.fillRect(ox + rx - 1, FH - 5, legW + 2, 4);
      } else if (isFall) {
        // Legs spread wide
        ctx.fillStyle = lc;
        ctx.fillRect(ox + 2, FH - 9, legW, 9);
        ctx.fillRect(ox + 14, FH - 9, legW, 9);
        ctx.fillStyle = ld;
        ctx.fillRect(ox + 1, FH - 4, legW + 1, 4);
        ctx.fillRect(ox + 13, FH - 4, legW + 1, 4);
      } else {
        const [lly, rly, ,] = isRun ? runLegs[runIdx] : [0, 0, 0, 0];
        // Left leg
        ctx.fillStyle = lc;
        ctx.fillRect(ox + lx, FH - 9 + lly, legW, 9 - lly);
        // Right leg
        ctx.fillRect(ox + rx, FH - 9 + rly, legW, 9 - rly);
        // Boots
        ctx.fillStyle = ld;
        ctx.fillRect(ox + lx - 1, FH - 4, legW + 2, 4);
        ctx.fillRect(ox + rx - 1, FH - 4, legW + 2, 4);
        // Boot highlight
        ctx.fillStyle = this.lighten(legDk, 20);
        ctx.fillRect(ox + lx, FH - 4, 2, 2);
        ctx.fillRect(ox + rx, FH - 4, 2, 2);
      }

      // ── 2. TORSO ─────────────────────────────────────────────────────────
      const torsoTop = FH - 20;
      const torsoHeight = 11;
      const torsoX = 4;
      const torsoW = FW - 8;

      ctx.fillStyle = bc;
      ctx.fillRect(ox + torsoX, torsoTop, torsoW, torsoHeight);

      // Chest shading panel
      ctx.fillStyle = bm;
      ctx.fillRect(ox + torsoX + 1, torsoTop + 1, torsoW - 2, 4);

      // Shirt stripes / logo detail
      ctx.fillStyle = bd;
      ctx.fillRect(ox + torsoX, torsoTop, torsoW, 1); // shadow top
      ctx.fillRect(ox + torsoX, torsoTop + torsoHeight - 1, torsoW, 1); // bottom line

      // Belt
      ctx.fillStyle = ld;
      ctx.fillRect(ox + torsoX, FH - 10, torsoW, 2);

      // Belt buckle
      ctx.fillStyle = "#ddbb00";
      ctx.fillRect(ox + FW / 2 - 2, FH - 11, 4, 3);
      ctx.fillStyle = "#ffdd44";
      ctx.fillRect(ox + FW / 2 - 1, FH - 11, 2, 1);

      // ── 3. ARMS ──────────────────────────────────────────────────────────
      if (isJump) {
        // Both arms raised high
        ctx.fillStyle = bc;
        ctx.fillRect(ox + 1, torsoTop - 6, 3, 9);
        ctx.fillRect(ox + FW - 4, torsoTop - 6, 3, 9);
        ctx.fillStyle = sk;
        ctx.fillRect(ox, torsoTop - 8, 3, 4);
        ctx.fillRect(ox + FW - 3, torsoTop - 8, 3, 4);
      } else if (isFall) {
        // Arms spread horizontally
        ctx.fillStyle = bc;
        ctx.fillRect(ox - 1, torsoTop + 2, 5, 3);
        ctx.fillRect(ox + FW - 4, torsoTop + 2, 5, 3);
        ctx.fillStyle = sk;
        ctx.fillRect(ox - 3, torsoTop + 1, 4, 4);
        ctx.fillRect(ox + FW - 1, torsoTop + 1, 4, 4);
      } else {
        const [lay, ray] = isRun ? runArms[runIdx] : [0, 0];
        // Left arm
        ctx.fillStyle = bc;
        ctx.fillRect(ox + 1, torsoTop + 1 + lay, 3, 7);
        ctx.fillStyle = sk;
        ctx.fillRect(ox + 1, torsoTop + 7 + lay, 3, 3);
        // Right arm
        ctx.fillStyle = bc;
        ctx.fillRect(ox + FW - 4, torsoTop + 1 + ray, 3, 7);
        ctx.fillStyle = sk;
        ctx.fillRect(ox + FW - 4, torsoTop + 7 + ray, 3, 3);
      }

      // ── 4. NECK ──────────────────────────────────────────────────────────
      ctx.fillStyle = sk;
      ctx.fillRect(ox + 8, torsoTop - 3, 4, 4);

      // ── 5. HEAD ──────────────────────────────────────────────────────────
      const headTop = torsoTop - 11;
      const headX = 5;
      const headW = FW - 10;

      ctx.fillStyle = sk;
      ctx.fillRect(ox + headX, headTop, headW, 9);

      // Head shading (top and bottom)
      ctx.fillStyle = this.darken(skinC, 20);
      ctx.fillRect(ox + headX, headTop + 7, headW, 2);

      // ── 6. FACIAL FEATURES ───────────────────────────────────────────────
      // Eyebrows
      ctx.fillStyle = this.darken(skinC, 50);
      ctx.fillRect(ox + 7, headTop + 1, 3, 1);
      ctx.fillRect(ox + FW - 10, headTop + 1, 3, 1);

      // Eye white
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ox + 7, headTop + 3, 3, 2);
      ctx.fillRect(ox + FW - 10, headTop + 3, 3, 2);

      // Pupil/iris
      ctx.fillStyle = eyeC;
      ctx.fillRect(ox + 8, headTop + 3, 2, 2);
      ctx.fillRect(ox + FW - 10, headTop + 3, 2, 2);

      // Pupil dark
      ctx.fillStyle = "#000033";
      ctx.fillRect(ox + 9, headTop + 4, 1, 1);
      ctx.fillRect(ox + FW - 9, headTop + 4, 1, 1);

      // Eye shine
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.fillRect(ox + 7, headTop + 3, 1, 1);
      ctx.fillRect(ox + FW - 10, headTop + 3, 1, 1);

      // Mouth / expression
      if (isHurt) {
        ctx.fillStyle = "#333333";
        ctx.fillRect(ox + 7, headTop + 6, 6, 1);
        ctx.fillRect(ox + 7, headTop + 7, 1, 1);
        ctx.fillRect(ox + 12, headTop + 7, 1, 1);
      } else if (isJump) {
        ctx.fillStyle = "#333333";
        ctx.fillRect(ox + 8, headTop + 6, 4, 2);
        ctx.fillStyle = "#ff7777";
        ctx.fillRect(ox + 9, headTop + 7, 2, 1);
      } else if (isIdle) {
        // Small confident smile
        ctx.fillStyle = "#333333";
        ctx.fillRect(ox + 8, headTop + 6, 4, 1);
        ctx.fillRect(ox + 7, headTop + 7, 1, 1);
        ctx.fillRect(ox + 12, headTop + 7, 1, 1);
      }

      // ── 7. CHARACTER-SPECIFIC ACCESSORY ──────────────────────────────────
      this.drawAccessory(ctx, char, ox, FW, FH, headTop, f);
    }

    this.textures.addSpriteSheet(
      char.key,
      canvas as unknown as HTMLImageElement,
      { frameWidth: FW, frameHeight: FH },
    );
  }

  private drawAccessory(
    ctx: CanvasRenderingContext2D,
    char: CharacterDef,
    ox: number,
    FW: number,
    _FH: number,
    headTop: number,
    _frame: number,
  ): void {
    switch (char.key) {
      case "explorer": {
        // Wide-brim adventure hat
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(ox + 4, headTop - 1, FW - 8, 3); // hat brim
        ctx.fillRect(ox + 7, headTop - 5, FW - 14, 5); // hat crown
        ctx.fillStyle = "#A0522D";
        ctx.fillRect(ox + 4, headTop - 1, FW - 8, 1); // brim top highlight
        // Hat band
        ctx.fillStyle = "#cc8800";
        ctx.fillRect(ox + 7, headTop - 2, FW - 14, 1);
        break;
      }
      case "knight": {
        // Full metal helmet
        ctx.fillStyle = "#9999cc";
        ctx.fillRect(ox + 4, headTop - 2, FW - 8, 11); // visor cover
        ctx.fillStyle = "#bbbbee";
        ctx.fillRect(ox + 5, headTop - 1, FW - 10, 2); // top face plate
        ctx.fillRect(ox + 4, headTop - 2, FW - 8, 1); // helmet top
        // Visor slit
        ctx.fillStyle = "#222244";
        ctx.fillRect(ox + 6, headTop + 2, FW - 12, 2);
        // Helmet plume
        ctx.fillStyle = "#dd2222";
        ctx.fillRect(ox + FW / 2 - 1, headTop - 6, 2, 5);
        ctx.fillRect(ox + FW / 2 - 2, headTop - 8, 4, 3);
        break;
      }
      case "mage": {
        // Tall wizard hat
        ctx.fillStyle = char.bodyColor;
        ctx.fillRect(ox + 4, headTop - 1, FW - 8, 2); // hat brim
        ctx.fillRect(ox + 7, headTop - 9, FW - 14, 9); // tall crown
        ctx.fillRect(ox + 8, headTop - 11, FW - 16, 3); // tip
        ctx.fillStyle = "#ffcc00";
        // Star on hat
        ctx.fillRect(ox + FW / 2 - 1, headTop - 8, 2, 1);
        ctx.fillRect(ox + FW / 2 - 2, headTop - 7, 4, 1);
        ctx.fillRect(ox + FW / 2 - 1, headTop - 6, 2, 1);
        // Glowing aura
        ctx.fillStyle = "rgba(170, 100, 255, 0.4)";
        ctx.fillRect(ox + 2, headTop - 2, FW - 4, 12);
        break;
      }
      case "robot": {
        // Robot helmet
        ctx.fillStyle = "#337799";
        ctx.fillRect(ox + 4, headTop - 1, FW - 8, 11); // helmet
        ctx.fillStyle = "#55aacc";
        ctx.fillRect(ox + 5, headTop, FW - 10, 3); // face plate lighter
        // LED eyes (replace drawn eyes)
        ctx.fillStyle = char.eyeColor;
        ctx.fillRect(ox + 6, headTop + 2, 4, 3);
        ctx.fillRect(ox + FW - 10, headTop + 2, 4, 3);
        ctx.fillStyle = "rgba(255,100,0,0.8)";
        ctx.fillRect(ox + 7, headTop + 3, 2, 1);
        ctx.fillRect(ox + FW - 9, headTop + 3, 2, 1);
        // Antenna
        ctx.fillStyle = "#88ccff";
        ctx.fillRect(ox + FW / 2 - 1, headTop - 4, 2, 5);
        ctx.fillStyle = "#ff4400";
        ctx.fillRect(ox + FW / 2 - 2, headTop - 6, 4, 3);
        break;
      }
    }
  }

  // ─── Enemy Sprites ──────────────────────────────────────────────────────────

  private generateEnemyTexture(): void {
    // 4-frame Goomba-style enemy: 16×18 px per frame
    const EW = 16,
      EH = 18;
    const EFRAMES = 4;

    const canvas = document.createElement("canvas");
    canvas.width = EW * EFRAMES;
    canvas.height = EH;
    const ctx = canvas.getContext("2d")!;

    // Walk cycle offsets: [bodyBob, leftLegY, rightLegY]
    const walkPhases = [
      [0, 0, 3], // left foot down
      [1, 1, 2], // shifting
      [0, 3, 0], // right foot down
      [-1, 2, 1], // shifting back
    ];

    for (let f = 0; f < EFRAMES; f++) {
      const ox = f * EW;
      const [bob, lly, rly] = walkPhases[f];

      // Body (rounded red square)
      ctx.fillStyle = "#cc2222";
      ctx.fillRect(ox + 2, 1 + bob, EW - 4, EH - 6 - bob);

      // Body shading
      ctx.fillStyle = "#aa1111";
      ctx.fillRect(ox + 2, EH - 6, EW - 4, 2);
      ctx.fillStyle = "#ee4444";
      ctx.fillRect(ox + 3, 1 + bob, EW - 6, 3);

      // Head
      ctx.fillStyle = "#ee3333";
      ctx.fillRect(ox + 1, -1 + bob, EW - 2, 6);

      // Eyes: angry red slant
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ox + 3, bob, 4, 2);
      ctx.fillRect(ox + EW - 7, bob, 4, 2);
      // Angry eyebrow slant (inner side higher)
      ctx.fillStyle = "#220000";
      ctx.fillRect(ox + 4, bob, 2, 1);
      ctx.fillRect(ox + EW - 7, bob, 2, 1);
      ctx.fillStyle = "#ff2200";
      ctx.fillRect(ox + 4, bob + 1, 2, 1);
      ctx.fillRect(ox + EW - 6, bob + 1, 2, 1);

      // Horns
      ctx.fillStyle = "#ff8800";
      ctx.fillRect(ox + 2, -3 + bob, 3, 4);
      ctx.fillRect(ox + EW - 5, -3 + bob, 3, 4);
      ctx.fillStyle = "#ffcc00";
      ctx.fillRect(ox + 3, -3 + bob, 1, 2);
      ctx.fillRect(ox + EW - 4, -3 + bob, 1, 2);

      // Teeth (two fangs)
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ox + 5, 3 + bob, 2, 2);
      ctx.fillRect(ox + EW - 7, 3 + bob, 2, 2);

      // Legs
      ctx.fillStyle = "#881111";
      ctx.fillRect(ox + 3, EH - 5 + lly, 4, 5 - lly);
      ctx.fillRect(ox + EW - 7, EH - 5 + rly, 4, 5 - rly);
      ctx.fillStyle = "#660000";
      ctx.fillRect(ox + 3, EH - 3, 4, 3);
      ctx.fillRect(ox + EW - 7, EH - 3, 4, 3);
    }

    if (!this.textures.exists("enemy")) {
      this.textures.addSpriteSheet(
        "enemy",
        canvas as unknown as HTMLImageElement,
        { frameWidth: EW, frameHeight: EH },
      );
    }
  }

  // ─── Environment ─────────────────────────────────────────────────────────────

  private generateEnvironmentTextures(): void {
    const T = 16;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Ground tile — grass top + dirt body with detail
    g.fillStyle(0x5a8c32); // dark grass top
    g.fillRect(0, 0, T, 4);
    g.fillStyle(0x7bcf45); // bright grass
    g.fillRect(1, 0, T - 2, 3);
    g.fillStyle(0x4aaa20); // grass tufts
    g.fillRect(2, 0, 2, 4);
    g.fillRect(7, 0, 2, 5);
    g.fillRect(12, 0, 2, 4);
    g.fillStyle(0x8b6332); // dirt body
    g.fillRect(0, 4, T, T - 4);
    g.fillStyle(0x7a5028); // dirt dark
    g.fillRect(0, T - 2, T, 2);
    g.fillStyle(0x9a7244); // dirt highlight stripe
    g.fillRect(0, 5, T, 2);
    g.generateTexture("tile_ground", T, T);
    g.clear();

    // Platform tile — wood plank with grain detail
    g.fillStyle(0x9b7230); // base wood
    g.fillRect(0, 0, T, T);
    g.fillStyle(0xb5893c); // light grain
    g.fillRect(0, 2, T, 2);
    g.fillRect(0, 8, T, 2);
    g.fillStyle(0x7a5518); // dark grain
    g.fillRect(0, 5, T, 1);
    g.fillRect(0, 11, T, 1);
    g.fillStyle(0x7a5518); // plank joints
    g.fillRect(0, 0, 1, T);
    g.fillRect(T - 1, 0, 1, T);
    g.fillStyle(0xc8a056); // top highlight
    g.fillRect(1, 0, T - 2, 1);
    g.generateTexture("tile_platform", T, T);
    g.clear();

    // Moving platform — warm wood/bronze so it matches non-blue tiles (48x12 px)
    const MPW = 48,
      MPH = 12;
    g.fillStyle(0xa66a2a);
    g.fillRect(0, 0, MPW, MPH);
    g.fillStyle(0x7d4f1f); // darker base
    g.fillRect(0, MPH - 3, MPW, 3);
    g.fillStyle(0xcd944f); // highlight top
    g.fillRect(1, 0, MPW - 2, 2);
    g.fillStyle(0x6b4115); // plank ribs
    g.fillRect(8, 3, 3, MPH - 5);
    g.fillRect(20, 3, 3, MPH - 5);
    g.fillRect(32, 3, 3, MPH - 5);
    if (this.textures.exists("platform-moving")) {
      this.textures.remove("platform-moving");
    }
    g.generateTexture("platform-moving", MPW, MPH);
    g.clear();

    // Bounce platform — spring green with upward chevron motif (48×12 px)
    g.fillStyle(0x22dd66);
    g.fillRect(0, 0, MPW, MPH);
    g.fillStyle(0x11bb44);
    g.fillRect(0, MPH - 3, MPW, 3);
    g.fillStyle(0x55ff88);
    g.fillRect(1, 0, MPW - 2, 2);
    // Upward chevron arrows
    g.fillStyle(0xffffff);
    for (let ax = 8; ax < MPW - 4; ax += 16) {
      g.fillRect(ax, 5, 2, 4); // left leg
      g.fillRect(ax + 4, 5, 2, 4); // right leg
      g.fillRect(ax + 1, 3, 1, 3); // left up
      g.fillRect(ax + 3, 3, 1, 3); // right up
      g.fillRect(ax + 2, 2, 1, 2); // tip
    }
    if (this.textures.exists("platform-bounce")) {
      this.textures.remove("platform-bounce");
    }
    g.generateTexture("platform-bounce", MPW, MPH);

    g.destroy();
  }

  // ─── Hazards ──────────────────────────────────────────────────────────────────

  private generateHazardTextures(): void {
    const T = 16;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Spike — sharp metallic triangle
    g.fillStyle(0x9999aa);
    g.fillTriangle(0, T, T / 2, 0, T, T);
    g.fillStyle(0xccccdd);
    g.fillTriangle(2, T, T / 2, 2, T - 2, T);
    g.fillStyle(0x555566);
    g.fillTriangle(0, T, T / 2, 1, 4, T);
    g.generateTexture("spike", T, T);
    g.clear();

    // Generate enemy separately (needs canvas for detail)
    this.generateEnemyTexture();

    // Flag — striped pennant on pole
    g.clear();
    g.fillStyle(0x777788);
    g.fillRect(6, 0, 3, 32); // pole
    g.fillStyle(0xaaaaaa);
    g.fillRect(7, 0, 1, 32); // pole highlight
    g.fillStyle(0xff3322);
    g.fillTriangle(9, 2, 9, 18, 26, 10); // red pennant
    g.fillStyle(0xffffff);
    g.fillTriangle(9, 5, 9, 11, 20, 8); // white stripe
    g.fillStyle(0xff3322);
    g.fillTriangle(9, 7, 9, 10, 17, 8); // inner red
    g.generateTexture("flag", 28, 32);

    // Particle (tiny white square)
    g.clear();
    g.fillStyle(0xffffff);
    g.fillRect(0, 0, 4, 4);
    g.generateTexture("particle", 4, 4);

    g.destroy();
  }

  // ─── Parallax ────────────────────────────────────────────────────────────────

  private generateParallaxTextures(): void {
    const W = 480;
    const H = 270;
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    this.generateParallaxSet(g, W, H, "l1", {
      mountains: 0x4b7db3,
      mountainHighlight: 0xd9f0ff,
      hills: 0x5aa054,
      trees: 0x2e6a2a,
      clouds: 0xffffff,
    });

    this.generateParallaxSet(g, W, H, "l2", {
      mountains: 0x9a7a62,
      mountainHighlight: 0xd8b08a,
      hills: 0x8b6c4f,
      trees: 0x77583e,
      clouds: 0xf5e7d7,
    });

    this.generateParallaxSet(g, W, H, "l3", {
      mountains: 0x2e315e,
      mountainHighlight: 0x98a2ff,
      hills: 0x3d4f78,
      trees: 0x2b3d66,
      clouds: 0xdadfff,
    });

    g.destroy();
  }

  private generateParallaxSet(
    g: Phaser.GameObjects.Graphics,
    W: number,
    H: number,
    suffix: string,
    palette: {
      mountains: number;
      mountainHighlight: number;
      hills: number;
      trees: number;
      clouds: number;
    },
  ): void {
    // Mountains with snow caps
    g.clear();
    g.fillStyle(palette.mountains, 0.72);
    for (let i = 0; i < 6; i++) {
      const mx = 50 + i * 85;
      g.fillTriangle(mx, H * 0.72, mx - 65, H, mx + 65, H);
    }
    g.fillStyle(palette.mountainHighlight, 0.6);
    for (let i = 0; i < 6; i++) {
      const mx = 50 + i * 85;
      g.fillTriangle(mx, H * 0.72, mx - 14, H * 0.75, mx + 14, H * 0.75);
    }
    g.generateTexture(`bg_mountains_${suffix}`, W, H);

    // Rolling hills
    g.clear();
    g.fillStyle(palette.hills, 0.6);
    for (let i = 0; i < 5; i++) {
      const hx = 30 + i * 105;
      g.fillEllipse(hx, H * 0.92, 150, 52);
    }
    g.generateTexture(`bg_hills_${suffix}`, W, H);

    // Pine trees with trunk
    g.clear();
    g.fillStyle(palette.trees, 0.68);
    for (let i = 0; i < 10; i++) {
      const tx = 10 + i * 50;
      const ty = H * 0.84;
      // Trunk
      g.fillRect(tx + 9, ty, 4, 16);
      // Tree layers (3 triangles, narrowing upward)
      g.fillTriangle(tx - 1, ty + 12, tx + 11, ty - 1, tx + 23, ty + 12);
      g.fillTriangle(tx + 1, ty + 6, tx + 11, ty - 9, tx + 21, ty + 6);
      g.fillTriangle(tx + 3, ty + 1, tx + 11, ty - 15, tx + 19, ty + 1);
    }
    g.generateTexture(`bg_trees_${suffix}`, W, H);

    // Fluffy clouds
    g.clear();
    g.fillStyle(palette.clouds, 0.88);
    for (let i = 0; i < 4; i++) {
      const cx = 60 + i * 130;
      const cy = 35 + (i % 2) * 18;
      g.fillEllipse(cx, cy + 6, 70, 30);
      g.fillEllipse(cx - 22, cy + 12, 42, 24);
      g.fillEllipse(cx + 24, cy + 12, 38, 22);
      g.fillEllipse(cx - 8, cy, 44, 28);
      g.fillEllipse(cx + 12, cy - 2, 38, 26);
    }
    g.generateTexture(`bg_clouds_${suffix}`, W, H);
  }

  // ─── UI Textures ─────────────────────────────────────────────────────────────

  private generateUITextures(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);

    // Coin icon — shiny gold disc
    g.fillStyle(0xffcc00);
    g.fillCircle(6, 6, 5);
    g.fillStyle(0xffaa00);
    g.fillCircle(6, 6, 3);
    g.fillStyle(0xffe66a, 0.8);
    g.fillCircle(4, 4, 2);
    g.fillStyle(0xffee99, 0.6);
    g.fillCircle(3, 3, 1);
    g.generateTexture("icon_coin", 12, 12);
    g.clear();

    // Heart icon — filled red heart
    g.fillStyle(0xff2244);
    g.fillCircle(4, 4, 3);
    g.fillCircle(8, 4, 3);
    g.fillTriangle(1, 5, 11, 5, 6, 12);
    g.fillStyle(0xff8899, 0.6);
    g.fillCircle(3, 3, 1);
    g.generateTexture("icon_heart", 12, 12);

    g.destroy();
  }

  // ─── Animations ──────────────────────────────────────────────────────────────

  private registerAnimations(): void {
    const anims = this.anims;

    const defs = [
      {
        key: "idle",
        sheet: "idle",
        start: 0,
        end: 3,
        frameRate: 8,
        repeat: -1,
      },
      { key: "run", sheet: "run", start: 0, end: 5, frameRate: 14, repeat: -1 },
      {
        key: "jump",
        sheet: "jump",
        start: 0,
        end: 3,
        frameRate: 12,
        repeat: 0,
      },
      {
        key: "fall",
        sheet: "jump",
        start: 4,
        end: 6,
        frameRate: 10,
        repeat: -1,
      },
      {
        key: "land",
        sheet: "jump",
        start: 7,
        end: 7,
        frameRate: 12,
        repeat: 0,
      },
      {
        key: "hurt",
        sheet: "hurt",
        start: 0,
        end: 3,
        frameRate: 10,
        repeat: 0,
      },
      {
        key: "death",
        sheet: "death",
        start: 0,
        end: 7,
        frameRate: 8,
        repeat: 0,
      },
      {
        key: "dead",
        sheet: "death",
        start: 0,
        end: 7,
        frameRate: 8,
        repeat: 0,
      },
    ] as const;

    const createFromSheet = (
      animKey: string,
      sheetKey: string,
      start: number,
      end: number,
      frameRate: number,
      repeat: number,
    ): boolean => {
      if (anims.exists(animKey) || !this.textures.exists(sheetKey))
        return false;
      const maxFrame = Math.max(0, this.textures.get(sheetKey).frameTotal - 1);
      const safeStart = Math.min(start, maxFrame);
      const safeEnd = Math.min(Math.max(end, safeStart), maxFrame);
      anims.create({
        key: animKey,
        frames: anims.generateFrameNumbers(sheetKey, {
          start: safeStart,
          end: safeEnd,
        }),
        frameRate,
        repeat,
      });
      return true;
    };

    // Generic unqualified keys (used by some UI/demo code).
    for (const def of defs) {
      createFromSheet(
        def.key,
        `explorer-${def.sheet}-sheet`,
        def.start,
        def.end,
        def.frameRate,
        def.repeat,
      );
    }

    for (const char of CharacterRegistry.CHARACTERS) {
      for (const def of defs) {
        const qualifiedKey = `${char.key}-${def.key}`;
        const sheetKey = `${char.key}-${def.sheet}-sheet`;

        if (
          !createFromSheet(
            qualifiedKey,
            sheetKey,
            def.start,
            def.end,
            def.frameRate,
            def.repeat,
          ) &&
          this.textures.exists(char.key) &&
          !anims.exists(qualifiedKey)
        ) {
          // Emergency fallback if a sheet is missing: use first frame of the base texture.
          anims.create({
            key: qualifiedKey,
            frames: [{ key: char.key, frame: 0 }],
            frameRate: def.frameRate,
            repeat: def.repeat,
          });
        }
      }
    }

    // Enemy walk — 4-frame cycle
    if (!anims.exists("enemy-walk")) {
      anims.create({
        key: "enemy-walk",
        frames: anims.generateFrameNumbers("enemy", { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }

  // ─── Colour helpers ──────────────────────────────────────────────────────────

  private lighten(hex: string, amount: number): string {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    return Phaser.Display.Color.RGBToString(
      Math.min(255, c.red + amount),
      Math.min(255, c.green + amount),
      Math.min(255, c.blue + amount),
    );
  }

  private darken(hex: string, amount: number): string {
    const c = Phaser.Display.Color.HexStringToColor(hex);
    return Phaser.Display.Color.RGBToString(
      Math.max(0, c.red - amount),
      Math.max(0, c.green - amount),
      Math.max(0, c.blue - amount),
    );
  }
}
