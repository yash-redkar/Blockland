import { TILE_SIZE } from "../config";

const T = TILE_SIZE; // 16 px

/**
 * PlatformDef â€” single platform strip.
 * x, y are in TILES from top-left of the world.
 * w = width in tiles.
 *
 * IMPORTANT: Ground row is y=29 (tile origin top).
 * Physics: PLAYER_JUMP_VEL=-360, GRAVITY=900 â†’ max jump height â‰ˆ 72px â‰ˆ 4.5 tiles.
 * So from ground (y=29), max reachable is y=25 directly.
 * Chain platforms in steps of â‰¤4 rows to reach higher.
 */
export interface PlatformDef {
  x: number;
  y: number;
  w: number;
  type?: "static";
}

/** ObjectDef â€” entity to spawn at (px, py) in PIXELS. */
export interface ObjectDef {
  type: "coin" | "enemy" | "spike" | "lava" | "flag" | "spawn" | "checkpoint";
  px: number; // pixel x (left edge)
  py: number; // pixel y (top edge)
  w?: number; // width in pixels (lava / coin rows only)
  enemyMode?: "ground" | "drop" | "platform";
  patrolRange?: number;
}

export interface MovingPlatformDef {
  /** Start position (pixels) */
  x: number;
  y: number;
  /** End position (pixels) to tween toward */
  endX: number;
  endY: number;
  /** Travel speed in px/s (default 80) */
  speed?: number;
}

export interface BouncePlatformDef {
  x: number;
  y: number;
}

export interface TimedPlatformDef {
  x: number;
  y: number;
  w: number;
  visibleDuration: number; // seconds
  hiddenDuration: number; // seconds
  phaseOffset?: number; // seconds (delays cycle start)
  warningTime?: number; // seconds (default 0.5s)
}

export interface MovingHazardDef {
  type: "moving_spike";
  px: number;
  py: number;
  direction: "horizontal" | "vertical";
  range: number; // tiles
  speed: number; // tiles/sec
}

export interface LevelConfig {
  id: number;
  label: string;
  /** Total level width in PIXELS */
  worldWidth: number;
  /** Total level height in PIXELS */
  worldHeight: number;
  bgColor: number;
  enemySpeedMult: number;
  platforms: PlatformDef[];
  objects: ObjectDef[];
  /** Phase 4: PlatformSystem moving platforms */
  movingPlatforms?: MovingPlatformDef[];
  /** Phase 4: PlatformSystem bounce platforms */
  bouncePlatforms?: BouncePlatformDef[];
  timedPlatforms?: TimedPlatformDef[];
  movingHazards?: MovingHazardDef[];
}

