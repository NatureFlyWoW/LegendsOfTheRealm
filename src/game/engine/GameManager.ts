// src/game/engine/GameManager.ts
import { Kysely } from "kysely";
import type { DatabaseSchema } from "@main/database/schema";
import type { CharacterState, ZoneId, ItemId } from "@shared/types";
import type { ClassName, RaceName, GearSlot } from "@shared/enums";
import { ActivityType } from "@shared/enums";
import { EventBus } from "./EventBus";
import { CharacterService } from "./CharacterService";
import { InventoryService } from "./InventoryService";
import { ProgressionService } from "./ProgressionService";
import { LootService } from "./LootService";
import { QuestTracker } from "./QuestTracker";
import { ActivityManager, type ActivityTickResult } from "./ActivityManager";
import { SeededRng } from "@game/rng/SeededRng";
import type Database from "better-sqlite3";

// ============================================================
// Command & Query Types (IPC protocol)
// ============================================================

export type EngineCommand =
  | { type: "create_character"; name: string; race: RaceName; className: ClassName }
  | { type: "delete_character"; characterId: number }
  | { type: "select_character"; characterId: number }
  | { type: "start_grinding"; characterId: number; zoneId: ZoneId }
  | { type: "stop_activity"; characterId: number }
  | { type: "equip_item"; characterId: number; bagSlot: number }
  | { type: "unequip_item"; characterId: number; gearSlot: GearSlot };

export type EngineQuery =
  | { type: "get_character_roster" }
  | { type: "get_active_character_id" }
  | { type: "get_character"; characterId: number };

// ============================================================
// GameManager — Central Engine Coordinator
// ============================================================

/**
 * GameManager coordinates all engine services and handles IPC commands/queries.
 *
 * Responsibilities:
 * - Initialize all services (CharacterService, InventoryService, etc.)
 * - Load character roster from database
 * - Route game loop ticks to active character's ActivityManager
 * - Dispatch commands to appropriate services
 * - Auto-save dirty state periodically
 */
export class GameManager {
  private characterService: CharacterService;
  private inventoryService: InventoryService;
  private progressionService: ProgressionService;
  private lootService: LootService;
  private questTracker: QuestTracker;
  private activityManager: ActivityManager;
  private rng: SeededRng;

  private characterRoster: CharacterState[] = [];
  private activeCharacterId: number | null = null;
  private dirtyCharacters = new Set<number>();
  private ticksSinceLastSave = 0;
  private readonly AUTO_SAVE_INTERVAL = 60; // Save every 60 ticks (1 minute)
  private lastTickResult: ActivityTickResult | null = null;

  constructor(
    private db: Database.Database,
    private eventBus: EventBus
  ) {
    this.characterService = new CharacterService(db);
    this.inventoryService = new InventoryService();
    this.progressionService = new ProgressionService(eventBus);
    this.lootService = new LootService();
    this.questTracker = new QuestTracker(eventBus);
    this.activityManager = new ActivityManager(
      eventBus,
      this.progressionService,
      this.lootService,
      this.questTracker
    );
    // Initialize RNG with a seed (can be loaded from database in production)
    this.rng = new SeededRng(Date.now());
  }

  /**
   * Initialize the game manager — load character roster from database.
   */
  async initialize(): Promise<void> {
    this.characterRoster = await this.characterService.loadAllCharacters();
  }

  /**
   * Called by GameLoop on each tick.
   * Routes tick to active character's ActivityManager.
   */
  onTick(tickNumber: number): void {
    if (this.activeCharacterId === null) {
      return;
    }

    const character = this.characterRoster.find(
      (c) => c.id === this.activeCharacterId
    );

    if (!character) {
      return;
    }

    // Process activity tick and store result for GameBridge to forward
    const result = this.activityManager.onTick(character, this.rng, tickNumber);
    this.lastTickResult = result;

    // Apply character updates from the result
    if (result.characterUpdates) {
      Object.assign(character, result.characterUpdates);
      this.dirtyCharacters.add(character.id);
    }

    // Add loot items to character's bags
    if (result.loot && result.loot.items.length > 0) {
      for (const item of result.loot.items) {
        const nextSlot = this.findNextBagSlot(character);
        if (nextSlot !== -1) {
          item.bagSlot = nextSlot;
          character.bags.push(item);
        }
        // If no slots available, loot is lost (bag full)
      }
    }

    // Mark character as dirty if anything changed
    if (result.events.length > 0 || result.mobKilled || result.loot || result.questUpdate) {
      this.dirtyCharacters.add(character.id);
    }

    // Auto-save periodically
    this.ticksSinceLastSave++;
    if (this.ticksSinceLastSave >= this.AUTO_SAVE_INTERVAL) {
      this.saveAllDirty();
      this.ticksSinceLastSave = 0;
    }
  }

