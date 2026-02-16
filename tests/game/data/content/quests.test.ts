// tests/game/data/content/quests.test.ts

import { describe, it, expect } from "vitest";
import { questDefinitionsSchema } from "@game/data/schemas/quest.schema";
import questsJson from "@game/data/content/quests.json";

describe("quests.json", () => {
  it("should load and parse the quests JSON file", () => {
    expect(questsJson).toBeDefined();
    expect(Array.isArray(questsJson)).toBe(true);
  });

  it("should validate against the quest schema", () => {
    expect(() => questDefinitionsSchema.parse(questsJson)).not.toThrow();
  });

  it("should contain exactly 5 quests", () => {
    expect(questsJson).toHaveLength(5);
  });

  it("should have correct chain ordering from 1 to 5", () => {
    const sorted = [...questsJson].sort((a: any, b: any) => a.chainOrder - b.chainOrder);
    sorted.forEach((quest: any, index: number) => {
      expect(quest.chainOrder).toBe(index + 1);
    });
  });

  it("should have each quest link to the next via followUp except the last", () => {
    const sorted = [...questsJson].sort((a: any, b: any) => a.chainOrder - b.chainOrder);
    for (let i = 0; i < sorted.length - 1; i++) {
      expect(sorted[i].followUp).toBe(sorted[i + 1].id);
    }
    expect(sorted[sorted.length - 1].followUp).toBeUndefined();
  });

  it("should have all quests with xp > 0", () => {
    questsJson.forEach((quest: any) => {
      expect(quest.rewards.xp).toBeGreaterThan(0);
    });
  });

  it("should have unique quest IDs", () => {
    const ids = questsJson.map((q: any) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("should have all quests of type main_chain", () => {
    questsJson.forEach((quest: any) => {
      expect(quest.type).toBe("main_chain");
    });
  });

  it("should have the first quest with empty prerequisites", () => {
    const firstQuest = questsJson.find((q: any) => q.chainOrder === 1);
    expect(firstQuest).toBeDefined();
    expect(firstQuest!.prerequisites).toEqual([]);
  });
});
