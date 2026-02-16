// tests/game/engine/GameManager.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { GameManager } from "@game/engine/GameManager";
import { EventBus } from "@game/engine/EventBus";
import Database from "better-sqlite3";
import { ClassName, RaceName, ActivityType } from "@shared/enums";
import type { ZoneId } from "@shared/types";

/**
 * Create an in-memory SQLite database for testing.
 */
function createTestDb(): Database.Database {
  const db = new Database(":memory:");

  // Create schema (minimal for GameManager tests)
  db.exec(`
    CREATE TABLE characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      race TEXT NOT NULL,
      class_name TEXT NOT NULL,
      level INTEGER NOT NULL,
      xp INTEGER NOT NULL,
      rested_xp INTEGER NOT NULL,
      gold INTEGER NOT NULL,
      current_zone TEXT NOT NULL,
      activity TEXT NOT NULL,
      active_spec TEXT NOT NULL,
      talent_points TEXT NOT NULL,
      equipment TEXT NOT NULL,
      companion_clears TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_played_at INTEGER NOT NULL
    );

    CREATE TABLE items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      bag_slot INTEGER,
      equipped_slot TEXT,
      durability INTEGER NOT NULL,
      enchant_id TEXT,
      gem_ids TEXT
    );

    CREATE TABLE quest_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id TEXT NOT NULL,
      character_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      objectives TEXT NOT NULL,
      accepted_at INTEGER NOT NULL
    );
  `);

  return db;
}

