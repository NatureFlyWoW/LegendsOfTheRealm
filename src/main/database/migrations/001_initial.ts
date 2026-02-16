import type Database from "better-sqlite3";

export const version = "0.1.0";
export const description = "Initial schema — all core tables";

export function up(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS save_metadata (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      save_name TEXT NOT NULL,
      version TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      last_saved_at INTEGER NOT NULL,
      total_playtime_seconds INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL, race TEXT NOT NULL, class_name TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1, xp INTEGER NOT NULL DEFAULT 0,
      rested_xp INTEGER NOT NULL DEFAULT 0, gold INTEGER NOT NULL DEFAULT 0,
      current_zone TEXT NOT NULL DEFAULT 'greenhollow_vale',
      activity TEXT NOT NULL DEFAULT 'idle', active_spec TEXT NOT NULL,
      talent_points TEXT NOT NULL DEFAULT '{}', equipment TEXT NOT NULL DEFAULT '{}',
      companion_clears TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL, last_played_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id TEXT NOT NULL, character_id INTEGER NOT NULL,
      bag_slot INTEGER, equipped_slot TEXT,
      durability INTEGER NOT NULL DEFAULT 100,
      enchant_id TEXT, gem_ids TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );
    CREATE TABLE IF NOT EXISTS quest_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quest_id TEXT NOT NULL, character_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted',
      objectives TEXT NOT NULL DEFAULT '{}', accepted_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );
    CREATE TABLE IF NOT EXISTS account_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      heirloom_unlocks TEXT NOT NULL DEFAULT '[]',
      transmog_unlocks TEXT NOT NULL DEFAULT '[]',
      mount_unlocks TEXT NOT NULL DEFAULT '[]',
      title_unlocks TEXT NOT NULL DEFAULT '[]',
      achievement_points INTEGER NOT NULL DEFAULT 0,
      guild_hall_level INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS rng_state (
      stream_name TEXT PRIMARY KEY,
      state_s0 INTEGER NOT NULL, state_s1 INTEGER NOT NULL,
      state_s2 INTEGER NOT NULL, state_s3 INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS active_state_machines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL, machine_type TEXT NOT NULL,
      machine_id TEXT NOT NULL, current_state TEXT NOT NULL,
      context_data TEXT NOT NULL DEFAULT '{}', started_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );
    CREATE TABLE IF NOT EXISTS reset_tracking (
      id INTEGER PRIMARY KEY,
      last_daily_reset INTEGER, last_weekly_reset INTEGER, daily_quest_seed INTEGER
    );
    CREATE TABLE IF NOT EXISTS guild_hall (
      id INTEGER PRIMARY KEY,
      level INTEGER NOT NULL DEFAULT 1, upgrades TEXT NOT NULL DEFAULT '{}',
      upgrade_in_progress TEXT, total_gold_invested INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS profession_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL, cooldown_type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );
  `);
}
