const SAVE_KEY = "blockland_save";

export interface SaveData {
  totalCoins: number;
  spentCoins: number;
  currentLevel: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
}

const DEFAULT_SAVE: SaveData = {
  totalCoins: 0,
  spentCoins: 0,
  currentLevel: 1,
  unlockedCharacters: ["explorer"],
  selectedCharacter: "explorer",
};

/**
 * PlayerState — pure data class persisted to localStorage.
 * Acts as a singleton accessed via PlayerState.instance.
 * In-session state (lives, coins this level) lives here too.
 */
export class PlayerState {
  private static _instance: PlayerState | null = null;

  // Persistent
  totalCoins: number;
  spentCoins: number;
  currentLevel: number;
  unlockedCharacters: string[];
  selectedCharacter: string;

  // Session (reset on new game / level)
  lives = 1;
  sessionCoins = 0;

  private constructor(data: SaveData) {
    this.totalCoins = data.totalCoins;
    this.spentCoins = data.spentCoins;
    this.currentLevel = data.currentLevel;
    this.unlockedCharacters = data.unlockedCharacters;
    this.selectedCharacter = data.selectedCharacter;
  }

  static get instance(): PlayerState {
    if (!PlayerState._instance) {
      const raw = localStorage.getItem(SAVE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const data: SaveData = parsed
        ? { ...DEFAULT_SAVE, ...parsed }
        : { ...DEFAULT_SAVE };

      // Migration: older saves auto-unlocked characters without spending coins.
      // If spentCoins is missing and extra characters were unlocked, reset to
      // the intended spend-based model (only explorer unlocked initially).
      if (parsed && typeof parsed.spentCoins !== "number") {
        data.spentCoins = 0;
        data.unlockedCharacters = ["explorer"];
        if (data.selectedCharacter !== "explorer") {
          data.selectedCharacter = "explorer";
        }
      }
      PlayerState._instance = new PlayerState(data);
      PlayerState._instance.save();
    }
    return PlayerState._instance;
  }

  get availableCoins(): number {
    // Spend model uses totalCoins as wallet balance shown to player.
    return this.totalCoins;
  }

  /** Call when the player collects a coin. */
  addCoin(): string | null {
    this.sessionCoins++;
    this.totalCoins++;
    this.save(); // Always save so coins persist
    return null;
  }

  canUnlockCharacter(key: string): boolean {
    if (this.unlockedCharacters.includes(key)) return false;
    const char = CharacterRegistry.get(key);
    if (!char) return false;
    return this.availableCoins >= char.milestoneCoins;
  }

  unlockCharacter(key: string): boolean {
    if (!this.canUnlockCharacter(key)) return false;
    const char = CharacterRegistry.get(key);
    if (!char) return false;

    this.totalCoins = Math.max(0, this.totalCoins - char.milestoneCoins);
    this.spentCoins += char.milestoneCoins;
    this.unlockedCharacters.push(key);
    this.save();
    return true;
  }

  /** Finalize session coins at end of level. Call when game ends or level completes. */
  finalizeSessionCoins(): void {
    // Session coins already added to total by addCoin() calls during gameplay
    // Just ensure they're saved
    this.save();
  }

  advanceLevel(): void {
    this.currentLevel++;
    this.sessionCoins = 0;
    this.save();
  }

  resetSession(): void {
    this.lives = 3;
    this.sessionCoins = 0;
  }

  save(): void {
    const data: SaveData = {
      totalCoins: this.totalCoins,
      spentCoins: this.spentCoins,
      currentLevel: this.currentLevel,
      unlockedCharacters: this.unlockedCharacters,
      selectedCharacter: this.selectedCharacter,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }

  /** Reset everything for a new game */
  static reset(): void {
    localStorage.removeItem(SAVE_KEY);
    PlayerState._instance = null;
  }
}

// ─── Character Registry ───────────────────────────────────────────────────────

export interface CharacterDef {
  key: string;
  label: string;
  bodyColor: string;
  eyeColor: string;
  legColor: string;
  milestoneCoins: number;
}

export class CharacterRegistry {
  static readonly CHARACTERS: CharacterDef[] = [
    {
      key: "explorer",
      label: "White",
      bodyColor: "#dfe7f2",
      eyeColor: "#30303a",
      legColor: "#9aa9bd",
      milestoneCoins: 0,
    },
    {
      key: "knight",
      label: "Blue",
      bodyColor: "#35a7ff",
      eyeColor: "#ffffff",
      legColor: "#1d5f99",
      milestoneCoins: 500,
    },
    {
      key: "mage",
      label: "Pink",
      bodyColor: "#ff6fcb",
      eyeColor: "#ffffff",
      legColor: "#a84b89",
      milestoneCoins: 1000,
    },
    {
      key: "robot",
      label: "Pink+",
      bodyColor: "#f25ebf",
      eyeColor: "#ffffff",
      legColor: "#8f3f72",
      milestoneCoins: 1500,
    },
  ];

  static get(key: string): CharacterDef | undefined {
    return this.CHARACTERS.find((c) => c.key === key);
  }

  static getByIndex(i: number): CharacterDef | undefined {
    return this.CHARACTERS[i];
  }
}

// ─── Level Registry ───────────────────────────────────────────────────────────

export interface LevelDef {
  id: number;
  label: string;
  enemySpeed: number; // multiplier on ENEMY_BASE_SPEED
  coinCount: number;
  platformRows: number; // complexity hint for ObjectSpawner
}

export class LevelRegistry {
  static readonly LEVELS: LevelDef[] = [
    {
      id: 1,
      label: "Greenhill",
      enemySpeed: 1.0,
      coinCount: 12,
      platformRows: 3,
    },
    {
      id: 2,
      label: "Dustlands",
      enemySpeed: 1.3,
      coinCount: 16,
      platformRows: 4,
    },
    {
      id: 3,
      label: "Crystal Cave",
      enemySpeed: 1.6,
      coinCount: 20,
      platformRows: 5,
    },
    {
      id: 4,
      label: "Sky Bridge",
      enemySpeed: 2.0,
      coinCount: 24,
      platformRows: 6,
    },
  ];

  static get(id: number): LevelDef {
    return (
      this.LEVELS.find((l) => l.id === id) ??
      this.LEVELS[this.LEVELS.length - 1]
    );
  }

  static get maxLevel(): number {
    return this.LEVELS.length;
  }
}