// â”€â”€â”€ Level 1 â€” Greenhill â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Easy intro: all platforms reachable from ground (y=25-26), gentle staircase.
// World: 2400px wide Ã— 480px tall
const LEVEL_1: LevelConfig = {
  id: 1,
  label: "Greenhill",
  worldWidth: 2400,
  worldHeight: 480,
  bgColor: 0x5c94fc,
  enemySpeedMult: 1.0,

  // Ground is at y=29. Platform y=25 â†’ direct jump from ground.
  // y=22 â†’ reachable from y=25 (gap=3). y=19 â†’ from y=22 (gap=3).
  platforms: [
    { x: 8, y: 25, w: 5 }, // Tier 1 â€” directly jumpable from ground
    { x: 17, y: 23, w: 4 }, // Tier 2
    { x: 25, y: 26, w: 6 }, // Tier 1
    { x: 34, y: 24, w: 4 }, // Tier 2
    { x: 42, y: 26, w: 3 }, // Tier 1
    { x: 48, y: 23, w: 5 }, // Tier 2
    { x: 56, y: 21, w: 4 }, // Tier 3 â€” reachable from y=24
    { x: 63, y: 24, w: 5 }, // Tier 2
    { x: 71, y: 26, w: 4 }, // Tier 1
    { x: 78, y: 23, w: 3 }, // Tier 2
    { x: 84, y: 26, w: 5 }, // Tier 1
    { x: 91, y: 24, w: 4 }, // Tier 2
    { x: 99, y: 26, w: 5 }, // Tier 1
    { x: 107, y: 23, w: 4 }, // Tier 2
    { x: 115, y: 25, w: 3 }, // Tier 1
    { x: 121, y: 22, w: 4 }, // Tier 2
    { x: 129, y: 25, w: 3 }, // Tier 1
    { x: 135, y: 23, w: 5 }, // Tier 2
    { x: 143, y: 26, w: 4 }, // Tier 1
  ],

  objects: [
    // Spawn near ground
    { type: "spawn", px: 2 * T, py: 26 * T },

    // Coins â€” on and above platforms (1-2 tiles above)
    { type: "coin", px: 8 * T, py: 23 * T },
    { type: "coin", px: 10 * T, py: 23 * T },
    { type: "coin", px: 12 * T, py: 23 * T },
    { type: "coin", px: 17 * T, py: 21 * T },
    { type: "coin", px: 19 * T, py: 21 * T },
    { type: "coin", px: 26 * T, py: 24 * T },
    { type: "coin", px: 28 * T, py: 24 * T },
    { type: "coin", px: 35 * T, py: 22 * T },
    { type: "coin", px: 37 * T, py: 22 * T },
    { type: "coin", px: 43 * T, py: 24 * T },
    { type: "coin", px: 49 * T, py: 21 * T },
    { type: "coin", px: 51 * T, py: 21 * T },
    { type: "coin", px: 57 * T, py: 19 * T },
    { type: "coin", px: 59 * T, py: 19 * T },
    { type: "coin", px: 64 * T, py: 22 * T },
    { type: "coin", px: 79 * T, py: 21 * T },
    { type: "coin", px: 92 * T, py: 22 * T },
    { type: "coin", px: 94 * T, py: 22 * T },
    { type: "coin", px: 108 * T, py: 21 * T },
    { type: "coin", px: 122 * T, py: 20 * T },
    { type: "coin", px: 136 * T, py: 21 * T },
    { type: "coin", px: 138 * T, py: 21 * T },

    // Spikes on ground
    { type: "spike", px: 22 * T, py: 28 * T },
    { type: "spike", px: 46 * T, py: 28 * T },
    { type: "spike", px: 75 * T, py: 28 * T },
    { type: "spike", px: 112 * T, py: 28 * T },

    // Enemies
    { type: "enemy", px: 35 * T, py: 26 * T },
    { type: "enemy", px: 65 * T, py: 26 * T },
    { type: "enemy", px: 115 * T, py: 26 * T },

    // Water hazard pools
    { type: "lava", px: 55 * T, py: 29 * T, w: 2 * T },
    { type: "lava", px: 88 * T, py: 29 * T, w: 3 * T },
    { type: "lava", px: 127 * T, py: 29 * T, w: 2 * T },

    // Flag at end
    { type: "flag", px: 148 * T, py: 27 * T },
  ],
};

