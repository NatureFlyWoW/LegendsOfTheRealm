// src/game/data/schemas/race.schema.ts

import { z } from "zod";
import { RaceName, PrimaryStat } from "@shared/enums";

/**
 * Zod schema for racial bonus structure.
 * Matches RacialBonus from definitions.ts
 */
export const racialBonusSchema = z.object({
  stat: z.union([
    z.nativeEnum(PrimaryStat),
    z.enum(["xp_gain", "crit_chance", "dodge_chance", "melee_damage", "shadow_resist", "regen"]),
  ]),
  value: z.number(),
  isPercentage: z.boolean(),
});

/**
 * Zod schema for profession bonus structure.
 */
export const professionBonusSchema = z.object({
  profession: z.string(),
  value: z.number(),
});

/**
 * Zod schema for race definition.
 * Validates RaceDefinition from definitions.ts
 */
export const raceDefinitionSchema = z.object({
  id: z.nativeEnum(RaceName),
  name: z.string(),
  lore: z.string(),
  primaryBonus: racialBonusSchema,
  secondaryBonus: racialBonusSchema,
  professionBonuses: z.array(professionBonusSchema),
  icon: z.string(),
});

/**
 * Array schema for validating multiple race definitions.
 */
export const raceDefinitionsSchema = z.array(raceDefinitionSchema);

/**
 * Type inference helpers
 */
export type RacialBonusSchema = z.infer<typeof racialBonusSchema>;
export type RaceDefinitionSchema = z.infer<typeof raceDefinitionSchema>;
