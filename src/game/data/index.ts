// src/game/data/index.ts
// Public API for game data access — convenience accessors with type safety

import { loadGameData } from "./loader";
import type { RaceDefinition, ClassDefinition, StatFormulas,
  AbilityDefinition, ItemDefinition, ZoneDefinition,
  MobDefinition, QuestDefinition } from "@shared/definitions";
import type { RaceName, ClassName } from "@shared/enums";
import type { LootTable, AbilityId, ItemId, ZoneId, MobId, QuestId, LootTableId } from "@shared/types";

// Re-export loader functions for direct access
export { loadGameData, resetCache } from "./loader";
export type { GameData } from "./loader";

// --- Race API ---

export function getRace(id: RaceName): RaceDefinition | undefined {
  return loadGameData().races.find(r => r.id === id);
}

export function getAllRaces(): RaceDefinition[] {
  return loadGameData().races;
}

// --- Class API ---

export function getClass(id: ClassName): ClassDefinition | undefined {
  return loadGameData().classes.find(c => c.id === id);
}

export function getAllClasses(): ClassDefinition[] {
  return loadGameData().classes;
}

// --- Stats API ---

export function getStatFormulas(): StatFormulas {
  return loadGameData().stats;
}

// --- Ability API ---

export function getAbility(id: AbilityId): AbilityDefinition | undefined {
  return loadGameData().abilities.find(a => a.id === id);
}

export function getAllAbilities(): AbilityDefinition[] {
  return loadGameData().abilities;
}

export function getAbilitiesByClass(className: ClassName): AbilityDefinition[] {
  return loadGameData().abilities.filter(a => a.className === className);
}

// --- Item API ---

export function getItem(id: ItemId): ItemDefinition | undefined {
  return loadGameData().items.find(i => i.id === id);
}

export function getAllItems(): ItemDefinition[] {
  return loadGameData().items;
}

// --- Zone API ---

export function getZone(id: ZoneId): ZoneDefinition | undefined {
  return loadGameData().zones.find(z => z.id === id);
}

export function getAllZones(): ZoneDefinition[] {
  return loadGameData().zones;
}

// --- Mob API ---

export function getMob(id: MobId): MobDefinition | undefined {
  return loadGameData().mobs.find(m => m.id === id);
}

export function getMobsByZone(zoneId: ZoneId): MobDefinition[] {
  return loadGameData().mobs.filter(m => m.zoneId === zoneId);
}

// --- Quest API ---

export function getQuest(id: QuestId): QuestDefinition | undefined {
  return loadGameData().quests.find(q => q.id === id);
}

export function getQuestsByZone(zoneId: ZoneId): QuestDefinition[] {
  return loadGameData().quests.filter(q => q.zoneId === zoneId);
}

export function getQuestChain(chainName: string): QuestDefinition[] {
  return loadGameData().quests
    .filter(q => q.chainName === chainName)
    .sort((a, b) => (a.chainOrder ?? 0) - (b.chainOrder ?? 0));
}

// --- Loot Table API ---

export function getLootTable(id: LootTableId): LootTable | undefined {
  return loadGameData().lootTables.find(lt => lt.id === id);
}

// --- XP Curve API ---

export function getXpForLevel(level: number): number {
  const xp = loadGameData().xpPerLevel;
  if (level < 1 || level > xp.length) return 0;
  return xp[level - 1];
}

export function getTotalXpToLevel(level: number): number {
  if (level <= 1) return 0;
  const xp = loadGameData().xpPerLevel;
  let total = 0;
  for (let i = 0; i < level - 1 && i < xp.length; i++) {
    total += xp[i];
  }
  return total;
}
