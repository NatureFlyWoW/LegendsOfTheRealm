import { describe, test, expect, beforeEach } from "vitest";
import { resetCache } from "@game/data/loader";
import {
  getAbility, getAllAbilities, getAbilitiesByClass,
  getItem, getAllItems,
  getZone, getAllZones,
  getMob, getMobsByZone,
  getQuest, getQuestsByZone, getQuestChain,
  getLootTable,
  getXpForLevel, getTotalXpToLevel,
} from "@game/data";
import { ClassName } from "@shared/enums";

beforeEach(() => resetCache());

describe("Ability API", () => {
  test("getAbility returns ability by ID", () => {
    const ability = getAbility("warrior_heroic_strike" as any);
    expect(ability).toBeDefined();
    expect(ability!.name).toBe("Heroic Strike");
  });

  test("getAbility returns undefined for unknown ID", () => {
    expect(getAbility("nonexistent" as any)).toBeUndefined();
  });

  test("getAllAbilities returns all abilities", () => {
    expect(getAllAbilities()).toHaveLength(16);
  });

  test("getAbilitiesByClass returns only that class", () => {
    const warrior = getAbilitiesByClass(ClassName.Warrior);
    expect(warrior.length).toBe(2);
    warrior.forEach(a => expect(a.className).toBe(ClassName.Warrior));
  });
});

describe("Item API", () => {
  test("getItem returns item by ID", () => {
    const item = getItem("item_farmers_pitchfork" as any);
    expect(item).toBeDefined();
    expect(item!.name).toBe("Farmer's Pitchfork");
  });

  test("getItem returns undefined for unknown ID", () => {
    expect(getItem("nonexistent" as any)).toBeUndefined();
  });

  test("getAllItems returns all items", () => {
    expect(getAllItems().length).toBeGreaterThan(0);
  });
});

describe("Zone API", () => {
  test("getZone returns Greenhollow Vale", () => {
    const zone = getZone("zone_greenhollow_vale" as any);
    expect(zone).toBeDefined();
    expect(zone!.levelRange.min).toBe(1);
    expect(zone!.levelRange.max).toBe(5);
  });

  test("getZone returns undefined for unknown ID", () => {
    expect(getZone("nonexistent" as any)).toBeUndefined();
  });

  test("getAllZones returns 1 zone", () => {
    expect(getAllZones()).toHaveLength(1);
  });
});

describe("Mob API", () => {
  test("getMob returns mob by ID", () => {
    const mob = getMob("mob_cellar_rat" as any);
    expect(mob).toBeDefined();
    expect(mob!.level).toBe(1);
  });

  test("getMob returns undefined for unknown ID", () => {
    expect(getMob("nonexistent" as any)).toBeUndefined();
  });

  test("getMobsByZone returns mobs for Greenhollow", () => {
    const mobs = getMobsByZone("zone_greenhollow_vale" as any);
    expect(mobs).toHaveLength(5);
  });
});

describe("Quest API", () => {
  test("getQuest returns quest by ID", () => {
    const quest = getQuest("quest_rat_problem" as any);
    expect(quest).toBeDefined();
    expect(quest!.rewards.xp).toBe(250);
  });

  test("getQuest returns undefined for unknown ID", () => {
    expect(getQuest("nonexistent" as any)).toBeUndefined();
  });

  test("getQuestsByZone returns quests for zone", () => {
    const quests = getQuestsByZone("zone_greenhollow_vale" as any);
    expect(quests).toHaveLength(5);
  });

  test("getQuestChain returns ordered chain", () => {
    const chain = getQuestChain("defense_of_greenhollow");
    expect(chain).toHaveLength(5);
    expect(chain[0].chainOrder).toBe(1);
    expect(chain[4].chainOrder).toBe(5);
  });
});

describe("Loot Table API", () => {
  test("getLootTable returns table by ID", () => {
    const table = getLootTable("loot_cellar_rat" as any);
    expect(table).toBeDefined();
    expect(table!.goldRange.min).toBeGreaterThanOrEqual(0);
  });

  test("getLootTable returns undefined for unknown ID", () => {
    expect(getLootTable("nonexistent" as any)).toBeUndefined();
  });
});

describe("XP Curve API", () => {
  test("getXpForLevel returns XP for level 1→2", () => {
    expect(getXpForLevel(1)).toBe(1000);
  });

  test("getXpForLevel returns 0 for level 60 (max)", () => {
    expect(getXpForLevel(60)).toBe(0);
  });

  test("getXpForLevel returns 0 for level 0 (out of range)", () => {
    expect(getXpForLevel(0)).toBe(0);
  });

  test("getTotalXpToLevel(1) is 0", () => {
    expect(getTotalXpToLevel(1)).toBe(0);
  });

  test("getTotalXpToLevel(2) equals getXpForLevel(1)", () => {
    expect(getTotalXpToLevel(2)).toBe(getXpForLevel(1));
  });

  test("getTotalXpToLevel(3) equals sum of levels 1 and 2", () => {
    expect(getTotalXpToLevel(3)).toBe(getXpForLevel(1) + getXpForLevel(2));
  });
});
