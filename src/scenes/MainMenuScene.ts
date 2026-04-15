import Phaser from "phaser";
import { SCENE, GAME_WIDTH, GAME_HEIGHT } from "../config";
import {
  PlayerState,
  CharacterRegistry,
  CharacterDef,
} from "../data/PlayerState";
import { getMaxLevel } from "../data/LevelConfig";

const MENU_COLORS = {
  skyTop: 0x0b1324,
  skyMid: 0x16233b,
  skyLow: 0x1f2f45,
  panelBg: 0x0b1220,
  panelStroke: 0x3b526d,
  divider: 0x31455f,
  titleShadow: "#111827",
  titleMain: "#d0b36a",
  titleStroke: "#6e5a2d",
  subtitle: "#9ca9bf",
  coin: "#c6a85d",
  cardIdle: 0x1b2940,
  cardHover: 0x273a58,
  cardActive: 0x384d67,
  cardStroke: 0x4e6786,
  cardText: "#d7deea",
  cardSub: "#95a7bf",
  prompt: "#c7bc98",
  hint: "#7f8fa8",
};

/**
 * MainMenuScene — Fully animated gaming-feel title screen.
 *
 * Visual features:
 *  • Scrolling parallax background (mountains → hills → trees)
 *  • Animated character sprite running in the scene
 *  • Pixel-art title with drop shadow + color cycle tween
 *  • Glowing level/character card tabs
 *  • Starfield sparkle overlay
 *  • Retro-style scanline CRT effect
 *  • Bouncing "PRESS ENTER" prompt
 */
export class MainMenuScene extends Phaser.Scene {
  private totalCoinsText!: Phaser.GameObjects.Text;
  private promptText!: Phaser.GameObjects.Text;
  private bgLayers: Phaser.GameObjects.Image[] = [];
  private menuCards: Phaser.GameObjects.Container[] = [];
  private levelCards: Phaser.GameObjects.Container[] = [];
  private charCards: Phaser.GameObjects.Container[] = [];
  private levelPanel!: Phaser.GameObjects.Container;
  private charPanel!: Phaser.GameObjects.Container;
  private activePanel: "levels" | "characters" = "levels";
  private selectedCharIdx = 0;
  private selectedLevel = 1;
  private readonly menuLevelSlots = 5;
  private demoChar!: Phaser.GameObjects.Sprite;
  private demoCharDir = 1;

  constructor() {
    super({ key: SCENE.MAIN_MENU });
  }

  create(): void {
    this.cameras.main.setBackgroundColor(MENU_COLORS.skyTop);
    this.cameras.main.setAlpha(1);
    this.cameras.main.clearFX();

    // Reset transient references because scene instances are reused.
    this.bgLayers = [];
    this.menuCards = [];
    this.levelCards = [];
    this.charCards = [];
    this.activePanel = "levels";
    this.demoCharDir = 1;

    this.cameras.main.setBackgroundColor(MENU_COLORS.skyTop);

    this.selectedCharIdx = this.getSelectedCharIndex();
    this.selectedLevel = Math.max(
      1,
      Math.min(PlayerState.instance.currentLevel, getMaxLevel()),
    );

    this.buildBackground();
    this.buildTitle();
    this.totalCoinsText = this.add
      .text(
        GAME_WIDTH / 2,
        70,
        `TOTAL COINS: ${PlayerState.instance.totalCoins}`,
        {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "10px",
          color: MENU_COLORS.coin,
          letterSpacing: 1,
        },
      )
      .setOrigin(0.5)
      .setDepth(5);
    this.buildDemoCharacter();
    this.buildHubCards();
    this.buildPanels();
    //this.openPanel("levels");
    this.buildPrompt();
    this.setupInput();

    // Fade in after everything is built
    this.time.delayedCall(10, () => {
      this.cameras.main.fadeIn(300, 0, 0, 0);
    });
    this.time.delayedCall(0, () => {
      this.openPanel("levels");
    });
  }

