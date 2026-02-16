// tests/game/data/schemas/mob.schema.test.ts

import { describe, it, expect } from "vitest";
import { mobDefinitionSchema } from "@game/data/schemas/mob.schema";
import { DamageType } from "@shared/enums";

describe("mob.schema", () => {
  const validMob = {
    id: "mob_cellar_rat",
    name: "Cellar Rat",
    level: 1,
    isElite: false,
    isBoss: false,
    isRareSpawn: false,
    health: 50,
    armor: 5,
    meleeDamageMin: 3,
    meleeDamageMax: 5,
    attackSpeed: 2.0,
    abilities: [],
    zoneId: "zone_greenhollow_vale",
    lootTableId: "loot_cellar_rat",
    xpReward: 45,
    icon: { char: "r", fg: 8, bg: 0 },
  };

  it("should validate a complete mob definition", () => {
    expect(() => mobDefinitionSchema.parse(validMob)).not.toThrow();
  });

  it("should reject missing health", () => {
    const { health, ...noHealth } = validMob;
    expect(() => mobDefinitionSchema.parse(noHealth)).toThrow();
  });

  it("should validate a mob with abilities (Kragg)", () => {
    const kragg = {
      id: "mob_kragg",
      name: "Bandit Leader Kragg",
      level: 5,
      isElite: true,
      isBoss: true,
      isRareSpawn: false,
      health: 800,
      armor: 80,
      meleeDamageMin: 25,
      meleeDamageMax: 35,
      attackSpeed: 3.0,
      abilities: [
        {
          id: "kragg_cleave",
          name: "Cleave",
          damageType: DamageType.Physical,
          castTime: 0,
          cooldown: 6,
          damage: 40,
          targetType: "cone_frontal" as const,
        },
      ],
      zoneId: "zone_greenhollow_vale",
      lootTableId: "loot_kragg",
      xpReward: 800,
      icon: { char: "K", fg: 9, bg: 0 },
    };
    const result = mobDefinitionSchema.parse(kragg);
    expect(result.abilities).toHaveLength(1);
    expect(result.abilities[0].name).toBe("Cleave");
    expect(result.isElite).toBe(true);
    expect(result.isBoss).toBe(true);
  });

  it("should validate a mob with empty abilities array", () => {
    const result = mobDefinitionSchema.parse(validMob);
    expect(result.abilities).toEqual([]);
  });

  it("should validate optional mana field", () => {
    const mobWithMana = { ...validMob, mana: 100 };
    const result = mobDefinitionSchema.parse(mobWithMana);
    expect(result.mana).toBe(100);
  });
});
