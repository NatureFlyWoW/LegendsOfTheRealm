import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SaveManager } from "@game/engine/SaveManager";
import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

describe("SaveManager", () => {
  let saveManager: SaveManager;
  let testDir: string;

  beforeEach(() => {
    saveManager = new SaveManager();
    // Create unique temp directory for each test
    testDir = join(tmpdir(), `test-save-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    saveManager.close();
    // Clean up temp directory
    if (existsSync(testDir)) {
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch (error) {
        // Ignore cleanup errors (Windows file locking)
      }
    }
  });

  describe("getSavePath", () => {
    it("returns a valid platform-specific save directory path", () => {
      const savePath = saveManager.getSavePath();
      expect(savePath).toBeTruthy();
      expect(savePath).toContain("LegendsOfTheShatteredRealm");
    });
  });

  describe("createSave", () => {
    it("creates a new save file and runs migrations", () => {
      const saveName = "test-save";
      const db = saveManager.createSave(saveName, testDir);

      expect(db).toBeTruthy();
      expect(existsSync(join(testDir, `${saveName}.db`))).toBe(true);

      // Verify migrations ran
      const version = db.prepare("SELECT version FROM _migrations ORDER BY rowid DESC LIMIT 1").get() as { version: string };
      expect(version.version).toBeTruthy();

      // Verify save_metadata was created
      const metadata = db.prepare("SELECT * FROM save_metadata").get() as { save_name: string; version: string; created_at: number; last_saved_at: number; total_playtime_seconds: number };
      expect(metadata.save_name).toBe(saveName);
      expect(metadata.version).toBe(version.version);
      expect(metadata.created_at).toBeGreaterThan(0);
      expect(metadata.last_saved_at).toBeGreaterThan(0);
      expect(metadata.total_playtime_seconds).toBe(0);
    });

    it("throws if save file already exists", () => {
      const saveName = "duplicate-save";
      saveManager.createSave(saveName, testDir);
      saveManager.close();

      const saveManager2 = new SaveManager();
      expect(() => saveManager2.createSave(saveName, testDir)).toThrow(/already exists/);
      saveManager2.close();
    });
  });

  describe("openSave", () => {
    it("opens an existing save file and validates integrity", () => {
      const saveName = "existing-save";
      const filePath = join(testDir, `${saveName}.db`);

      // Create save
      saveManager.createSave(saveName, testDir);
      saveManager.close();

      // Open save
      const saveManager2 = new SaveManager();
      const db = saveManager2.openSave(filePath);

      expect(db).toBeTruthy();

      // Verify can read metadata
      const metadata = db.prepare("SELECT * FROM save_metadata").get() as { save_name: string };
      expect(metadata.save_name).toBe(saveName);

      saveManager2.close();
    });

    it("throws if save file not found", () => {
      const saveManager2 = new SaveManager();
      expect(() => saveManager2.openSave(join(testDir, "nonexistent.db"))).toThrow(/not found/);
      saveManager2.close();
    });

    it("throws if save file is corrupted", () => {
      const filePath = join(testDir, "corrupted.db");

      // Create a non-database file
      const fs = require("fs");
      fs.writeFileSync(filePath, "This is not a valid SQLite database file");

      // Try to open
      const saveManager2 = new SaveManager();
      expect(() => saveManager2.openSave(filePath)).toThrow(/corrupted/);
      saveManager2.close();
    });
  });

  describe("backupSave", () => {
    it("creates a .bak copy of the save file", () => {
      const saveName = "backup-test";
      const filePath = join(testDir, `${saveName}.db`);

      saveManager.createSave(saveName, testDir);
      saveManager.close();

      const backupPath = saveManager.backupSave(filePath);

      expect(backupPath).toBe(filePath + ".bak");
      expect(existsSync(backupPath)).toBe(true);
    });

    it("throws if save file not found", () => {
      expect(() => saveManager.backupSave(join(testDir, "nonexistent.db"))).toThrow(/not found/);
    });
  });

  describe("listSaves", () => {
    it("returns .db files in the directory", () => {
      saveManager.createSave("save1", testDir);
      saveManager.close();

      const saveManager2 = new SaveManager();
      saveManager2.createSave("save2", testDir);
      saveManager2.close();

      const saves = saveManager.listSaves(testDir);

      expect(saves).toHaveLength(2);
      expect(saves.some(s => s.includes("save1.db"))).toBe(true);
      expect(saves.some(s => s.includes("save2.db"))).toBe(true);
    });

    it("returns empty array if directory does not exist", () => {
      const saves = saveManager.listSaves(join(testDir, "nonexistent"));
      expect(saves).toEqual([]);
    });

    it("excludes non-.db files", () => {
      const fs = require("fs");
      fs.writeFileSync(join(testDir, "test.txt"), "not a db");
      fs.writeFileSync(join(testDir, "test.db.bak"), "backup");

      saveManager.createSave("real-save", testDir);
      saveManager.close();

      const saves = saveManager.listSaves(testDir);

      expect(saves).toHaveLength(1);
      expect(saves[0]).toContain("real-save.db");
    });
  });

  describe("round-trip", () => {
    it("create → close → open → read metadata → matches", () => {
      const saveName = "round-trip-test";
      const filePath = join(testDir, `${saveName}.db`);

      // Create
      const db1 = saveManager.createSave(saveName, testDir);
      const metadata1 = db1.prepare("SELECT * FROM save_metadata").get() as { save_name: string; version: string; created_at: number };
      saveManager.close();

      // Open
      const saveManager2 = new SaveManager();
      const db2 = saveManager2.openSave(filePath);
      const metadata2 = db2.prepare("SELECT * FROM save_metadata").get() as { save_name: string; version: string; created_at: number };

      expect(metadata2.save_name).toBe(metadata1.save_name);
      expect(metadata2.version).toBe(metadata1.version);
      expect(metadata2.created_at).toBe(metadata1.created_at);

      saveManager2.close();
    });
  });

  describe("getDb", () => {
    it("returns null initially", () => {
      expect(saveManager.getDb()).toBeNull();
    });

    it("returns database after createSave", () => {
      saveManager.createSave("test", testDir);
      expect(saveManager.getDb()).not.toBeNull();
    });

    it("returns database after openSave", () => {
      const filePath = join(testDir, "test.db");
      saveManager.createSave("test", testDir);
      saveManager.close();

      const saveManager2 = new SaveManager();
      saveManager2.openSave(filePath);
      expect(saveManager2.getDb()).not.toBeNull();
      saveManager2.close();
    });

    it("returns null after close", () => {
      saveManager.createSave("test", testDir);
      saveManager.close();
      expect(saveManager.getDb()).toBeNull();
    });
  });
});