  wake(): void {
    // When scene wakes up (e.g., from sleep), reinitialize
    this.cameras.main.setBackgroundColor(MENU_COLORS.skyTop);
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  update(_time: number, delta: number): void {
    // Parallax scroll
    this.bgLayers.forEach((layer, i) => {
      layer.x -= (0.05 + i * 0.04) * (delta / 16);
      if (layer.x <= -GAME_WIDTH) layer.x = 0;
    });

    // Demo character auto-walk
    if (this.demoChar && this.demoChar.active) {
      this.demoChar.x += this.demoCharDir * 0.6 * (delta / 16);
      this.demoChar.x = Math.round(this.demoChar.x);
      if (this.demoChar.x > 90) {
        this.demoChar.x = 90;
        this.demoCharDir = -1;
        this.demoChar.setFlipX(true);
      }
      if (this.demoChar.x < 30) {
        this.demoChar.x = 30;
        this.demoCharDir = 1;
        this.demoChar.setFlipX(false);
      }
    }
  }

  // ─── Background ─────────────────────────────────────────────────────────────

  private buildBackground(): void {
    // Sky gradient bands — deep blue sky from top to horizon
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.18,
      GAME_WIDTH,
      GAME_HEIGHT * 0.36,
      MENU_COLORS.skyTop,
      1,
    );
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.55,
      GAME_WIDTH,
      GAME_HEIGHT * 0.38,
      MENU_COLORS.skyMid,
      1,
    );
    this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT * 0.87,
      GAME_WIDTH,
      GAME_HEIGHT * 0.26,
      MENU_COLORS.skyLow,
      1,
    );

    // Scrolling parallax (background images duplicated for seamless loop)
    ["bg_mountains_l1", "bg_hills_l1", "bg_trees_l1"].forEach((key, i) => {
      if (!this.textures.exists(key)) {
        return; // prevents crash
      }

      const alpha = 0.42 + i * 0.2;
      const scaleY = 0.78;
      const layer = this.add
        .image(0, 70, key)
        .setOrigin(0, 0)
        .setAlpha(alpha)
        .setScale(1, scaleY)
        .setDepth(1);
      this.add
        .image(GAME_WIDTH, 70, key)
        .setOrigin(0, 0)
        .setAlpha(alpha)
        .setScale(1, scaleY)
        .setDepth(1);
      this.bgLayers.push(layer);
    });

    // Twinkling stars
    for (let i = 0; i < 40; i++) {
      const star = this.add
        .circle(
          Phaser.Math.Between(4, GAME_WIDTH - 4),
          Phaser.Math.Between(4, 80),
          Phaser.Math.Between(1, 2),
          0xffffff,
          0.55,
        )
        .setDepth(2);
      this.tweens.add({
        targets: star,
        alpha: { from: 0.1, to: 0.9 },
        duration: 500 + Phaser.Math.Between(0, 1500),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 800),
      });
    }

    // Moon / decorative glowing orb top-right
    const moon = this.add.circle(400, 25, 14, 0xfffacc, 0.9).setDepth(2);
    this.add.circle(400, 25, 18, 0xfffacc, 0.15).setDepth(2);
    this.add.circle(400, 25, 24, 0xfffacc, 0.07).setDepth(2);
    this.tweens.add({
      targets: moon,
      alpha: { from: 0.8, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
    });

    // Ground strip at bottom of parallax area
    this.add
      .rectangle(GAME_WIDTH / 2, 235, GAME_WIDTH, 12, 0x2a3f38, 1)
      .setDepth(2);
    this.add
      .rectangle(GAME_WIDTH / 2, 240, GAME_WIDTH, 4, 0x51675a, 1)
      .setDepth(2);

    // Panel backdrop
    this.add
      .rectangle(GAME_WIDTH / 2, 186, 420, 124, MENU_COLORS.panelBg, 0.9)
      .setStrokeStyle(1, MENU_COLORS.panelStroke, 0.85)
      .setDepth(3);

    this.add
      .rectangle(GAME_WIDTH / 2, 125, 420, 2, MENU_COLORS.divider, 0.75)
      .setDepth(3);
  }

  // ─── Demo Character ─────────────────────────────────────────────────────────

  private buildDemoCharacter(): void {
    const charKey = PlayerState.instance.selectedCharacter ?? "explorer";
    this.demoChar = this.add
      .sprite(52, 220, charKey, 1)
      .setScale(2)
      .setDepth(9);
    this.demoChar.play(`${charKey}-run`);

    // Add subtle shadow below character
    this.add.ellipse(52, 230, 26, 6, 0x000000, 0.32).setDepth(8);
  }

  // ─── Title ──────────────────────────────────────────────────────────────────

  private buildTitle(): void {
    // Glow aura behind title
    const glow = this.add
      .rectangle(GAME_WIDTH / 2, 40, 290, 34, 0x8f7a4c, 0.08)
      .setDepth(2);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.05, to: 0.2 },
      scaleX: { from: 0.95, to: 1.05 },
      duration: 1200,
      yoyo: true,
      repeat: -1,
    });

    // Drop shadow
    this.add
      .text(GAME_WIDTH / 2 + 2, 45, "BLOCK  LAND", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "28px",
        color: MENU_COLORS.titleShadow,
        letterSpacing: 7,
      })
      .setOrigin(0.5)
      .setDepth(3);

    // Main title text
    const title = this.add
      .text(GAME_WIDTH / 2, 42, "BLOCK  LAND", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "28px",
        color: MENU_COLORS.titleMain,
        stroke: MENU_COLORS.titleStroke,
        strokeThickness: 3,
        letterSpacing: 7,
      })
      .setOrigin(0.5)
      .setDepth(4);

    // Keep title alive, but avoid large motion that can feel noisy.
    this.tweens.add({
      targets: title,
      y: { from: 41, to: 43 },
      duration: 1500,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    // Subtitle
    this.add
      .text(GAME_WIDTH / 2, 59, "✦  A PIXEL PLATFORMER  ✦", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "9px",
        fontStyle: "bold",
        color: MENU_COLORS.subtitle,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(4);

    // Decorative pixel pixel-star sparks around title
    const sparkPositions = [
      [GAME_WIDTH / 2 - 130, 44],
      [GAME_WIDTH / 2 + 130, 44],
      [GAME_WIDTH / 2 - 90, 32],
      [GAME_WIDTH / 2 + 90, 32],
    ];
    for (const [sx, sy] of sparkPositions) {
      const spark = this.add
        .text(sx, sy, "★", {
          fontFamily: '"Courier New"',
          fontSize: "8px",
          color: MENU_COLORS.titleMain,
        })
        .setOrigin(0.5)
        .setDepth(4);
      this.tweens.add({
        targets: spark,
        alpha: { from: 0.0, to: 1.0 },
        scale: { from: 0.4, to: 1.0 },
        duration: 600 + Phaser.Math.Between(0, 400),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 600),
      });
    }
  }

  // ─── Hub Cards ──────────────────────────────────────────────────────────────

  private buildHubCards(): void {
    const specs: Array<{
      title: string;
      sub: string;
      key: "levels" | "characters";
      x: number;
    }> = [
      {
        title: "▶  PLAY",
        sub: "CHOOSE LEVEL",
        key: "levels",
        x: GAME_WIDTH / 2 - 72,
      },
      {
        title: "★  HEROES",
        sub: "UNLOCK CHARS",
        key: "characters",
        x: GAME_WIDTH / 2 + 72,
      },
    ];

    for (const spec of specs) {
      const container = this.add.container(spec.x, 114).setDepth(5);
      const card = this.add
        .rectangle(0, 0, 124, 34, MENU_COLORS.cardIdle, 1)
        .setOrigin(0.5);
      card.setStrokeStyle(2, MENU_COLORS.cardStroke, 0.9);

      const title = this.add
        .text(0, -6, spec.title, {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "9px",
          color: MENU_COLORS.cardText,
          letterSpacing: 2,
        })
        .setOrigin(0.5);

      const sub = this.add
        .text(0, 8, spec.sub, {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          fontStyle: "bold",
          color: MENU_COLORS.cardSub,
          letterSpacing: 0,
        })
        .setOrigin(0.5);

      container.add([card, title, sub]);
      this.menuCards.push(container);

      card.setInteractive({ useHandCursor: true });
      card.on("pointerdown", () => {
        if (spec.key === "levels") {
          this.startGame(this.getHighestUnlockedLevel());
          return;
        }
        this.openPanel(spec.key);
      });
      card.on("pointerover", () => {
        if (this.activePanel !== spec.key) {
          card.setFillStyle(MENU_COLORS.cardHover, 1);
          this.tweens.add({
            targets: container,
            scaleY: 1.05,
            duration: 80,
            ease: "Back.Out",
          });
        }
      });
      card.on("pointerout", () => {
        if (this.activePanel !== spec.key) {
          card.setFillStyle(MENU_COLORS.cardIdle, 1);
          this.tweens.add({ targets: container, scaleY: 1.0, duration: 80 });
        }
      });
    }

    this.refreshHubSelection();
  }

  // ─── Panels ─────────────────────────────────────────────────────────────────

  private buildPanels(): void {
    this.levelPanel = this.add.container(0, 0).setDepth(5);
    this.charPanel = this.add.container(0, 0).setDepth(5);
    this.buildLevelSelect(this.levelPanel);
    this.buildCharacterSelect(this.charPanel);
  }

  private buildLevelSelect(host: Phaser.GameObjects.Container): void {
    const y = 206;
    const unlockedUpTo = PlayerState.instance.currentLevel;
    const maxPlayable = getMaxLevel();

    host.add(
      this.add
        .text(GAME_WIDTH / 2, y - 28, "— SELECT LEVEL —", {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "10px",
          fontStyle: "bold",
          color: "#ceb678",
          letterSpacing: 1,
        })
        .setOrigin(0.5),
    );

    const startX = GAME_WIDTH / 2 - ((this.menuLevelSlots - 1) * 46) / 2;

    for (let i = 1; i <= this.menuLevelSlots; i++) {
      const cx = startX + (i - 1) * 46;
      const playable = i <= unlockedUpTo && i <= maxPlayable;
      const completed = i < unlockedUpTo && i <= maxPlayable;

      const container = this.add.container(cx, y);
      const card = this.add
        .rectangle(0, 0, 40, 28, 0x101b2d, 0.95)
        .setOrigin(0.5);

      const label = this.add
        .text(0, -7, `L${i}`, {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "9px",
          color: playable ? "#d9dfeb" : "#64748b",
        })
        .setOrigin(0.5);

      const status = this.add
        .text(0, 7, completed ? "DONE" : playable ? "PLAY" : "LOCK", {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          fontStyle: "bold",
          color: completed ? "#7fb08d" : playable ? "#ccb57a" : "#4f6078",
        })
        .setOrigin(0.5);

      container.add([card, label, status]);

      if (playable) {
        card.setInteractive({ useHandCursor: true });
        card.on("pointerdown", () => {
          this.selectedLevel = i;
          this.refreshLevelSelection();
          this.startGame(i);
        });
        card.on("pointerover", () => {
          if (i !== this.selectedLevel) {
            card.setFillStyle(0x283953, 0.95);
            this.tweens.add({
              targets: container,
              scaleY: 1.1,
              duration: 80,
              ease: "Back.Out",
            });
          }
        });
        card.on("pointerout", () => {
          if (i !== this.selectedLevel) {
            card.setFillStyle(0x101b2d, 0.95);
            this.tweens.add({ targets: container, scaleY: 1.0, duration: 80 });
          }
        });
      } else {
        card.setFillStyle(0x090f18, 0.95);
      }

      this.levelCards.push(container);
      host.add(container);
    }

    this.refreshLevelSelection();
  }

  private buildCharacterSelect(host: Phaser.GameObjects.Container): void {
    const state = PlayerState.instance;
    const chars = CharacterRegistry.CHARACTERS;
    const startX = GAME_WIDTH / 2 - 128;
    const y = 186;

    const heroesTitle = this.add
      .text(GAME_WIDTH / 2, y - 40, "— HEROES —", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "11px",
        fontStyle: "bold",
        color: "#e2c987",
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(8);

    host.add([heroesTitle]);

    chars.forEach((char, i) => {
      const cx = startX + i * 88;
      const unlocked = state.unlockedCharacters.includes(char.key);
      const card = this.buildCharCard(cx, y, char, i, unlocked);
      this.charCards.push(card);
      host.add(card);
    });

    // Keep heading above character cards.
    host.bringToTop(heroesTitle);

    this.refreshCharacterSelection();
  }

  private buildCharCard(
    cx: number,
    cy: number,
    char: CharacterDef,
    idx: number,
    unlocked: boolean,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy);

    const bg = this.add.rectangle(0, 0, 78, 58, 0x0e1a2e, 1).setOrigin(0.5);
    bg.setStrokeStyle(1, 0x435977, 0.7);
    container.add(bg);

    if (unlocked) {
      const preview = this.add
        .sprite(0, -10, char.key, 0)
        .setScale(1.75)
        .setOrigin(0.5);
      // Idle bob tween for character preview
      this.tweens.add({
        targets: preview,
        y: -12,
        duration: 600 + idx * 80,
        ease: "Sine.InOut",
        yoyo: true,
        repeat: -1,
      });

      const label = this.add
        .text(0, 18, char.label.toUpperCase(), {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          color: "#d3dbe7",
          letterSpacing: 1,
        })
        .setOrigin(0.5);

      const mark = this.add
        .text(0, 27, "✔ OWNED", {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          fontStyle: "bold",
          color: "#7fb08d",
        })
        .setOrigin(0.5);

      bg.setInteractive({ useHandCursor: true });
      bg.on("pointerdown", () => this.selectCharacter(idx));
      bg.on("pointerover", () => {
        if (this.selectedCharIdx !== idx) {
          bg.setFillStyle(0x20324d, 1);
          this.tweens.add({
            targets: container,
            scaleY: 1.05,
            duration: 80,
            ease: "Back.Out",
          });
        }
      });
      bg.on("pointerout", () => {
        if (this.selectedCharIdx !== idx) {
          bg.setFillStyle(0x0e1a2e, 1);
          this.tweens.add({ targets: container, scaleY: 1.0, duration: 80 });
        }
      });

      container.add([preview, label, mark]);
      return container;
    }

    // Locked character
    const affordable =
      PlayerState.instance.availableCoins >= char.milestoneCoins;

    const lockIcon = this.add
      .text(0, -8, "🔒", {
        fontSize: "16px",
      })
      .setOrigin(0.5);

    const req = this.add
      .text(0, 14, `${char.milestoneCoins}`, {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "8px",
        fontStyle: "bold",
        color: MENU_COLORS.coin,
        letterSpacing: 1,
      })
      .setOrigin(0.5);

    const coinTxt = this.add
      .text(0, 22, affordable ? "CLICK TO UNLOCK" : "MORE COINS NEEDED", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "7px",
        fontStyle: "bold",
        color: affordable ? "#a7d6b1" : "#a7b7d0",
      })
      .setOrigin(0.5);

    bg.setFillStyle(0x040a1a, 1);
    bg.setInteractive({ useHandCursor: true });
    bg.on("pointerdown", () => {
      if (PlayerState.instance.unlockCharacter(char.key)) {
        this.selectedCharIdx = idx;
        PlayerState.instance.selectedCharacter = char.key;
        PlayerState.instance.save();
        this.totalCoinsText?.setText(
          `TOTAL COINS: ${PlayerState.instance.totalCoins}`,
        );
        this.rebuildCharacterPanel();
        this.selectCharacter(idx);
        this.openPanel("characters");
        return;
      }

      this.tweens.add({
        targets: container,
        x: { from: cx - 2, to: cx + 2 },
        duration: 45,
        yoyo: true,
        repeat: 2,
      });
    });
    container.add([lockIcon, req, coinTxt]);
    return container;
  }

  private rebuildCharacterPanel(): void {
    if (!this.charPanel) return;
    this.charPanel.removeAll(true);
    this.charCards = [];
    this.buildCharacterSelect(this.charPanel);
  }

  // ─── Prompt ─────────────────────────────────────────────────────────────────

  private buildPrompt(): void {
    this.promptText = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, "CLICK A LEVEL TO START", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "10px",
        fontStyle: "bold",
        color: "#efe3ba",
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(10);

    // Controls hint
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT - 18,
        "◀ ▶ MOVE   SPACE / ▲ JUMP   SHIFT RUN",
        {
          fontFamily: '"Courier New", Courier, monospace',
          fontSize: "8px",
          fontStyle: "bold",
          color: "#a3b2ca",
          letterSpacing: 1,
        },
      )
      .setOrigin(0.5)
      .setDepth(10);

    // Version tag
    this.add
      .text(GAME_WIDTH - 4, GAME_HEIGHT - 6, "v2.0", {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: "7px",
        color: "#4d5b70",
      })
      .setOrigin(1, 1)
      .setDepth(6);
  }

  // ─── Input ──────────────────────────────────────────────────────────────────

  private setupInput(): void {
    this.input.keyboard!.on("keydown-SPACE", () => this.startGame());
    this.input.keyboard!.on("keydown-ENTER", () => this.startGame());
  }

  private startGame(levelOverride?: number): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      const level = levelOverride ?? this.getHighestUnlockedLevel();
      this.scene.start(SCENE.GAME, { level });
      this.scene.launch(SCENE.HUD, { level });
    });
  }

  private getHighestUnlockedLevel(): number {
    return Math.max(
      1,
      Math.min(PlayerState.instance.currentLevel, getMaxLevel()),
    );
  }

  // ─── Refresh helpers ────────────────────────────────────────────────────────

  private refreshLevelSelection(): void {
    this.levelCards.forEach((container, idx) => {
      const levelId = idx + 1;
      const card = container.list[0] as Phaser.GameObjects.Rectangle;
      const label = container.list[1] as Phaser.GameObjects.Text;

      if (levelId === this.selectedLevel) {
        card.setStrokeStyle(2, 0xc7ab6a, 1);
        card.setFillStyle(0x30445d, 0.95);
        label.setColor("#ede0ba");
      } else if (card.input?.enabled) {
        card.setStrokeStyle(1, 0x4a5f7a, 0.7);
        card.setFillStyle(0x101b2d, 0.95);
        label.setColor("#d9dfeb");
      }
    });
  }

  private refreshCharacterSelection(): void {
    this.charCards.forEach((container, idx) => {
      const bg = container.list[0] as Phaser.GameObjects.Rectangle;
      if (!bg.input?.enabled) return;
      if (idx === this.selectedCharIdx) {
        bg.setStrokeStyle(2, 0xc7ab6a, 1);
        bg.setFillStyle(0x2f435d, 1);
      } else {
        bg.setStrokeStyle(1, 0x435977, 0.7);
        bg.setFillStyle(0x0e1a2e, 1);
      }
    });
  }

  private selectCharacter(idx: number): void {
    const char = CharacterRegistry.CHARACTERS[idx];
    if (!PlayerState.instance.unlockedCharacters.includes(char.key)) return;
    this.selectedCharIdx = idx;
    PlayerState.instance.selectedCharacter = char.key;
    PlayerState.instance.save();
    this.refreshCharacterSelection();

    // Swap demo character
    if (this.demoChar) {
      this.demoChar.setTexture(char.key, 1);
      this.demoChar.play(`${char.key}-run`);
    }
  }

  private openPanel(panel: "levels" | "characters"): void {
    if (!this.levelPanel || !this.charPanel) return;

    this.activePanel = panel;

    this.levelPanel.setVisible(panel === "levels");
    this.charPanel.setVisible(panel === "characters");

    if (this.promptText) {
      this.promptText.setText(
        panel === "levels"
          ? "CLICK A LEVEL CARD TO START"
          : "CLICK A LOCKED HERO TO UNLOCK",
      );
    }

    this.refreshHubSelection();
  }

  private refreshHubSelection(): void {
    this.menuCards.forEach((container, idx) => {
      const key = idx === 0 ? "levels" : "characters";
      const card = container.list[0] as
        | Phaser.GameObjects.Rectangle
        | undefined;
      const sub = container.list[2] as Phaser.GameObjects.Text | undefined;
      if (!card || !sub) return;

      if (key === this.activePanel) {
        card.setStrokeStyle(2, 0xc7ab6a, 1);
        card.setFillStyle(MENU_COLORS.cardActive, 1);
        sub.setColor("#d8c79a");
      } else {
        card.setStrokeStyle(2, MENU_COLORS.cardStroke, 0.7);
        card.setFillStyle(MENU_COLORS.cardIdle, 1);
        sub.setColor(MENU_COLORS.cardSub);
      }
    });
  }

  private getSelectedCharIndex(): number {
    const key = PlayerState.instance.selectedCharacter;
    const idx = CharacterRegistry.CHARACTERS.findIndex((c) => c.key === key);
    return idx >= 0 ? idx : 0;
  }
}
