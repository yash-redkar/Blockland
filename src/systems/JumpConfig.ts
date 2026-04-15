/**
 * JumpConfig.ts — All jump-physics tuning constants in one place.
 *
 * Keeping these separate from Player.ts means a designer can iterate on
 * feel without reading physics code, and a programmer can A/B test values
 * without scattering magic numbers across the codebase.
 *
 * Values validated against Celeste (2018) and Super Mario Odyssey feel targets.
 */

// ─── Velocity ─────────────────────────────────────────────────────────────────
/** Initial upward velocity on jump (negative = up in Phaser). */
export const JUMP_VELOCITY = -390;

// ─── Gravity multipliers ───────────────────────────────────────────────────────
/**
 * Base gravity when rising or idle in air.
 * Phaser's world gravity is subtracted in Player.ts so the body override is
 * relative — only this file needs to change to re-tune.
 */
export const GRAVITY_NORMAL = 1200;

/**
 * Heavier gravity on the way DOWN — the classic "fast fall" feel of Mario.
 * Applied whenever vy > 0 and not at apex and not holding down.
 */
export const GRAVITY_FALLING = 2000;

/**
 * Maximum gravity when holding ↓ while airborne.
 * Gives the player active control to drop through gaps quickly.
 */
export const GRAVITY_FASTFALL = 3200;

// ─── Apex hang ────────────────────────────────────────────────────────────────
/**
 * If |vy| is below this threshold the player is "near the apex".
 * Gravity is reduced to GRAVITY_NORMAL * APEX_GRAVITY_SCALE for that moment,
 * giving the floaty hang that makes precision jumps forgiving.
 */
export const APEX_THRESHOLD = 80; // px/s
export const APEX_GRAVITY_SCALE = 0.22;

// ─── Variable height ──────────────────────────────────────────────────────────
/**
 * When the player releases the jump key while still rising (vy < this),
 * velocity is multiplied by JUMP_CUT_FACTOR.
 * 0.45 gives a ~2× ratio between tap and full hold height.
 */
export const JUMP_CUT_MIN_VY = -200; // only cut if rising faster than this
export const JUMP_CUT_FACTOR = 0.45;

// ─── Coyote time ──────────────────────────────────────────────────────────────
/**
 * Milliseconds after walking off a ledge the player can still jump.
 * Kept shorter here so stepping off a ledge falls sooner.
 */
export const COYOTE_MS = 40;

// ─── Jump buffer ──────────────────────────────────────────────────────────────
/**
 * Milliseconds before landing that a jump press is remembered.
 * Player presses jump slightly early → lands → immediately jumps.
 * Makes the game feel responsive instead of "I pressed before the floor".
 */
export const BUFFER_MS = 150;

// ─── Squash & Stretch ─────────────────────────────────────────────────────────
export const SQUASH_TAKEOFF = { scaleX: 0.72, scaleY: 1.32, duration: 80 };
export const SQUASH_LAND = { scaleX: 1.35, scaleY: 0.7, duration: 70 };
export const SQUASH_RESTORE_MS = 150;
