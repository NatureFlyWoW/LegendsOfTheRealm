// src/game/data/loader.ts
// Game data loader — validates and caches JSON content against Zod schemas

import racesJson from "./content/races.json";
import classesJson from "./content/classes.json";
import statsJson from "./content/stats.json";
import abilitiesJson from "./content/abilities.json";
import itemsJson from "./content/items.json";
import zonesJson from "./content/zones.json";
import mobsJson from "./content/mobs.json";
import questsJson from "./content/quests.json";
import lootTablesJson from "./content/loot-tables.json";
import xpCurvesJson from "./content/xp-curves.json";
import { raceDefinitionSchema } from "./schemas/race.schema";
import { classDefinitionSchema } from "./schemas/class.schema";
import { statFormulasSchema } from "./schemas/stats.schema";
import { abilityDefinitionSchema } from "./schemas/ability.schema";
import { itemDefinitionSchema } from "./schemas/item.schema";
import { zoneDefinitionSchema } from "./schemas/zone.schema";
import { mobDefinitionSchema } from "./schemas/mob.schema";
import { questDefinitionSchema } from "./schemas/quest.schema";
import { lootTableSchema } from "./schemas/loot-table.schema";
import type { RaceDefinition, ClassDefinition, StatFormulas,
  AbilityDefinition, ItemDefinition, ZoneDefinition,
  MobDefinition, QuestDefinition } from "@shared/definitions";
import type { LootTable } from "@shared/types";

/**
 * Complete game data structure with all loaded content
 */
export interface GameData {
  races: RaceDefinition[];
  classes: ClassDefinition[];
  stats: StatFormulas;
  abilities: AbilityDefinition[];
  items: ItemDefinition[];
  zones: ZoneDefinition[];
  mobs: MobDefinition[];
  quests: QuestDefinition[];
  lootTables: LootTable[];
  xpPerLevel: number[];
}

/**
 * Module-level cache for loaded and validated game data
 */
let cachedData: GameData | null = null;

/**
 * Loads all game data from JSON files, validates against Zod schemas, and caches result.
 * Subsequent calls return cached data for performance.
 *
 * @throws {ZodError} if any JSON file fails schema validation
 * @returns {GameData} validated and typed game data
 */
export function loadGameData(): GameData {
  if (cachedData) return cachedData;

  const races = (racesJson as unknown[]).map(r => raceDefinitionSchema.parse(r));
  const classes = (classesJson as unknown[]).map(c => classDefinitionSchema.parse(c));
  const stats = statFormulasSchema.parse(statsJson);
  const abilities = (abilitiesJson as unknown[]).map(a => abilityDefinitionSchema.parse(a));
  const items = (itemsJson as unknown[]).map(i => itemDefinitionSchema.parse(i));
  const zones = (zonesJson as unknown[]).map(z => zoneDefinitionSchema.parse(z));
  const mobs = (mobsJson as unknown[]).map(m => mobDefinitionSchema.parse(m));
  const quests = (questsJson as unknown[]).map(q => questDefinitionSchema.parse(q));
  const lootTables = (lootTablesJson as unknown[]).map(lt => lootTableSchema.parse(lt));
  const xpPerLevel = (xpCurvesJson as { xpPerLevel: number[] }).xpPerLevel;

  cachedData = { races, classes, stats, abilities, items, zones, mobs, quests, lootTables, xpPerLevel };
  return cachedData;
}

/**
 * Clears the module-level cache, forcing next loadGameData() call to reload and revalidate.
 * Primarily used for testing.
 */
export function resetCache(): void {
  cachedData = null;
}
