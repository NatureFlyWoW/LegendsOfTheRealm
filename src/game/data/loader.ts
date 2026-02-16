// src/game/data/loader.ts
// Game data loader — validates and caches JSON content against Zod schemas

import racesJson from "./content/races.json";
import classesJson from "./content/classes.json";
import statsJson from "./content/stats.json";
import { raceDefinitionSchema } from "./schemas/race.schema";
import { classDefinitionSchema } from "./schemas/class.schema";
import { statFormulasSchema } from "./schemas/stats.schema";
import type { RaceDefinition, ClassDefinition, StatFormulas } from "@shared/definitions";

/**
 * Complete game data structure with all loaded content
 */
export interface GameData {
  races: RaceDefinition[];
  classes: ClassDefinition[];
  stats: StatFormulas;
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

  // Validate races array
  const races = (racesJson as unknown[]).map(r => raceDefinitionSchema.parse(r));

  // Validate classes array
  const classes = (classesJson as unknown[]).map(c => classDefinitionSchema.parse(c));

  // Validate stats object
  const stats = statFormulasSchema.parse(statsJson);

  cachedData = { races, classes, stats };
  return cachedData;
}

/**
 * Clears the module-level cache, forcing next loadGameData() call to reload and revalidate.
 * Primarily used for testing.
 */
export function resetCache(): void {
  cachedData = null;
}
