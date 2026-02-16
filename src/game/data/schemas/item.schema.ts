import { z } from "zod";
import { QualityTier, GearSlot, ArmorType, WeaponType } from "@shared/enums";

const asciiIconSchema = z.object({ char: z.string(), fg: z.number(), bg: z.number() });

const itemSourceSchema = z.object({
  type: z.enum(["boss_drop", "world_drop", "quest_reward", "vendor", "crafted", "rare_spawn", "fishing", "gathering", "achievement", "reputation"]),
  sourceId: z.string(),
  dropRate: z.number().optional(),
  context: z.string().optional(),
});

export const itemDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  quality: z.nativeEnum(QualityTier),
  itemLevel: z.number(),
  requiredLevel: z.number(),
  description: z.string(),
  icon: asciiIconSchema,
  slot: z.union([z.nativeEnum(GearSlot), z.enum(["bag", "consumable", "material", "quest", "recipe", "gem", "mount"])]),
  armorType: z.nativeEnum(ArmorType).optional(),
  weaponType: z.nativeEnum(WeaponType).optional(),
  stats: z.record(z.string(), z.number()),
  weaponDamageMin: z.number().optional(),
  weaponDamageMax: z.number().optional(),
  weaponSpeed: z.number().optional(),
  armorValue: z.number().optional(),
  blockValue: z.number().optional(),
  sockets: z.array(z.enum(["red", "yellow", "blue", "meta"])).optional(),
  socketBonus: z.record(z.string(), z.number()).optional(),
  setId: z.string().optional(),
  bindOnPickup: z.boolean(),
  bindOnEquip: z.boolean(),
  unique: z.boolean(),
  stackSize: z.number(),
  vendorSellPrice: z.number(),
  bagSlots: z.number().optional(),
  sources: z.array(itemSourceSchema),
});

export const itemDefinitionsSchema = z.array(itemDefinitionSchema);
export type ItemDefinitionSchema = z.infer<typeof itemDefinitionSchema>;
