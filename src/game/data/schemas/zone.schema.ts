import { z } from "zod";

const gatheringNodeSchema = z.object({
  profession: z.string(),
  nodeType: z.string(),
  skillRange: z.object({ min: z.number(), max: z.number() }),
  spawnRate: z.number(),
  loot: z.string(),
});

const rareSpawnSchema = z.object({
  mobId: z.string(),
  respawnHoursMin: z.number(),
  respawnHoursMax: z.number(),
});

export const zoneDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  levelRange: z.object({ min: z.number(), max: z.number() }),
  theme: z.string(),
  loreDescription: z.string(),
  mobIds: z.array(z.string()),
  questIds: z.array(z.string()),
  dungeonUnlock: z.string().optional(),
  gatheringNodes: z.array(gatheringNodeSchema),
  rareSpawns: z.array(rareSpawnSchema),
  worldDropTable: z.string(),
  breadcrumbQuestTo: z.string().optional(),
});

export const zoneDefinitionsSchema = z.array(zoneDefinitionSchema);
export type ZoneDefinitionSchema = z.infer<typeof zoneDefinitionSchema>;