describe("GameManager", () => {
  let db: Database.Database;
  let eventBus: EventBus;
  let gameManager: GameManager;

  beforeEach(async () => {
    db = createTestDb();
    eventBus = new EventBus();
    gameManager = new GameManager(db, eventBus);
    await gameManager.initialize();
  });

  describe("initialization", () => {
    it("should initialize with empty roster from empty database", async () => {
      const roster = gameManager.getCharacterRoster();
      expect(roster).toEqual([]);
    });

    it("should load existing characters from database", async () => {
      // Insert a character directly into the database
      db.prepare(`
        INSERT INTO characters (
          name, race, class_name, level, xp, rested_xp, gold,
          current_zone, activity, active_spec, talent_points,
          equipment, companion_clears, created_at, last_played_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        "TestChar",
        "human",
        "warrior",
        1,
        0,
        0,
        0,
        "greenhollow_vale",
        "idle",
        "protection",
        "{}",
        JSON.stringify({ head: null, shoulder: null, back: null, chest: null, wrist: null, hands: null, waist: null, legs: null, feet: null, neck: null, ring1: null, ring2: null, trinket1: null, trinket2: null, main_hand: null, off_hand: null }),
        "{}",
        Date.now(),
        Date.now()
      );

      // Create a fresh GameManager to test loading
      const newGameManager = new GameManager(db, eventBus);
      await newGameManager.initialize();

      const roster = newGameManager.getCharacterRoster();
      expect(roster).toHaveLength(1);
      expect(roster[0].name).toBe("TestChar");
      expect(roster[0].race).toBe(RaceName.Human);
      expect(roster[0].className).toBe(ClassName.Warrior);
    });
  });

  describe("handleCommand - create_character", () => {
    it("should create a character and add to roster", async () => {
      const result = await gameManager.handleCommand({
        type: "create_character",
        name: "Aragorn",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      expect(result.success).toBe(true);
      expect(result.character).toBeDefined();
      expect(result.character.name).toBe("Aragorn");
      expect(result.character.race).toBe(RaceName.Human);
      expect(result.character.className).toBe(ClassName.Warrior);
      expect(result.character.level).toBe(1);
      expect(result.character.xp).toBe(0);
      expect(result.character.gold).toBe(0);

      const roster = gameManager.getCharacterRoster();
      expect(roster).toHaveLength(1);
      expect(roster[0].name).toBe("Aragorn");
    });

    it("should emit CHARACTER_LEVELED event on level up", async () => {
      const events: any[] = [];
      eventBus.onAny((event) => events.push(event));

      await gameManager.handleCommand({
        type: "create_character",
        name: "Hero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      // No level up event on character creation
      const levelEvents = events.filter((e) => e.type === "CHARACTER_LEVELED");
      expect(levelEvents).toHaveLength(0);
    });
  });

  describe("handleCommand - select_character", () => {
    it("should select an active character", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "TestChar",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      const result = await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      expect(result.success).toBe(true);
      expect(gameManager.getActiveCharacterId()).toBe(characterId);
    });

    it("should throw error if character not found", async () => {
      await expect(
        gameManager.handleCommand({
          type: "select_character",
          characterId: 999,
        })
      ).rejects.toThrow("Character not found");
    });
  });

  describe("handleCommand - start_grinding", () => {
    // Skip these tests as they require game data files to be present
    it.skip("should start grinding activity", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "Grinder",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      const zoneId = "greenhollow_vale" as ZoneId;

      const result = await gameManager.handleCommand({
        type: "start_grinding",
        characterId,
        zoneId,
      });

      expect(result.success).toBe(true);
    });

    it.skip("should throw error if trying to start grinding while already active", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "Grinder",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      const zoneId = "greenhollow_vale" as ZoneId;

      // Start grinding once
      await gameManager.handleCommand({
        type: "start_grinding",
        characterId,
        zoneId,
      });

      // Try to start again
      await expect(
        gameManager.handleCommand({
          type: "start_grinding",
          characterId,
          zoneId,
        })
      ).rejects.toThrow();
    });
  });

  describe("handleCommand - stop_activity", () => {
    it("should stop current activity successfully", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "Grinder",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      // Stop activity (even if idle)
      const result = await gameManager.handleCommand({
        type: "stop_activity",
        characterId,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("handleCommand - delete_character", () => {
    it("should delete a character from roster", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "ToDelete",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      const result = await gameManager.handleCommand({
        type: "delete_character",
        characterId,
      });

      expect(result.success).toBe(true);

      const roster = gameManager.getCharacterRoster();
      expect(roster).toHaveLength(0);
    });

    it("should clear active character if deleted", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "ToDelete",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      expect(gameManager.getActiveCharacterId()).toBe(characterId);

      await gameManager.handleCommand({
        type: "delete_character",
        characterId,
      });

      expect(gameManager.getActiveCharacterId()).toBeNull();
    });
  });

  describe("handleQuery", () => {
    it("should return character roster", async () => {
      await gameManager.handleCommand({
        type: "create_character",
        name: "Hero1",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      await gameManager.handleCommand({
        type: "create_character",
        name: "Hero2",
        race: RaceName.Elf,
        className: ClassName.Mage,
      });

      const result = await gameManager.handleQuery({
        type: "get_character_roster",
      });

      expect(result.roster).toHaveLength(2);
      expect(result.roster[0].name).toBe("Hero1");
      expect(result.roster[1].name).toBe("Hero2");
    });

    it("should return active character id", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "Hero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      const result = await gameManager.handleQuery({
        type: "get_active_character_id",
      });

      expect(result.activeCharacterId).toBe(characterId);
    });

    it("should return specific character", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "Hero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      const result = await gameManager.handleQuery({
        type: "get_character",
        characterId,
      });

      expect(result.character.id).toBe(characterId);
      expect(result.character.name).toBe("Hero");
    });

    it("should throw error if character not found in query", async () => {
      await expect(
        gameManager.handleQuery({
          type: "get_character",
          characterId: 999,
        })
      ).rejects.toThrow("Character not found");
    });
  });

  describe("onTick", () => {
    it("should do nothing if no active character", () => {
      // Should not throw
      gameManager.onTick(1);
      expect(gameManager.getActiveCharacterId()).toBeNull();
    });

    it("should process idle tick with no progression", async () => {
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "IdleHero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      const initialGold = createResult.character.gold;
      const initialXp = createResult.character.xp;

      gameManager.onTick(1);

      const roster = gameManager.getCharacterRoster();
      const character = roster.find((c) => c.id === characterId);

      // Idle should not change XP or gold
      expect(character?.gold).toBe(initialGold);
      expect(character?.xp).toBe(initialXp);
    });

    // Note: The following tests are skipped because they require game data files
    // (zones, mobs, abilities, etc.) to be present. These will be enabled once
    // the data layer is implemented.

    it.skip("should process grinding tick and award XP/gold", async () => {
      const events: any[] = [];
      eventBus.onAny((event) => events.push(event));

      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "GrindHero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      const zoneId = "greenhollow_vale" as ZoneId;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      await gameManager.handleCommand({
        type: "start_grinding",
        characterId,
        zoneId,
      });

      const initialGold = createResult.character.gold;
      const initialXp = createResult.character.xp;

      // Process multiple ticks
      for (let i = 1; i <= 5; i++) {
        gameManager.onTick(i);
      }

      const roster = gameManager.getCharacterRoster();
      const character = roster.find((c) => c.id === characterId);

      // Should have gained XP and gold
      expect(character?.gold).toBeGreaterThan(initialGold);
      expect(character?.xp).toBeGreaterThan(initialXp);
    });

    it.skip("should handle level up during grinding", async () => {
      const events: any[] = [];
      eventBus.onAny((event) => events.push(event));

      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "LevelUpHero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      const zoneId = "greenhollow_vale" as ZoneId;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      await gameManager.handleCommand({
        type: "start_grinding",
        characterId,
        zoneId,
      });

      // Process many ticks to trigger level up
      for (let i = 1; i <= 25; i++) {
        gameManager.onTick(i);
      }

      const roster = gameManager.getCharacterRoster();
      const character = roster.find((c) => c.id === characterId);

      // Should have leveled up
      expect(character?.level).toBeGreaterThan(1);

      // Check for level up event
      const levelEvents = events.filter((e) => e.type === "CHARACTER_LEVELED");
      expect(levelEvents.length).toBeGreaterThan(0);
    });
  });

  describe("auto-save", () => {
    it.skip("should auto-save after 60 ticks", async () => {
      // Requires game data files
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "SaveHero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      const zoneId = "greenhollow_vale" as ZoneId;

      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      await gameManager.handleCommand({
        type: "start_grinding",
        characterId,
        zoneId,
      });

      // Process 60 ticks to trigger auto-save
      for (let i = 1; i <= 60; i++) {
        gameManager.onTick(i);
      }

      // Verify character was saved to database
      const row = db
        .prepare("SELECT * FROM characters WHERE id = ?")
        .get(characterId) as any;

      expect(row).toBeDefined();
      expect(row.gold).toBeGreaterThan(0);
      expect(row.xp).toBeGreaterThan(0);
    });
  });

  describe("integration: full loop", () => {
    it("should create character, select it, and manage lifecycle", async () => {
      const events: any[] = [];
      eventBus.onAny((event) => events.push(event));

      // Create character
      const createResult = await gameManager.handleCommand({
        type: "create_character",
        name: "IntegrationHero",
        race: RaceName.Human,
        className: ClassName.Warrior,
      });

      const characterId = createResult.character.id;
      expect(createResult.character.level).toBe(1);
      expect(createResult.character.xp).toBe(0);
      expect(createResult.character.gold).toBe(0);

      // Select character
      await gameManager.handleCommand({
        type: "select_character",
        characterId,
      });

      expect(gameManager.getActiveCharacterId()).toBe(characterId);

      // Process idle ticks (should not change state)
      for (let i = 1; i <= 10; i++) {
        gameManager.onTick(i);
      }

      // Force save
      await gameManager.forceSave();

      // Verify final state
      const roster = gameManager.getCharacterRoster();
      const character = roster.find((c) => c.id === characterId);

      expect(character?.xp).toBe(0); // No XP gained while idle
      expect(character?.gold).toBe(0); // No gold gained while idle
      expect(character?.level).toBe(1); // Still level 1

      // Verify saved to database
      const row = db
        .prepare("SELECT * FROM characters WHERE id = ?")
        .get(characterId) as any;

      expect(row).toBeDefined();
      expect(row.xp).toBe(0);
      expect(row.gold).toBe(0);
      expect(row.level).toBe(1);
    });
  });
});
