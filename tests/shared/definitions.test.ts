// tests/shared/definitions.test.ts
import { describe, test, expect } from "vitest";
import type {
  RaceDefinition, ClassDefinition, StatFormulas,
  AbilityDefinition, TalentNode, TalentTree,
  ItemDefinition, ZoneDefinition, MobDefinition,
} from "@shared/definitions";

describe("Definition type structure", () => {
  test("RaceDefinition has correct shape", () => {
    const race: RaceDefinition = {
      id: "human" as any,
      name: "Human",
      lore: "Versatile folk",
      primaryBonus: { stat: "xp_gain", value: 0.05, isPercentage: true },
      secondaryBonus: { stat: "spirit", value: 0.03, isPercentage: true },
      professionBonuses: [],
      icon: { char: "@", fg: 7, bg: 0 },
    };
    expect(race.id).toBe("human");
    expect(race.primaryBonus.value).toBe(0.05);
  });

  test("ClassDefinition has 3 specs", () => {
    const cls: ClassDefinition = {
      id: "warrior" as any,
      name: "Warrior",
      description: "A mighty fighter",
      resourceType: "rage" as any,
      armorProficiency: ["plate" as any],
      weaponProficiency: ["sword_1h" as any],
      baseStats: { strength: 25, agility: 15, intellect: 8, stamina: 22, spirit: 10 },
      perLevelGains: { strength: 2.5, agility: 1.0, intellect: 0.5, stamina: 2.0, spirit: 0.5 },
      classBaseHp: 100,
      classBaseMana: 0,
      specs: ["protection" as any, "arms" as any, "fury" as any],
    };
    expect(cls.specs).toHaveLength(3);
    expect(cls.baseStats.strength).toBe(25);
  });

  test("ItemDefinition has stat budget fields", () => {
    const item: ItemDefinition = {
      id: "iron_sword" as any,
      name: "Iron Sword",
      quality: "common" as any,
      itemLevel: 10,
      requiredLevel: 5,
      description: "A basic sword",
      icon: { char: "/", fg: 7, bg: 0 },
      slot: "main_hand" as any,
      stats: {},
      bindOnPickup: false,
      bindOnEquip: true,
      unique: false,
      stackSize: 1,
      vendorSellPrice: 500,
      sources: [],
    };
    expect(item.itemLevel).toBe(10);
    expect(item.vendorSellPrice).toBe(500);
  });
});
