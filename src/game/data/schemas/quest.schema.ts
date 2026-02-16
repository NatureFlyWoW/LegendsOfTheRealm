import { z } from "zod";

const questObjectiveSchema = z.object({
  type: z.enum(["kill", "collect", "deliver", "explore", "interact", "escort", "survive", "craft", "gather", "fish", "use_item"]),
  targetId: z.string().optional(),
  description: z.string(),
  requiredCount: z.number(),
  dropRate: z.number().optional(),
  baseRate: z.number().optional(),
});

const questRewardsSchema = z.object({
  xp: z.number(),
  gold: z.number(),
  choiceItems: z.array(z.string()).optional(),
  guaranteedItems: z.array(z.string()).optional(),
  unlocksContent: z.string().optional(),
});

export const questDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  questText: z.string(),
  turnInText: z.string(),
  level: z.number(),
  zoneId: z.string(),
  prerequisites: z.array(z.string()),
  followUp: z.string().optional(),
  chainName: z.string().optional(),
  chainOrder: z.number().optional(),
  objectives: z.array(questObjectiveSchema),
  rewards: questRewardsSchema,
  type: z.enum(["main_chain", "side", "daily", "profession", "dungeon_unlock", "legendary", "hidden", "breadcrumb"]),
  repeatable: z.boolean(),
  dailyReset: z.boolean(),
});

export const questDefinitionsSchema = z.array(questDefinitionSchema);
export type QuestDefinitionSchema = z.infer<typeof questDefinitionSchema>;
