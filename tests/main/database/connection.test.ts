import { describe, test, expect, afterEach } from "vitest";
import { openDatabase, closeDatabase } from "@main/database/connection";
import { existsSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

const TEST_DB = join(tmpdir(), "test_lotr_connection.db");

afterEach(() => {
  try { unlinkSync(TEST_DB); } catch {}
  try { unlinkSync(TEST_DB + "-wal"); } catch {}
  try { unlinkSync(TEST_DB + "-shm"); } catch {}
});

describe("openDatabase", () => {
  test("creates a new database file", () => {
    const db = openDatabase(TEST_DB);
    expect(existsSync(TEST_DB)).toBe(true);
    closeDatabase(db);
  });

  test("enables WAL mode", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("journal_mode") as Array<{ journal_mode: string }>;
    expect(result[0].journal_mode).toBe("wal");
    closeDatabase(db);
  });

  test("enables foreign keys", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("foreign_keys") as Array<{ foreign_keys: number }>;
    expect(result[0].foreign_keys).toBe(1);
    closeDatabase(db);
  });

  test("passes integrity check", () => {
    const db = openDatabase(TEST_DB);
    const result = db.pragma("integrity_check") as Array<{ integrity_check: string }>;
    expect(result[0].integrity_check).toBe("ok");
    closeDatabase(db);
  });
});
