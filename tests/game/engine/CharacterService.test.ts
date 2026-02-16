import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { CharacterService } from "@game/engine/CharacterService";
import { openDatabase, closeDatabase } from "@main/database/connection";
import { runMigrations } from "@main/database/migrator";
import { ClassName, RaceName } from "@shared/enums";
import type Database from "better-sqlite3";

describe("CharacterService", () => {
  let db: Database.Database;
  let service: CharacterService;

  beforeEach(() => {
    // Create in-memory SQLite database
    db = openDatabase(":memory:");
    runMigrations(db);
    service = new CharacterService(db);
  });

  afterEach(() => {
    closeDatabase(db);
  });

  describe("createCharacter", () => {
    test("creates a valid character with initial state", async () => {
      const character = await service.createCharacter(
        "TestWarrior",
        RaceName.Human,
        ClassName.Warrior
      );

      expect(character.id).toBeGreaterThan(0);
      expect(character.name).toBe("TestWarrior");
      expect(character.race).toBe(RaceName.Human);
      expect(character.className).toBe(ClassName.Warrior);
      expect(character.level).toBe(1);
      expect(character.xp).toBe(0);
      expect(character.restedXp).toBe(0);
      expect(character.gold).toBe(0);
      expect(character.currentZone).toBe("greenhollow_vale");
      expect(character.activity).toBe("idle");
      expect(character.activeSpec).toBeTruthy(); // Should have a default spec
      expect(character.equipment).toBeDefined();
      expect(character.stats).toBeDefined();
      expect(character.createdAt).toBeGreaterThan(0);
      expect(character.lastPlayedAt).toBeGreaterThan(0);
    });

    test("creates characters with different races and classes", async () => {
      const mage = await service.createCharacter("MageTest", RaceName.Elf, ClassName.Mage);
      const rogue = await service.createCharacter("RogueTest", RaceName.Orc, ClassName.Rogue);

      expect(mage.className).toBe(ClassName.Mage);
      expect(mage.race).toBe(RaceName.Elf);
      expect(rogue.className).toBe(ClassName.Rogue);
      expect(rogue.race).toBe(RaceName.Orc);
    });

    test("initializes equipment with all slots empty", async () => {
      const character = await service.createCharacter(
        "TestChar",
        RaceName.Dwarf,
        ClassName.Cleric
      );

      expect(character.equipment.head).toBeNull();
      expect(character.equipment.chest).toBeNull();
      expect(character.equipment.main_hand).toBeNull();
      expect(character.equipment.off_hand).toBeNull();
    });

    test("rejects name that is too short", async () => {
      await expect(
        service.createCharacter("X", RaceName.Human, ClassName.Warrior)
      ).rejects.toThrow(/2-16 characters/);
    });

    test("rejects name that is too long", async () => {
      await expect(
        service.createCharacter("ThisNameIsWayTooLong", RaceName.Human, ClassName.Warrior)
      ).rejects.toThrow(/2-16 characters/);
    });

    test("rejects name with invalid characters", async () => {
      await expect(
        service.createCharacter("Test@Name!", RaceName.Human, ClassName.Warrior)
      ).rejects.toThrow(/letters, numbers, and spaces/);
    });

    test("rejects invalid race", async () => {
      await expect(
        service.createCharacter("Test", "invalid_race" as RaceName, ClassName.Warrior)
      ).rejects.toThrow(/Invalid race/);
    });

    test("rejects invalid class", async () => {
      await expect(
        service.createCharacter("Test", RaceName.Human, "invalid_class" as ClassName)
      ).rejects.toThrow(/Invalid class/);
    });
  });

  describe("loadCharacter", () => {
    test("loads a character by ID", async () => {
      const created = await service.createCharacter(
        "LoadTest",
        RaceName.Troll,
        ClassName.Shaman
      );

      const loaded = await service.loadCharacter(created.id);

      expect(loaded).not.toBeNull();
      expect(loaded!.id).toBe(created.id);
      expect(loaded!.name).toBe("LoadTest");
      expect(loaded!.race).toBe(RaceName.Troll);
      expect(loaded!.className).toBe(ClassName.Shaman);
    });

    test("returns null for non-existent character", async () => {
      const loaded = await service.loadCharacter(999);
      expect(loaded).toBeNull();
    });
  });

  describe("loadAllCharacters", () => {
    test("loads all characters", async () => {
      await service.createCharacter("Char1", RaceName.Human, ClassName.Warrior);
      await service.createCharacter("Char2", RaceName.Elf, ClassName.Mage);
      await service.createCharacter("Char3", RaceName.Orc, ClassName.Rogue);

      const all = await service.loadAllCharacters();

      expect(all).toHaveLength(3);
      expect(all.map(c => c.name)).toContain("Char1");
      expect(all.map(c => c.name)).toContain("Char2");
      expect(all.map(c => c.name)).toContain("Char3");
    });

    test("returns empty array when no characters exist", async () => {
      const all = await service.loadAllCharacters();
      expect(all).toEqual([]);
    });
  });

  describe("saveCharacter", () => {
    test("saves modified character state and persists changes", async () => {
      const character = await service.createCharacter(
        "SaveTest",
        RaceName.Undead,
        ClassName.Necromancer
      );

      // Modify state
      character.level = 5;
      character.xp = 1234;
      character.gold = 500;
      character.activity = "grinding";

      // Save
      await service.saveCharacter(character);

      // Reload and verify
      const reloaded = await service.loadCharacter(character.id);
      expect(reloaded!.level).toBe(5);
      expect(reloaded!.xp).toBe(1234);
      expect(reloaded!.gold).toBe(500);
      expect(reloaded!.activity).toBe("grinding");
    });

    test("preserves JSON fields after round-trip", async () => {
      const character = await service.createCharacter(
        "JsonTest",
        RaceName.Dwarf,
        ClassName.Warrior
      );

      // Modify JSON fields
      character.talentPoints = {
        protection: { talent_shield_wall: 5, talent_last_stand: 3 } as any,
      };
      character.companionClears = { dungeon_deadmines: 10 };

      await service.saveCharacter(character);

      const reloaded = await service.loadCharacter(character.id);
      expect(reloaded!.talentPoints).toEqual(character.talentPoints);
      expect(reloaded!.companionClears).toEqual(character.companionClears);
    });
  });

  describe("deleteCharacter", () => {
    test("deletes a character by ID", async () => {
      const character = await service.createCharacter(
        "DeleteTest",
        RaceName.Human,
        ClassName.Ranger
      );

      await service.deleteCharacter(character.id);

      const loaded = await service.loadCharacter(character.id);
      expect(loaded).toBeNull();
    });

    test("loadAllCharacters does not include deleted character", async () => {
      const char1 = await service.createCharacter("Keep", RaceName.Elf, ClassName.Druid);
      const char2 = await service.createCharacter("Delete", RaceName.Orc, ClassName.Warrior);

      await service.deleteCharacter(char2.id);

      const all = await service.loadAllCharacters();
      expect(all).toHaveLength(1);
      expect(all[0].name).toBe("Keep");
    });
  });

  describe("round-trip persistence", () => {
    test("create → save → load → verify all fields match", async () => {
      const original = await service.createCharacter(
        "RoundTrip",
        RaceName.Troll,
        ClassName.Shaman
      );

      // Modify extensively
      original.level = 10;
      original.xp = 5000;
      original.restedXp = 200;
      original.gold = 1500;
      original.currentZone = "darkwood_forest" as any;
      original.activity = "questing";
      original.talentPoints = { elemental: { talent_lightning_bolt: 5 } as any };
      original.equipment.main_hand = 12345;
      original.companionClears = { dungeon_wailing_caverns: 3 };

      await service.saveCharacter(original);

      const loaded = await service.loadCharacter(original.id);

      expect(loaded!.id).toBe(original.id);
      expect(loaded!.name).toBe(original.name);
      expect(loaded!.race).toBe(original.race);
      expect(loaded!.className).toBe(original.className);
      expect(loaded!.level).toBe(original.level);
      expect(loaded!.xp).toBe(original.xp);
      expect(loaded!.restedXp).toBe(original.restedXp);
      expect(loaded!.gold).toBe(original.gold);
      expect(loaded!.currentZone).toBe(original.currentZone);
      expect(loaded!.activity).toBe(original.activity);
      expect(loaded!.talentPoints).toEqual(original.talentPoints);
      expect(loaded!.equipment).toEqual(original.equipment);
      expect(loaded!.companionClears).toEqual(original.companionClears);
    });
  });
});