// â”€â”€â”€ Level 2 â€” Dustlands â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Medium: tighter gaps, longer jumps, lava pits, more enemies.
// World: 3200px wide Ã— 480px tall
const LEVEL_2: LevelConfig = {
  id: 2,
  label: "Dustlands",
  worldWidth: 3200,
  worldHeight: 480,
  bgColor: 0xc07840,
  enemySpeedMult: 1.4,

  platforms: [
    { x: 6, y: 25, w: 4 },
    { x: 14, y: 22, w: 3 },
    { x: 20, y: 25, w: 4 },
    { x: 24, y: 20, w: 3 },
    { x: 28, y: 23, w: 5 },
    { x: 36, y: 25, w: 3 },
    { x: 42, y: 22, w: 3 },
    { x: 48, y: 25, w: 3 },
    { x: 52, y: 19, w: 3 },
    { x: 55, y: 23, w: 4 },
    { x: 62, y: 20, w: 5 },
    { x: 70, y: 23, w: 3 },
    { x: 76, y: 25, w: 4 },
    { x: 84, y: 22, w: 3 },
    { x: 90, y: 25, w: 5 },
    { x: 94, y: 19, w: 3 },
    { x: 98, y: 22, w: 4 },
    { x: 106, y: 25, w: 3 },
    { x: 112, y: 23, w: 4 },
    { x: 120, y: 25, w: 5 },
    { x: 129, y: 22, w: 3 },
    { x: 136, y: 25, w: 4 },
    { x: 143, y: 23, w: 3 },
    { x: 147, y: 19, w: 3 },
    { x: 151, y: 25, w: 5 },
    { x: 159, y: 22, w: 4 },
    { x: 167, y: 25, w: 3 },
    { x: 175, y: 23, w: 5 },
    { x: 183, y: 25, w: 4 },
    { x: 186, y: 19, w: 3 },
    { x: 191, y: 22, w: 3 },
    { x: 197, y: 25, w: 5 },
  ],

  objects: [
    { type: "spawn", px: 2 * T, py: 26 * T },

    // Coins
    { type: "coin", px: 6 * T, py: 23 * T },
    { type: "coin", px: 8 * T, py: 23 * T },
    { type: "coin", px: 14 * T, py: 20 * T },
    { type: "coin", px: 29 * T, py: 21 * T },
    { type: "coin", px: 31 * T, py: 21 * T },
    { type: "coin", px: 43 * T, py: 20 * T },
    { type: "coin", px: 62 * T, py: 18 * T },
    { type: "coin", px: 64 * T, py: 18 * T },
    { type: "coin", px: 66 * T, py: 18 * T },
    { type: "coin", px: 84 * T, py: 20 * T },
    { type: "coin", px: 98 * T, py: 20 * T },
    { type: "coin", px: 100 * T, py: 20 * T },
    { type: "coin", px: 120 * T, py: 23 * T },
    { type: "coin", px: 122 * T, py: 23 * T },
    { type: "coin", px: 143 * T, py: 21 * T },
    { type: "coin", px: 159 * T, py: 20 * T },
    { type: "coin", px: 167 * T, py: 23 * T },
    { type: "coin", px: 183 * T, py: 23 * T },
    { type: "coin", px: 191 * T, py: 20 * T },
    { type: "coin", px: 197 * T, py: 23 * T },
    { type: "coin", px: 199 * T, py: 23 * T },
    { type: "coin", px: 201 * T, py: 23 * T },

    // Lava pits
    { type: "lava", px: 17 * T, py: 29 * T, w: 2 * T },
    { type: "lava", px: 44 * T, py: 29 * T, w: 3 * T },
    { type: "lava", px: 72 * T, py: 29 * T, w: 2 * T },
    { type: "lava", px: 109 * T, py: 29 * T, w: 3 * T },
    { type: "lava", px: 134 * T, py: 29 * T, w: 2 * T },
    { type: "lava", px: 165 * T, py: 29 * T, w: 4 * T },

    // Spikes
    { type: "spike", px: 24 * T, py: 28 * T },
    { type: "spike", px: 52 * T, py: 28 * T },
    { type: "spike", px: 78 * T, py: 28 * T },
    { type: "spike", px: 79 * T, py: 28 * T },
    { type: "spike", px: 127 * T, py: 28 * T },
    { type: "spike", px: 174 * T, py: 28 * T },

    // Enemies
    { type: "enemy", px: 29 * T, py: 26 * T },
    { type: "enemy", px: 55 * T, py: 26 * T },
    { type: "enemy", px: 90 * T, py: 26 * T },
    { type: "enemy", px: 120 * T, py: 26 * T },
    { type: "enemy", px: 159 * T, py: 26 * T },
    { type: "enemy", px: 197 * T, py: 26 * T },

    // Flag
    { type: "flag", px: 199 * T, py: 27 * T },
  ],
};

