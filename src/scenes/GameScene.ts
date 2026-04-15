import Phaser from "phaser";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Lava } from "../entities/Lava";
import { InputHandler } from "../systems/InputHandler";
import { CameraController } from "../systems/CameraController";
import { ParticleSystem } from "../systems/ParticleSystem";
import { PlatformSystem } from "../systems/PlatformSystem";
import { FeedbackSystem } from "../systems/FeedbackSystem";
import { AudioSystem } from "../systems/AudioSystem";
import { TilemapLoader } from "../level/TilemapLoader";
import { ObjectSpawner, SpawnResult } from "../level/ObjectSpawner";
import { getLevelConfig, getMaxLevel } from "../data/LevelConfig";
import { PlayerState } from "../data/PlayerState";
import { SCENE, GAME_HEIGHT, EV } from "../config";
import { JUMP_VELOCITY } from "../systems/JumpConfig";

/**
 * GameScene — Master gameplay scene (Phases 1–6).
 *
 * Responsibilities:
 *  Phase 1: Tilemap rendering, parallax background, camera
 *  Phase 2: Player physics, animations, character selection
 *  Phase 3: Level configs, platform layouts, ObjectSpawner
 *  Phase 4: Coin pickup, spike/lava hazards, enemy stomp
 *  Phase 5: Scene transitions (game over, level complete, char unlock)
 *  Phase 6: Particles (coin, landing, enemy death), cloud animation, fade
 */
export class GameScene extends Phaser.Scene {
  // ── Systems ────────────────────────────────────────────────────────────────
  private inputHandler!: InputHandler;
  private camController!: CameraController;
  private tilemapLoader!: TilemapLoader;
  private spawner!: ObjectSpawner;
  private platformSystem!: PlatformSystem; // Phase 4
  private feedback!: FeedbackSystem; // Phase 6
  private audio!: AudioSystem; // Phase 6

  private cameraOffsetX = 0; // Phase 6 lookahead

  // ── Entities ──────────────────────────────────────────────────────────────
  private player!: Player;
  private objects!: SpawnResult;
  private enemies: Enemy[] = [];
  private lavas: Lava[] = [];

  // ── Parallax layers ────────────────────────────────────────────────────────
  private bgMountains!: Phaser.GameObjects.TileSprite;
  private bgHills!: Phaser.GameObjects.TileSprite;
  private bgTrees!: Phaser.GameObjects.TileSprite;
  private bgClouds!: Phaser.GameObjects.TileSprite;
  private playerShadow!: Phaser.GameObjects.Ellipse;

  // ── State ─────────────────────────────────────────────────────────────────
  private levelNum = 1;
  private levelStart = 0;
  private transitioning = false;

  constructor() {
    super({ key: SCENE.GAME });
  }

  init(data: { level?: number }): void {
    this.levelNum = data?.level ?? PlayerState.instance.currentLevel;
    this.transitioning = false;
    this.enemies = [];
    this.lavas = [];
  }

  create(): void {
    // New run starts here; keep persistent totals, reset per-run counters.
    PlayerState.instance.resetSession();

    const config = getLevelConfig(this.levelNum);

    this.cameras.main.setBackgroundColor(config.bgColor);

    // Physics world bounds match level size
    this.physics.world.setBounds(0, 0, config.worldWidth, config.worldHeight);

    // Initialize audio before creating Player; Player methods call audio hooks.
    this.audio = new AudioSystem();
    this.audio.resume(); // browser safety

    this.buildParallaxBackground(config.worldWidth, config.id);
    this.buildLevel(config);
    this.spawnPlayer();
    this.playerShadow = this.add
      .ellipse(0, 0, 28, 8, 0x000000, 0.25)
      .setDepth(9);
    this.setupCamera(config);

    // Phase 4: platform mechanics — must be created AFTER spawnPlayer()
    // so this.player is available for PlatformSystem overlap callbacks.
    this.platformSystem = new PlatformSystem(this);

    // Spawn dynamic platforms defined in the level config
    for (const mp of config.movingPlatforms ?? []) {
      this.platformSystem.createMoving(mp.x, mp.y, mp.endX, mp.endY, mp.speed);
    }
    for (const mh of config.movingHazards ?? []) {
      // Skip vertical movers: they read as "falling objects" in gameplay.
      if (mh.type === "moving_spike" && mh.direction !== "vertical") {
        this.spawner.spawnMovingSpike(this.objects.spikes, mh);
      }
    }

    // Phase 6: feedback subsystem
    this.feedback = new FeedbackSystem(this);
    this.feedback.init();

    this.setupColliders();
    this.listenToEvents();

    this.levelStart = this.time.now;
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Phase 5: launch the UI overlay (level-name banner, etc.)
    if (!this.scene.isActive(SCENE.UI)) {
      this.scene.launch(SCENE.UI);
    }

    // Defer the banner emit slightly so UIScene has finished create()
    this.time.delayedCall(50, () => {
      this.game.events.emit("levelNameShow", config.label);
    });

    // Phase 5: Pause key — Escape or P
    this.input.keyboard!.on("keydown-ESC", () => this.triggerPause());
    this.input.keyboard!.on("keydown-P", () => this.triggerPause());
  }

