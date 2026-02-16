import { z } from "zod";
import { ClassName, ResourceType, DamageType, PrimaryStat, TalentSpec } from "@shared/enums";

const asciiIconSchema = z.object({
  char: z.string(),
  fg: z.number(),
  bg: z.number(),
});

const abilityEffectSchema = z.object({
  type: z.string(),
  damageType: z.nativeEnum(DamageType).optional(),
  baseDamageMin: z.number().optional(),
  baseDamageMax: z.number().optional(),
  coefficient: z.number(),
  scalingStat: z.union([
    z.nativeEnum(PrimaryStat),
    z.enum(["attack_power", "spell_power", "weapon_dps"]),
  ]),
  duration: z.number().optional(),
  tickInterval: z.number().optional(),
  stacks: z.number().optional(),
  threatMultiplier: z.number().optional(),
  dispellable: z.boolean().optional(),
  procChance: z.number().optional(),
});

export const abilityDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  className: z.nativeEnum(ClassName),
  spec: z.nativeEnum(TalentSpec).nullable(),
  description: z.string(),
  icon: asciiIconSchema,
  castTime: z.number(),
  cooldown: z.number(),
  globalCooldown: z.boolean(),
  channeled: z.boolean(),
  channelDuration: z.number().optional(),
  resourceCost: z.number(),
  resourceType: z.nativeEnum(ResourceType),
  targetType: z.enum(["self", "enemy", "friendly", "aoe_ground", "aoe_self", "cone"]),
  range: z.number(),
  aoeRadius: z.number().optional(),
  maxTargets: z.number().optional(),
  effects: z.array(abilityEffectSchema),
  aiPriority: z.number(),
  aiCondition: z.string().optional(),
});

export const abilityDefinitionsSchema = z.array(abilityDefinitionSchema);
export type AbilityDefinitionSchema = z.infer<typeof abilityDefinitionSchema>;
