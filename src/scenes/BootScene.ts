import Phaser from 'phaser';
import { SCENE } from '../config';

/**
 * BootScene — The very first scene to run.
 * Its sole purpose is to immediately hand off to PreloadScene.
 * In a full build this is where you'd load a tiny loading-bar spritesheet
 * before anything else runs. For Phase 1 we transition instantly.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE.BOOT });
  }

  create(): void {
    this.scene.start(SCENE.PRELOAD);
  }
}
