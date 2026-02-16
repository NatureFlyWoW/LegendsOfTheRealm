// tests/game/data/schemas/quest.schema.test.ts

import { describe, it, expect } from "vitest";
import { questDefinitionSchema } from "@game/data/schemas/quest.schema";
import type { QuestDefinitionSchema } from "@game/data/schemas/quest.schema";

describe("quest.schema", () => {
  const validQuest: QuestDefinitionSchema = {
    id: "quest_rat_problem",
    name: "The Rat Problem",
    questText: "The cellar is overrun with rats! Clear them out before they eat all our grain stores.",
    turnInText: "Excellent work! The cellars are safe again. Take this old pitchfork as thanks.",
    level: 1,
    zoneId: "zone_greenhollow_vale",
    prerequisites: [],
    followUp: "quest_wolf_menace",
    chainName: "defense_of_greenhollow",
    chainOrder: 1,
    objectives: [{ type: "kill", targetId: "mob_cellar_rat", description: "Kill Cellar Rats", requiredCount: 10 }],
    rewards: { xp: 250, gold: 1500, guaranteedItems: ["item_farmers_pitchfork"] },
    type: "main_chain",
    repeatable: false,
    dailyReset: false,
  };

  it("should validate a complete valid quest definition", () => {
    expect(() => questDefinitionSchema.parse(validQuest)).not.toThrow();
  });

  it("should reject a quest missing objectives", () => {
    const { objectives, ...noObjectives } = validQuest;
    expect(() => questDefinitionSchema.parse(noObjectives)).toThrow();
  });

  it("should validate a quest with prerequisites", () => {
    const questWithPrereqs = {
      ...validQuest,
      id: "quest_wolf_menace",
      prerequisites: ["quest_rat_problem"],
    };
    expect(() => questDefinitionSchema.parse(questWithPrereqs)).not.toThrow();
  });

  it("should validate optional fields (followUp, chainName, chainOrder)", () => {
    const { followUp, chainName, chainOrder, ...minimalQuest } = validQuest;
    expect(() => questDefinitionSchema.parse(minimalQuest)).not.toThrow();
  });

  it("should validate all objective type enum values", () => {
    const objectiveTypes = ["kill", "collect", "deliver", "explore", "interact", "escort", "survive", "craft", "gather", "fish", "use_item"] as const;
    for (const type of objectiveTypes) {
      const quest = {
        ...validQuest,
        objectives: [{ type, description: "Test objective", requiredCount: 1 }],
      };
      expect(() => questDefinitionSchema.parse(quest)).not.toThrow();
    }
  });

  it("should reject an invalid objective type", () => {
    const quest = {
      ...validQuest,
      objectives: [{ type: "invalid_type", description: "Bad", requiredCount: 1 }],
    };
    expect(() => questDefinitionSchema.parse(quest)).toThrow();
  });
});
