import { z } from "zod";

const lootEntrySchema = z.object({
  itemId: z.string(),
  weight: z.number(),
  minQuantity: z.number(),
  maxQuantity: z.number(),
});

const smartLootConfigSchema = z.object({
  classWeightBonus: z.number(),
  specWeightBonus: z.number(),
  upgradeWeightBonus: z.number(),
});

export const lootTableSchema = z.object({
  id: z.string(),
  guaranteedDrops: z.array(lootEntrySchema),
  rolledDrops: z.array(lootEntrySchema),
  rolledDropCount: z.number(),
  goldRange: z.object({ min: z.number(), max: z.number() }),
  bonusRolls: z.array(lootEntrySchema).optional(),
  smartLoot: smartLootConfigSchema.optional(),
});

export const lootTablesSchema = z.array(lootTableSchema);
export type LootTableSchema = z.infer<typeof lootTableSchema>;
