import { openDatabase, closeDatabase } from "@main/database/connection";
import { runMigrations, getCurrentVersion } from "@main/database/migrator";
import type Database from "better-sqlite3";
import { existsSync, copyFileSync, readdirSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

export class SaveManager {
  private db: Database.Database | null = null;

  getSavePath(): string {
    const p = platform();
    if (p === "win32") {
      return join(
        process.env.APPDATA || join(homedir(), "AppData", "Roaming"),
        "LegendsOfTheShatteredRealm",
        "saves"
      );
    }
    if (p === "darwin") {
      return join(homedir(), "Library", "Application Support", "LegendsOfTheShatteredRealm", "saves");
    }
    return join(homedir(), ".config", "legends-of-the-shattered-realm", "saves");
  }

  createSave(name: string, savePath?: string): Database.Database {
    const dir = savePath ?? this.getSavePath();
    mkdirSync(dir, { recursive: true });
    const filePath = join(dir, `${name}.db`);
    if (existsSync(filePath)) {
      throw new Error(`Save file already exists: ${filePath}`);
    }
    const db = openDatabase(filePath);
    runMigrations(db);
    // Insert initial save metadata
    const now = Math.floor(Date.now() / 1000);
    db.prepare("INSERT INTO save_metadata (save_name, version, created_at, last_saved_at, total_playtime_seconds) VALUES (?, ?, ?, ?, ?)")
      .run(name, getCurrentVersion(db), now, now, 0);
    this.db = db;
    return db;
  }

  openSave(filePath: string): Database.Database {
    if (!existsSync(filePath)) {
      throw new Error(`Save file not found: ${filePath}`);
    }
    let db: Database.Database;
    try {
      db = openDatabase(filePath);
    } catch (error) {
      // SQLite throws errors for corrupted files when opening
      throw new Error("Save file is corrupted");
    }
    // Validate integrity
    try {
      const result = db.pragma("integrity_check") as Array<{ integrity_check: string }>;
      if (result[0].integrity_check !== "ok") {
        closeDatabase(db);
        throw new Error("Save file is corrupted");
      }
    } catch (error) {
      closeDatabase(db);
      throw new Error("Save file is corrupted");
    }
    // Run any pending migrations
    runMigrations(db);
    this.db = db;
    return db;
  }

  backupSave(filePath: string): string {
    if (!existsSync(filePath)) {
      throw new Error(`Save file not found: ${filePath}`);
    }
    const backupPath = filePath + ".bak";
    copyFileSync(filePath, backupPath);
    return backupPath;
  }

  listSaves(savePath?: string): string[] {
    const dir = savePath ?? this.getSavePath();
    if (!existsSync(dir)) {
      return [];
    }
    return readdirSync(dir)
      .filter(f => f.endsWith(".db"))
      .map(f => join(dir, f));
  }

  close(): void {
    if (this.db) {
      closeDatabase(this.db);
      this.db = null;
    }
  }

  getDb(): Database.Database | null {
    return this.db;
  }
}
