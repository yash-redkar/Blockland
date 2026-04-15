/**
 * AssetKeys.ts — Single source of truth for ALL asset texture/audio keys.
 *
 * Why: Magic strings like "tile_ground" scattered across 10 files are a
 * maintenance trap. A typo silently produces a missing-texture fallback at
 * runtime. With typed constants, TypeScript catches any mismatch at compile time.
 *
 * Usage:
 *   import { AK } from '../config/AssetKeys';
 *   this.add.image(0, 0, AK.BG.MOUNTAINS_L1);
 */

// ─── Tiles ────────────────────────────────────────────────────────────────────
export const TILES = {
  GROUND: "tile_ground",
  PLATFORM: "tile_platform",
} as const;

// ─── Hazards & Objects ────────────────────────────────────────────────────────
export const OBJECTS = {
  SPIKE: "spike",
  FLAG: "flag",
  PARTICLE: "particle",
  COIN: "coin", // future: Kenney coin spritesheet
} as const;

// ─── Characters (spritesheets) ───────────────────────────────────────────────
export const CHARS = {
  EXPLORER: "explorer",
  KNIGHT: "knight",
  MAGE: "mage",
  ROBOT: "robot",
  NINJA: "ninja",
} as const;

// ─── Enemies ─────────────────────────────────────────────────────────────────
export const ENEMIES = {
  GOOMBA: "enemy",
} as const;

// ─── Parallax Backgrounds ─────────────────────────────────────────────────────
//
// Each level gets its own colour palette: l1 = grass/blue, l2 = desert,
// l3 = night sky.  The keys are built as `bg_<layer>_<level>`.
//
export const BG = {
  MOUNTAINS_L1: "bg_mountains_l1",
  CLOUDS_L1: "bg_clouds_l1",
  HILLS_L1: "bg_hills_l1",
  TREES_L1: "bg_trees_l1",

  MOUNTAINS_L2: "bg_mountains_l2",
  CLOUDS_L2: "bg_clouds_l2",
  HILLS_L2: "bg_hills_l2",
  TREES_L2: "bg_trees_l2",

  MOUNTAINS_L3: "bg_mountains_l3",
  CLOUDS_L3: "bg_clouds_l3",
  HILLS_L3: "bg_hills_l3",
  TREES_L3: "bg_trees_l3",
} as const;

// ─── UI Icons ────────────────────────────────────────────────────────────────
export const UI = {
  COIN: "icon_coin",
  HEART: "icon_heart",
} as const;

// ─── Animations ───────────────────────────────────────────────────────────────
//
// Helpers that build animation keys from a character key — same pattern
// PreloadScene uses to register them.
//
export function animKey(
  charKey: string,
  state: "idle" | "run" | "jump" | "fall" | "hurt",
): string {
  return `${charKey}-${state}`;
}

export const ENEMY_ANIM = {
  WALK: "enemy-walk",
} as const;

// ─── Aggregated namespace (recommended import) ─────────────────────────────
export const AK = {
  TILES,
  OBJECTS,
  CHARS,
  ENEMIES,
  BG,
  UI,
  animKey,
  ENEMY_ANIM,
} as const;
