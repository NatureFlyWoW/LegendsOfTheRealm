import { describe, test, expect, afterEach } from "vitest";
import { openDatabase, closeDatabase } from "@main/database/connection";
import { runMigrations, getCurrentVersion } from "@main/database/migrator";
import { unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DB = join(tmpdir(), "test_lotr_migration.db");

afterEach(() => {
  try { unlinkSync(TEST_DB); } catch {}
  try { unlinkSync(TEST_DB + "-wal"); } catch {}
  try { unlinkSync(TEST_DB + "-shm"); } catch {}
});

describe("Database migrations", () => {
  test("runMigrations creates all tables", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>;
    const names = tables.map(t => t.name);
    expect(names).toContain("save_metadata");
    expect(names).toContain("characters");
    expect(names).toContain("items");
    expect(names).toContain("rng_state");
    closeDatabase(db);
  });

  test("getCurrentVersion returns 0.1.0 after initial migration", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe("0.1.0");
    closeDatabase(db);
  });

  test("running migrations twice is idempotent", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    runMigrations(db);
    expect(getCurrentVersion(db)).toBe("0.1.0");
    closeDatabase(db);
  });

  test("characters table has correct columns", () => {
    const db = openDatabase(TEST_DB);
    runMigrations(db);
    const info = db.prepare("PRAGMA table_info(characters)").all() as Array<{ name: string }>;
    const cols = info.map(c => c.name);
    expect(cols).toContain("id");
    expect(cols).toContain("name");
    expect(cols).toContain("race");
    expect(cols).toContain("class_name");
    expect(cols).toContain("level");
    expect(cols).toContain("equipment");
    closeDatabase(db);
  });
});