  private triggerPause(): void {
    if (this.transitioning) return;
    this.scene.pause();
    this.scene.launch(SCENE.PAUSE);
  }

  update(_time: number, delta: number): void {
    if (this.transitioning) return;

    this.player.tick(delta);
    this.updatePlayerShadow();

    // Phase 6: Camera lookahead
    const targetOffsetX =
      this.player.body.velocity.x > 30
        ? -80
        : this.player.body.velocity.x < -30
          ? 80
          : 0;
    this.cameraOffsetX = Phaser.Math.Linear(
      this.cameraOffsetX ?? 0,
      targetOffsetX,
      0.05,
    );
    this.camController.setFollowOffset(this.cameraOffsetX, 0);

    this.updateParallax();
    this.updateEnemies();
    this.updateLava(delta);

    // Timer broadcast to HUD
    this.events.emit("timer-update", this.time.now - this.levelStart);
  }

  // ─── Build ─────────────────────────────────────────────────────────────────

  private buildParallaxBackground(worldWidth: number, levelId: number): void {
    const suffix = levelId === 1 ? "l1" : levelId === 2 ? "l2" : "l3";

    // Phase 6: added cloud layer
    this.bgMountains = this.add
      .tileSprite(0, 0, worldWidth, GAME_HEIGHT, `bg_mountains_${suffix}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-4);

    this.bgClouds = this.add
      .tileSprite(0, 0, worldWidth, GAME_HEIGHT, `bg_clouds_${suffix}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-3);

    this.bgHills = this.add
      .tileSprite(0, 0, worldWidth, GAME_HEIGHT, `bg_hills_${suffix}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-2);

    this.bgTrees = this.add
      .tileSprite(0, 0, worldWidth, GAME_HEIGHT, `bg_trees_${suffix}`)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(-1);
  }

  private buildLevel(config: ReturnType<typeof getLevelConfig>): void {
    this.tilemapLoader = new TilemapLoader(this);
    this.tilemapLoader.buildFromConfig(config);

    this.spawner = new ObjectSpawner(this);
    this.objects = this.spawner.spawnFromConfig(config);

    this.enemies = this.objects.enemies;
    this.lavas = this.objects.lavas;
  }

  private spawnPlayer(): void {
    this.inputHandler = new InputHandler(this);
    this.camController = new CameraController(this);

    const charKey = PlayerState.instance.selectedCharacter ?? "explorer";
    const { x, y } = this.objects.spawn;

    this.player = new Player(
      this,
      x,
      y,
      this.inputHandler,
      this.camController,
      this.audio, // Phase 6: pass injected audio
      charKey,
    );
  }

  private setupCamera(config: ReturnType<typeof getLevelConfig>): void {
    // Phase 6: startFollow is now wrapped/configured in CameraController
    this.camController.setBounds(config.worldWidth, config.worldHeight);
    this.camController.follow(this.player.sprite);
  }

  // ─── Physics Colliders & Overlaps ─────────────────────────────────────────

  private setupColliders(): void {
    // Player vs terrain
    this.physics.add.collider(
      this.player.sprite,
      this.tilemapLoader.groundLayer,
    );
    this.physics.add.collider(
      this.player.sprite,
      this.tilemapLoader.platformLayer,
    );

    // Phase 4: player vs moving platforms
    this.physics.add.collider(
      this.player.sprite,
      this.platformSystem.movingGroup,
    );

    // Enemies vs terrain
    for (const enemy of this.enemies) {
      this.physics.add.collider(enemy.sprite, this.tilemapLoader.groundLayer);
      this.physics.add.collider(enemy.sprite, this.tilemapLoader.platformLayer);
    }

    // ── Coin pickup ──────────────────────────────────────────────────────────
    this.physics.add.overlap(
      this.player.sprite,
      this.objects.coins,
      (_ps, coin) => {
        const c = coin as Phaser.Physics.Arcade.Image;
        // Phase 6: gold burst + float score + audio
        this.feedback.floatScore(c.x, c.y, 10);
        this.audio.playCoin();

        ParticleSystem.coinPickup(this, c.x, c.y);
        c.destroy();

        const unlocked = PlayerState.instance.addCoin();
        this.player.collectCoin();

        if (unlocked) {
          this.time.delayedCall(100, () => {
            this.scene.launch(SCENE.CHAR_UNLOCK, { characterKey: unlocked });
          });
        }
      },
    );

    // ── Spike: one-shot kill ──────────────────────────────────────────────────
    this.physics.add.overlap(this.player.sprite, this.objects.spikes, () =>
      this.player.takeDamage(),
    );

    // ── Flag: level complete ──────────────────────────────────────────────────
    this.physics.add.overlap(this.player.sprite, this.objects.flagBody, () =>
      this.triggerLevelComplete(),
    );

    // ── Enemy: stomp or damage ────────────────────────────────────────────────
    for (const enemy of this.enemies) {
      this.physics.add.overlap(this.player.sprite, enemy.sprite, (_ps, es) => {
        if (!enemy.alive) return;

        const pBody = this.player.body;
        const eSprite = es as Phaser.Physics.Arcade.Sprite;
        const eBody = eSprite.body as Phaser.Physics.Arcade.Body;

        // Stomp check: player must be falling AND player's bottom is above enemy center
        const isStomping =
          pBody.velocity.y > 50 && pBody.bottom <= eBody.center.y + 6;

        if (isStomping) {
          const ex = eSprite.x,
            ey = eSprite.y;
          enemy.stomp();

          // Phase 6: juice on stomp
          this.feedback.enemyStomp(ex, ey);
          this.feedback.floatScore(ex, ey, 100);
          this.audio.playCoin(); // higher pitch "ding" for stomp feels good

          ParticleSystem.enemyDeath(this, ex, ey);
          // Bounce
          pBody.setVelocityY(-220);
        } else {
          this.player.takeDamage();
        }
      });
    }
  }

  // ─── Per-frame updates ────────────────────────────────────────────────────

  private updateParallax(): void {
    const camX = this.cameras.main.scrollX;
    this.bgMountains.setTilePosition(camX * 0.08);
    this.bgClouds.setTilePosition(camX * 0.12); // Phase 6: clouds
    this.bgHills.setTilePosition(camX * 0.25);
    this.bgTrees.setTilePosition(camX * 0.5);
  }

  private updateEnemies(): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.tick();
    }
  }

  private updateLava(delta: number): void {
    for (const lava of this.lavas) {
      // Check overlap manually (lava uses invisible image body)
      const pBounds = this.player.sprite.getBounds();
      const lBounds = lava.body.getBounds();

      if (Phaser.Geom.Intersects.RectangleToRectangle(pBounds, lBounds)) {
        if (lava.tryDamage(delta)) {
          this.player.takeDamage();
        }
      }
    }
  }

  private updatePlayerShadow(): void {
    const body = this.player.body;
    if (!this.playerShadow || !body) return;

    // Show shadow when player is touching ground and falling/standing (not just jumping up)
    const grounded = body.onFloor() && body.velocity.y >= 0;

    if (grounded) {
      this.playerShadow
        .setVisible(true)
        .setAlpha(0.25)
        .setPosition(this.player.x, body.bottom + 4);
      this.playerShadow.setScale(1, 0.45);
    } else {
      this.playerShadow.setVisible(false);
    }
  }

  // ─── Scene Transitions ────────────────────────────────────────────────────

  private listenToEvents(): void {
    // ── Transition Feedback ──────────────────────────────────────────────────
    this.events.on("playerLanded", (x: number, y: number) => {
      this.feedback.landingDust(x, y);
    });

    this.events.on("playerJumped", (vy: number) => {
      // Zoom pulse on full-power jumps
      if (vy <= JUMP_VELOCITY + 10) {
        this.tweens.add({
          targets: this.cameras.main,
          zoom: 1.04,
          duration: 150,
          yoyo: true,
          ease: "Quad.easeOut",
        });
      }
    });

    this.events.on("playerHit", (x: number, y: number) => {
      this.feedback.playerHit(x, y);
    });

    this.events.on(EV.PLAYER_DEAD, () => {
      if (this.transitioning) return;
      this.transitioning = true;

      // Phase 6: slow-mo death
      this.feedback.deathSlowMo();

      const state = PlayerState.instance;
      // Finalize session coins (persist collected coins)
      state.finalizeSessionCoins();

      this.time.delayedCall(700, () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once("camerafadeoutcomplete", () => {
          this.scene.stop(SCENE.PAUSE);
          this.scene.stop(SCENE.UI);
          this.scene.stop(SCENE.HUD);
          this.scene.start(SCENE.GAME_OVER, {
            level: this.levelNum,
            coins: state.sessionCoins,
            totalCoins: state.totalCoins,
          });
        });
      });
    });
  }

  private triggerLevelComplete(): void {
    if (this.transitioning) return;
    this.transitioning = true;

    // Phase 6: level flare!
    ParticleSystem.levelFlare(this);

    const elapsed = this.time.now - this.levelStart;

    // Clamp to max level
    const nextLevel = Math.min(this.levelNum + 1, getMaxLevel());
    PlayerState.instance.currentLevel = Math.max(
      PlayerState.instance.currentLevel,
      nextLevel,
    );
    // Finalize session coins (persist collected coins)
    PlayerState.instance.finalizeSessionCoins();

    this.time.delayedCall(500, () => {
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.stop(SCENE.PAUSE);
        this.scene.stop(SCENE.UI);
        this.scene.stop(SCENE.HUD);
        this.scene.start(SCENE.LEVEL_COMPLETE, {
          level: this.levelNum,
          coins: PlayerState.instance.sessionCoins,
          totalCoins: PlayerState.instance.totalCoins,
          time: elapsed,
          nextLevel,
        });
      });
    });
  }
}