  /**
   * Handle a command from IPC.
   */
  async handleCommand(cmd: EngineCommand): Promise<any> {
    switch (cmd.type) {
      case "create_character": {
        const character = await this.characterService.createCharacter(
          cmd.name,
          cmd.race,
          cmd.className
        );
        this.characterRoster.push(character);
        return { success: true, character };
      }

      case "delete_character": {
        await this.characterService.deleteCharacter(cmd.characterId);
        this.characterRoster = this.characterRoster.filter(
          (c) => c.id !== cmd.characterId
        );
        if (this.activeCharacterId === cmd.characterId) {
          this.activeCharacterId = null;
        }
        return { success: true };
      }

      case "select_character": {
        const character = this.characterRoster.find(
          (c) => c.id === cmd.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${cmd.characterId}`);
        }
        this.activeCharacterId = cmd.characterId;
        return { success: true };
      }

      case "start_grinding": {
        const character = this.characterRoster.find(
          (c) => c.id === cmd.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${cmd.characterId}`);
        }
        this.activityManager.startZoneGrinding(character, cmd.zoneId);
        this.dirtyCharacters.add(character.id);
        return { success: true };
      }

      case "stop_activity": {
        const character = this.characterRoster.find(
          (c) => c.id === cmd.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${cmd.characterId}`);
        }
        this.activityManager.stopGrinding(character.id);
        this.dirtyCharacters.add(character.id);
        return { success: true };
      }

      case "equip_item": {
        const character = this.characterRoster.find(
          (c) => c.id === cmd.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${cmd.characterId}`);
        }
        // TODO: Get item from database and item definition
        // For now, this is a stub
        this.dirtyCharacters.add(character.id);
        return { success: true };
      }

      case "unequip_item": {
        const character = this.characterRoster.find(
          (c) => c.id === cmd.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${cmd.characterId}`);
        }
        const updatedCharacter = this.inventoryService.unequipItem(
          character,
          cmd.gearSlot
        );
        // Copy updated state back
        Object.assign(character, updatedCharacter);
        this.dirtyCharacters.add(character.id);
        return { success: true };
      }

      default:
        throw new Error(`Unknown command type`);
    }
  }

  /**
   * Handle a query from IPC.
   */
  async handleQuery(query: EngineQuery): Promise<any> {
    switch (query.type) {
      case "get_character_roster":
        return { roster: this.characterRoster };

      case "get_active_character_id":
        return { activeCharacterId: this.activeCharacterId };

      case "get_character": {
        const character = this.characterRoster.find(
          (c) => c.id === query.characterId
        );
        if (!character) {
          throw new Error(`Character not found: ${query.characterId}`);
        }
        return { character };
      }

      default:
        throw new Error(`Unknown query type`);
    }
  }

  /**
   * Get the current character roster.
   */
  getCharacterRoster(): CharacterState[] {
    return this.characterRoster;
  }

  /**
   * Get the active character ID.
   */
  getActiveCharacterId(): number | null {
    return this.activeCharacterId;
  }

  /**
   * Get and consume the last tick result (for GameBridge to forward combat events).
   */
  getLastTickResult(): ActivityTickResult | null {
    const result = this.lastTickResult;
    this.lastTickResult = null;
    return result;
  }

  /**
   * Find the next available bag slot for a character.
   */
  private findNextBagSlot(character: CharacterState): number {
    const usedSlots = new Set(
      character.bags
        .filter(i => i.bagSlot !== null)
        .map(i => i.bagSlot)
    );
    for (let i = 0; i < 16; i++) {
      if (!usedSlots.has(i)) return i;
    }
    return -1;
  }

  /**
   * Save all dirty characters to the database.
   */
  private async saveAllDirty(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const characterId of this.dirtyCharacters) {
      const character = this.characterRoster.find((c) => c.id === characterId);
      if (character) {
        promises.push(this.characterService.saveCharacter(character));
      }
    }
    await Promise.all(promises);
    this.dirtyCharacters.clear();
  }

  /**
   * Force save all dirty characters (for testing).
   */
  async forceSave(): Promise<void> {
    await this.saveAllDirty();
  }
}
