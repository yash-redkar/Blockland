// ─── Canvas / Scaling ─────────────────────────────────────────────────────────
export const GAME_WIDTH  = 480;
export const GAME_HEIGHT = 270;
export const GAME_ZOOM   = 3;   // 480×270 × 3 = 1440×810 — crisp on 1080p

// ─── Physics ──────────────────────────────────────────────────────────────────
export const GRAVITY_Y        = 900;
export const PLAYER_SPEED     = 140;
export const PLAYER_RUN_SPEED = 220;
export const PLAYER_JUMP_VEL  = -360;
export const PLAYER_DRAG      = 900;    // alias used in Player.ts
export const PLAYER_DRAG_X    = 900;    // ground drag
export const PLAYER_AIR_DRAG  = 200;    // air drag (reduced)

// ─── World / Tiles ────────────────────────────────────────────────────────────
export const TILE_SIZE    = 16;
export const WORLD_WIDTH  = 4800;
export const WORLD_HEIGHT = 480;

// ─── Enemy ────────────────────────────────────────────────────────────────────
export const ENEMY_BASE_SPEED = 60;

// ─── Colours ─────────────────────────────────────────────────────────────────
export const CLR_SKY         = 0x5c94fc;
export const COLOR_SKY       = 0x5c94fc;  // alias for GameScene import
export const CLR_GROUND_TOP  = 0x6b8c42;
export const CLR_GROUND_BODY = 0x7b5e2a;
export const CLR_PLATFORM    = 0x8b6914;
export const CLR_COIN        = 0xffd700;
export const CLR_SPIKE       = 0xcccccc;
export const CLR_ENEMY       = 0xe05050;
export const CLR_FLAG        = 0x22dd44;

// ─── HUD ──────────────────────────────────────────────────────────────────────
export const HUD_MARGIN = 6;

// ─── Coin Milestones ─────────────────────────────────────────────────────────
export const COIN_MILESTONE = 500;

// ─── Scene Keys ───────────────────────────────────────────────────────────────
export const SCENE = {
  BOOT           : 'BootScene',
  PRELOAD        : 'PreloadScene',
  MAIN_MENU      : 'MainMenuScene',
  GAME           : 'GameScene',
  HUD            : 'HUDScene',
  GAME_OVER      : 'GameOverScene',
  LEVEL_COMPLETE : 'LevelCompleteScene',
  CHAR_UNLOCK    : 'CharacterUnlockScene',
  PAUSE          : 'PauseScene',
  UI             : 'UIScene',
} as const;

// ─── Event Bus Keys ───────────────────────────────────────────────────────────
export const EV = {
  COIN_COLLECTED  : 'coin-collected',
  LIFE_LOST       : 'life-lost',
  PLAYER_DEAD     : 'player-dead',
  LEVEL_COMPLETE  : 'level-complete',
  CHAR_UNLOCKED   : 'char-unlocked',
} as const;