// â”€â”€â”€ Level 3 â€” Crystal Cave â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Hard but fair: phase-based climb with smarter enemy placement, limited lava,
// and optional coin routes that reward risk without forcing precision chaos.
// World: 4800px wide Ã— 480px tall
const LEVEL_3: LevelConfig = {
  id: 3,
  label: "Crystal Cave",
  worldWidth: 4800,
  worldHeight: 480,
  bgColor: 0x1a1a3a,
  enemySpeedMult: 1.95,

  platforms: [
    // Phase 1: entry path - teaches timing without being cramped
    { x: 5, y: 25, w: 4 },
    { x: 12, y: 23, w: 5 },
    { x: 20, y: 25, w: 4 },
    { x: 28, y: 23, w: 4 },
    { x: 35, y: 25, w: 5 },

    // Phase 2: first climb - steady stair-step rise
    { x: 44, y: 25, w: 4 },
    { x: 50, y: 22, w: 4 },
    { x: 57, y: 19, w: 5 },
    { x: 65, y: 22, w: 4 },
    { x: 72, y: 25, w: 4 },

    // Phase 3: mid cave - wider platforms with one risky upper route
    { x: 81, y: 24, w: 5 },
    { x: 89, y: 21, w: 4 },
    { x: 96, y: 18, w: 4 },
    { x: 103, y: 21, w: 5 },
    { x: 111, y: 24, w: 4 },

    // Phase 4: vertical climb - several clean jumps upward
    { x: 121, y: 24, w: 4 },
    { x: 128, y: 21, w: 4 },
    { x: 135, y: 18, w: 4 },
    { x: 142, y: 15, w: 4 },
    { x: 149, y: 18, w: 4 },
    { x: 156, y: 21, w: 5 },

    // Phase 5: summit run - pressure section but with readable landings
    { x: 166, y: 23, w: 4 },
    { x: 173, y: 20, w: 4 },
    { x: 180, y: 17, w: 5 },
    { x: 188, y: 20, w: 4 },
    { x: 195, y: 23, w: 4 },

    // Phase 6: end stretch - final climb with a safe recovery shelf
    { x: 205, y: 23, w: 4 },
    { x: 212, y: 20, w: 4 },
    { x: 219, y: 17, w: 4 },
    { x: 226, y: 20, w: 5 },
    { x: 234, y: 23, w: 4 },
    { x: 242, y: 24, w: 5 },
    { x: 250, y: 21, w: 4 },
    { x: 257, y: 18, w: 4 },
    { x: 264, y: 21, w: 5 },
    { x: 272, y: 24, w: 4 },
    { x: 280, y: 23, w: 4 },
    { x: 287, y: 21, w: 5 },
    { x: 295, y: 23, w: 5 },
  ],

  objects: [
    { type: "spawn", px: 2 * T, py: 26 * T },

    // Coin paths: safer low route plus riskier upper route rewards.
    { type: "coin", px: 7 * T, py: 23 * T },
    { type: "coin", px: 13 * T, py: 21 * T },
    { type: "coin", px: 23 * T, py: 23 * T },
    { type: "coin", px: 31 * T, py: 21 * T },
    { type: "coin", px: 39 * T, py: 23 * T },
    { type: "coin", px: 52 * T, py: 20 * T },
    { type: "coin", px: 58 * T, py: 17 * T },
    { type: "coin", px: 63 * T, py: 17 * T },
    { type: "coin", px: 83 * T, py: 22 * T },
    { type: "coin", px: 90 * T, py: 19 * T },
    { type: "coin", px: 97 * T, py: 16 * T },
    { type: "coin", px: 104 * T, py: 19 * T },
    { type: "coin", px: 112 * T, py: 22 * T },
    { type: "coin", px: 127 * T, py: 19 * T },
    { type: "coin", px: 136 * T, py: 16 * T },
    { type: "coin", px: 143 * T, py: 13 * T },
    { type: "coin", px: 150 * T, py: 16 * T },
    { type: "coin", px: 158 * T, py: 19 * T },
    { type: "coin", px: 171 * T, py: 18 * T },
    { type: "coin", px: 180 * T, py: 15 * T },
    { type: "coin", px: 189 * T, py: 18 * T },
    { type: "coin", px: 207 * T, py: 19 * T },
    { type: "coin", px: 219 * T, py: 16 * T },
    { type: "coin", px: 227 * T, py: 19 * T },
    { type: "coin", px: 244 * T, py: 22 * T },
    { type: "coin", px: 257 * T, py: 16 * T },
    { type: "coin", px: 265 * T, py: 19 * T },
    { type: "coin", px: 278 * T, py: 22 * T },
    { type: "coin", px: 289 * T, py: 20 * T },

    // Controlled lava pockets: enough to punish mistakes, not spam deaths.
    { type: "lava", px: 17 * T, py: 29 * T, w: 2 * T },
    { type: "lava", px: 45 * T, py: 29 * T, w: 3 * T },
    { type: "lava", px: 74 * T, py: 29 * T, w: 3 * T },
    { type: "lava", px: 115 * T, py: 29 * T, w: 4 * T },
    { type: "lava", px: 160 * T, py: 29 * T, w: 4 * T },
    { type: "lava", px: 198 * T, py: 29 * T, w: 4 * T },
    { type: "lava", px: 236 * T, py: 29 * T, w: 4 * T },
    { type: "lava", px: 271 * T, py: 29 * T, w: 5 * T },

    // Spikes at landing points only.
    { type: "spike", px: 29 * T, py: 24 * T },
    { type: "spike", px: 56 * T, py: 24 * T },
    { type: "spike", px: 88 * T, py: 23 * T },
    { type: "spike", px: 134 * T, py: 17 * T },
    { type: "spike", px: 176 * T, py: 19 * T },
    { type: "spike", px: 213 * T, py: 22 * T },
    { type: "spike", px: 258 * T, py: 22 * T },

    // Enemies: fewer, smarter, and placed where the player must make a decision.
    { type: "enemy", px: 15 * T, py: 22 * T, enemyMode: "ground" },
    { type: "enemy", px: 33 * T, py: 22 * T, enemyMode: "ground" },
    {
      type: "enemy",
      px: 59 * T,
      py: 19 * T,
      patrolRange: 18,
      enemyMode: "platform",
    },
    {
      type: "enemy",
      px: 97 * T,
      py: 18 * T,
      patrolRange: 14,
      enemyMode: "platform",
    },
    {
      type: "enemy",
      px: 143 * T,
      py: 15 * T,
      patrolRange: 14,
      enemyMode: "platform",
    },
    {
      type: "enemy",
      px: 180 * T,
      py: 17 * T,
      patrolRange: 16,
      enemyMode: "platform",
    },
    {
      type: "enemy",
      px: 221 * T,
      py: 20 * T,
      patrolRange: 18,
      enemyMode: "platform",
    },
    { type: "enemy", px: 259 * T, py: 23 * T, enemyMode: "ground" },

    // Flag: final safe ledge after the last pressure climb.
    { type: "flag", px: 298 * T, py: 24 * T },
  ],
};

