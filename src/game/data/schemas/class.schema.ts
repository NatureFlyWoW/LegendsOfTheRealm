// src/game/data/schemas/class.schema.ts

import { z } from "zod";
import { ClassName, ResourceType, ArmorType, WeaponType, TalentSpec, PrimaryStat } from "@shared/enums";

/**
 * Zod schema for base stats - must contain all 5 primary stats.
 */
const baseStatsSchema = z.object({
  [PrimaryStat.Strength]: z.number(),
  [PrimaryStat.Agility]: z.number(),
  [PrimaryStat.Intellect]: z.number(),
  [PrimaryStat.Stamina]: z.number(),
  [PrimaryStat.Spirit]: z.number(),
});

/**
 * Zod schema for per-level stat gains - must contain all 5 primary stats.
 */
const perLevelGainsSchema = z.object({
  [PrimaryStat.Strength]: z.number(),
  [PrimaryStat.Agility]: z.number(),
  [PrimaryStat.Intellect]: z.number(),
  [PrimaryStat.Stamina]: z.number(),
  [PrimaryStat.Spirit]: z.number(),
});

/**
 * Zod schema for class definition.
 * Validates ClassDefinition from definitions.ts
 */
export const classDefinitionSchema = z.object({
  id: z.nativeEnum(ClassName),
  name: z.string(),
  description: z.string(),
  resourceType: z.nativeEnum(ResourceType),
  armorProficiency: z.array(z.nativeEnum(ArmorType)),
  weaponProficiency: z.array(z.nativeEnum(WeaponType)),
  baseStats: baseStatsSchema,
  perLevelGains: perLevelGainsSchema,
  classBaseHp: z.number(),
  classBaseMana: z.number(),
  specs: z.tuple([
    z.nativeEnum(TalentSpec),
    z.nativeEnum(TalentSpec),
    z.nativeEnum(TalentSpec),
  ]),
});

/**
 * Array schema for validating multiple class definitions.
 */
export const classDefinitionsSchema = z.array(classDefinitionSchema);

/**
 * Type inference helper
 */
export type ClassDefinitionSchema = z.infer<typeof classDefinitionSchema>;
