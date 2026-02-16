import type Database from "better-sqlite3";
import * as migration001 from "./migrations/001_initial";

interface Migration {
  version: string;
  description: string;
  up: (db: Database.Database) => void;
}

const MIGRATIONS: Migration[] = [migration001];

export function runMigrations(db: Database.Database): void {
  db.exec(`CREATE TABLE IF NOT EXISTS _migrations (version TEXT PRIMARY KEY, applied_at INTEGER NOT NULL)`);
  const applied = new Set(
    (db.prepare("SELECT version FROM _migrations").all() as Array<{ version: string }>).map(r => r.version)
  );
  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.version)) {
      migration.up(db);
      db.prepare("INSERT INTO _migrations (version, applied_at) VALUES (?, ?)").run(
        migration.version, Math.floor(Date.now() / 1000)
      );
    }
  }
}

export function getCurrentVersion(db: Database.Database): string {
  const row = db.prepare("SELECT version FROM _migrations ORDER BY rowid DESC LIMIT 1").get() as { version: string } | undefined;
  return row?.version ?? "0.0.0";
}