// â”€â”€â”€ Level 4 â€” Sky Citadel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Expert+: dense hazard gauntlet with chained climbs, timed routes, moving
// spikes, and minimal safe ground.
// World: 3600px wide Ã— 768px tall (taller to accommodate vertical climb)
const LEVEL_4: LevelConfig = {
  id: 4,
  label: "Sky Citadel",
  worldWidth: 3600,
  worldHeight: 768,
  bgColor: 0x0a0a2a,
  enemySpeedMult: 2.35,

  platforms: [
    // â”€â”€ Phase 1: Broken Causeway (immediate pressure) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { x: 2, y: 44, w: 3 },
    { x: 8, y: 42, w: 2 },
    { x: 13, y: 44, w: 2 },
    { x: 18, y: 41, w: 2 },
    { x: 23, y: 44, w: 2 },
    { x: 29, y: 40, w: 2 },
    { x: 34, y: 43, w: 2 },
    { x: 39, y: 39, w: 3 },

    // â”€â”€ Phase 2: Citadel Core climb (alternating heights) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { x: 48, y: 37, w: 3 },
    { x: 55, y: 34, w: 2 },
    { x: 61, y: 31, w: 2 },
    { x: 66, y: 28, w: 3 },
    { x: 73, y: 25, w: 2 },
    { x: 78, y: 22, w: 3 },
    { x: 86, y: 20, w: 2 },
    { x: 92, y: 23, w: 2 },
    { x: 98, y: 19, w: 2 },

    // â”€â”€ Phase 3: Sky needle (precision chain) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { x: 108, y: 17, w: 2 },
    { x: 114, y: 14, w: 1 },
    { x: 120, y: 16, w: 1 },
    { x: 126, y: 13, w: 1 },
    { x: 132, y: 11, w: 1 },
    { x: 138, y: 14, w: 1 },
    { x: 144, y: 17, w: 2 },

    // â”€â”€ Phase 4: Punishing descent to gate â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    { x: 154, y: 21, w: 2 },
    { x: 161, y: 24, w: 2 },
    { x: 168, y: 27, w: 3 },
    { x: 176, y: 30, w: 2 },
    { x: 183, y: 33, w: 3 },
    { x: 191, y: 36, w: 3 },
    { x: 199, y: 39, w: 3 },
    { x: 208, y: 42, w: 4 },
    { x: 217, y: 44, w: 4 },
  ],

  movingPlatforms: [
    // Early bailout route that still demands timing
    { x: 42 * T, y: 42 * T, endX: 50 * T, endY: 38 * T, speed: 75 },
    // Core vertical shuttle
    { x: 70 * T, y: 29 * T, endX: 70 * T, endY: 21 * T, speed: 70 },
    // Needle bridge
    { x: 102 * T, y: 18 * T, endX: 116 * T, endY: 18 * T, speed: 85 },
    // Late recovery mover over lava
    { x: 186 * T, y: 35 * T, endX: 198 * T, endY: 38 * T, speed: 80 },
  ],

  movingHazards: [
    {
      type: "moving_spike",
      px: 16 * T,
      py: 46 * T,
      direction: "horizontal",
      range: 8,
      speed: 2.4,
    },
    {
      type: "moving_spike",
      px: 76 * T,
      py: 24 * T,
      direction: "horizontal",
      range: 6,
      speed: 2.7,
    },
    {
      type: "moving_spike",
      px: 142 * T,
      py: 16 * T,
      direction: "horizontal",
      range: 6,
      speed: 3.2,
    },
    {
      type: "moving_spike",
      px: 190 * T,
      py: 34 * T,
      direction: "horizontal",
      range: 10,
      speed: 2.9,
    },
  ],

  objects: [
    { type: "spawn", px: 2 * T, py: 44 * T },

    // Sparse rewards - mostly bait over danger
    { type: "coin", px: 18 * T, py: 38 * T },
    { type: "coin", px: 57 * T, py: 30 * T },
    { type: "coin", px: 80 * T, py: 18 * T },
    { type: "coin", px: 114 * T, py: 11 * T },
    { type: "coin", px: 132 * T, py: 8 * T },
    { type: "coin", px: 170 * T, py: 24 * T },
    { type: "coin", px: 218 * T, py: 41 * T },

    // Continuous pits and long punish lanes
    { type: "lava", px: 6 * T, py: 47 * T, w: 4 * T },
    { type: "lava", px: 15 * T, py: 47 * T, w: 4 * T },
    { type: "lava", px: 24 * T, py: 47 * T, w: 5 * T },
    { type: "lava", px: 34 * T, py: 47 * T, w: 6 * T },
    { type: "lava", px: 46 * T, py: 47 * T, w: 7 * T },
    { type: "lava", px: 61 * T, py: 47 * T, w: 8 * T },
    { type: "lava", px: 78 * T, py: 47 * T, w: 8 * T },
    { type: "lava", px: 95 * T, py: 47 * T, w: 10 * T },
    { type: "lava", px: 112 * T, py: 47 * T, w: 12 * T },
    { type: "lava", px: 136 * T, py: 47 * T, w: 12 * T },
    { type: "lava", px: 160 * T, py: 47 * T, w: 16 * T },
    { type: "lava", px: 192 * T, py: 47 * T, w: 18 * T },

    // Trap spikes at common landing points
    { type: "spike", px: 13 * T, py: 43 * T },
    { type: "spike", px: 34 * T, py: 42 * T },
    { type: "spike", px: 66 * T, py: 27 * T },
    { type: "spike", px: 86 * T, py: 19 * T },
    { type: "spike", px: 108 * T, py: 16 * T },
    { type: "spike", px: 144 * T, py: 16 * T },
    { type: "spike", px: 168 * T, py: 26 * T },
    { type: "spike", px: 199 * T, py: 38 * T },

    // Aggressive patrol checkpoints
    { type: "enemy", px: 23 * T, py: 42 * T, patrolRange: 48 },
    { type: "enemy", px: 50 * T, py: 35 * T, patrolRange: 42 },
    { type: "enemy", px: 78 * T, py: 20 * T, patrolRange: 24 },
    { type: "enemy", px: 98 * T, py: 17 * T, patrolRange: 20 },
    { type: "enemy", px: 144 * T, py: 15 * T, patrolRange: 20 },
    { type: "enemy", px: 168 * T, py: 25 * T, patrolRange: 28 },
    { type: "enemy", px: 191 * T, py: 34 * T, patrolRange: 36 },

    { type: "flag", px: 221 * T, py: 45 * T },
  ],
};

// â”€â”€â”€ Registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ALL_LEVELS: LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4];

export function getLevelConfig(id: number): LevelConfig {
  return (
    ALL_LEVELS.find((l) => l.id === id) ?? ALL_LEVELS[ALL_LEVELS.length - 1]
  );
}

export function getMaxLevel(): number {
  return ALL_LEVELS.length;
}
