# Block Land - Short Overview

Block Land is a pixel-platformer built with Phaser + TypeScript.

## Core Gameplay

- Run, jump, and navigate platform layouts.
- Collect coins and avoid hazards.
- Defeat enemies by stomping from above.
- Reach the flag to finish a level.

## Progression

- Levels unlock in order after completion.
- Replay is supported for previously unlocked levels.
- Progress never goes backward if you replay older stages.

## Levels (Current)

- Level 1: Greenhill (intro difficulty, water-themed pools)
- Level 2: Dustlands (medium, lava hazards)
- Level 3: Crystal Cave (hard, denser hazards and enemies)

## Characters and Unlocks

- Character selection is in the menu Heroes panel.
- New characters unlock by total coin milestones.
- Selected character and unlocks are saved.

## Main Menu

- Game-style animated hub with two cards:
  - Play: opens level selection
  - Heroes: opens character selection/unlock panel
- Level cards show state:
  - DONE: completed
  - PLAY: currently available
  - LOCK: not yet unlocked

## Save Data

- Persistent save includes:
  - total coins
  - highest unlocked level
  - unlocked characters
  - selected character

## Controls

- Move: Left / Right
- Jump: Space or Up
- Run: Shift

## Tech Stack

- Phaser
- TypeScript
- Vite
