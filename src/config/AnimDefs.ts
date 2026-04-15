import { CharacterRegistry } from '../data/PlayerState';

/**
 * AnimDef — descriptor for a single Phaser animation.
 *
 * Mapped to the ACTUAL 10-frame spritesheet generated in PreloadScene:
 *   0        idle
 *   1–6      run
 *   7        jump
 *   8        fall  (also used for 'land' — no dedicated landing art yet)
 *   9        hurt
 *
 * The 'land' key is intentionally separate from 'fall' so AnimController can
 * show a distinct state window (200 ms) even though they share the same frame.
 * When a dedicated land sprite is added later, only the frame range changes here.
 */
export interface AnimDef {
  key: string;
  frames: { start: number; end: number };
  frameRate: number;
  repeat: number;
}

export const BASE_ANIM_DEFS: AnimDef[] = [
  { key: 'idle', frames: { start: 0, end: 0 }, frameRate: 3,  repeat: -1 },
  { key: 'run',  frames: { start: 1, end: 6 }, frameRate: 12, repeat: -1 },
  { key: 'jump', frames: { start: 7, end: 7 }, frameRate: 8,  repeat:  0 },
  { key: 'fall', frames: { start: 8, end: 8 }, frameRate: 8,  repeat:  0 },
  { key: 'land', frames: { start: 8, end: 8 }, frameRate: 10, repeat:  0 },
  { key: 'hurt', frames: { start: 9, end: 9 }, frameRate: 8,  repeat:  0 },
];

/**
 * Build the full set of qualified animation keys for a character.
 * e.g. charKey='explorer' → 'explorer-idle', 'explorer-run', ...
 */
export function buildAnimDefs(charKey: string): (AnimDef & { qualifiedKey: string })[] {
  return BASE_ANIM_DEFS.map(def => ({
    ...def,
    qualifiedKey: `${charKey}-${def.key}`,
  }));
}

/**
 * Convenience: returns all qualified animation keys across all registered characters.
 * Useful in PreloadScene to register everything in one loop.
 */
export function buildAllAnimDefs(): (AnimDef & { charKey: string; qualifiedKey: string })[] {
  return CharacterRegistry.CHARACTERS.flatMap(char =>
    BASE_ANIM_DEFS.map(def => ({
      ...def,
      charKey: char.key,
      qualifiedKey: `${char.key}-${def.key}`,
    }))
  );
}
