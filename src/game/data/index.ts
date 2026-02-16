// src/game/data/index.ts
// Public API for game data access — convenience accessors with type safety

import { loadGameData } from "./loader";
import type { RaceDefinition, ClassDefinition, StatFormulas } from "@shared/definitions";
import type { RaceName, ClassName } from "@shared/enums";

// Re-export loader functions for direct access
export { loadGameData, resetCache } from "./loader";
export type { GameData } from "./loader";

/**
 * Get a race definition by ID.
 * @param id - Race identifier from RaceName enum
 * @returns {RaceDefinition | undefined} - Race definition or undefined if not found
 */
export function getRace(id: RaceName): RaceDefinition | undefined {
  return loadGameData().races.find(r => r.id === id);
}

/**
 * Get a class definition by ID.
 * @param id - Class identifier from ClassName enum
 * @returns {ClassDefinition | undefined} - Class definition or undefined if not found
 */
export function getClass(id: ClassName): ClassDefinition | undefined {
  return loadGameData().classes.find(c => c.id === id);
}

/**
 * Get all race definitions.
 * @returns {RaceDefinition[]} - Array of all race definitions
 */
export function getAllRaces(): RaceDefinition[] {
  return loadGameData().races;
}

/**
 * Get all class definitions.
 * @returns {ClassDefinition[]} - Array of all class definitions
 */
export function getAllClasses(): ClassDefinition[] {
  return loadGameData().classes;
}

/**
 * Get stat calculation formulas.
 * @returns {StatFormulas} - Stat formulas and conversion tables
 */
export function getStatFormulas(): StatFormulas {
  return loadGameData().stats;
}
