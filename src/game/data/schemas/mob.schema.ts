import { z } from "zod";
import { DamageType } from "@shared/enums";

const asciiIconSchema = z.object({ char: z.string(), fg: z.number(), bg: z.number() });

const mobAbilitySchema = z.object({
  id: z.string(),
  name: z.string(),
  damageType: z.nativeEnum(DamageType),
  castTime: z.number(),
  cooldown: z.number(),
  damage: z.number(),
  targetType: z.enum(["tank", "random", "all", "cone_frontal", "aoe_ground", "self"]),
});

export const mobDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number(),
  isElite: z.boolean(),
  isBoss: z.boolean(),
  isRareSpawn: z.boolean(),
  health: z.number(),
  mana: z.number().optional(),
  armor: z.number(),
  meleeDamageMin: z.number(),
  meleeDamageMax: z.number(),
  attackSpeed: z.number(),
  abilities: z.array(mobAbilitySchema),
  zoneId: z.string(),
  lootTableId: z.string(),
  xpReward: z.number(),
  icon: asciiIconSchema,
});

export const mobDefinitionsSchema = z.array(mobDefinitionSchema);
export type MobDefinitionSchema = z.infer<typeof mobDefinitionSchema>;
