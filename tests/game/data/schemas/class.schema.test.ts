// tests/game/data/schemas/class.schema.test.ts

import { describe, it, expect } from "vitest";
import { classDefinitionSchema } from "@game/data/schemas/class.schema";
import { ClassName, ResourceType, ArmorType, WeaponType, TalentSpec, PrimaryStat } from "@shared/enums";
import type { ClassDefinition } from "@shared/definitions";

describe("class.schema", () => {
  const validClass: ClassDefinition = {
    id: ClassName.Warrior,
    name: "Warrior",
    description: "A mighty melee combatant who wields rage to fuel devastating attacks.",
    resourceType: ResourceType.Rage,
    armorProficiency: [ArmorType.Plate, ArmorType.Mail, ArmorType.Leather, ArmorType.Cloth],
    weaponProficiency: [WeaponType.Sword1H, WeaponType.Sword2H, WeaponType.Axe1H, WeaponType.Axe2H, WeaponType.Mace1H, WeaponType.Mace2H, WeaponType.Shield],
    baseStats: {
      [PrimaryStat.Strength]: 25,
      [PrimaryStat.Agility]: 15,
      [PrimaryStat.Intellect]: 8,
      [PrimaryStat.Stamina]: 22,
      [PrimaryStat.Spirit]: 10,
    },
    perLevelGains: {
      [PrimaryStat.Strength]: 2.5,
      [PrimaryStat.Agility]: 1.0,
      [PrimaryStat.Intellect]: 0.5,
      [PrimaryStat.Stamina]: 2.0,
      [PrimaryStat.Spirit]: 0.8,
    },
    classBaseHp: 100,
    classBaseMana: 0,
    specs: [TalentSpec.Protection, TalentSpec.Arms, TalentSpec.Fury],
  };

  it("should validate a complete valid class definition", () => {
    expect(() => classDefinitionSchema.parse(validClass)).not.toThrow();
  });

  it("should reject invalid class enum value", () => {
    const invalidClass = {
      ...validClass,
      id: "invalid_class",
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should reject invalid resource type", () => {
    const invalidClass = {
      ...validClass,
      resourceType: "invalid_resource",
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should require exactly 3 specs", () => {
    const invalidClass = {
      ...validClass,
      specs: [TalentSpec.Protection, TalentSpec.Arms], // only 2
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should require all 5 primary stats in baseStats", () => {
    const invalidClass = {
      ...validClass,
      baseStats: {
        [PrimaryStat.Strength]: 25,
        [PrimaryStat.Agility]: 15,
        [PrimaryStat.Intellect]: 8,
        [PrimaryStat.Stamina]: 22,
        // missing Spirit
      },
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should require all 5 primary stats in perLevelGains", () => {
    const invalidClass = {
      ...validClass,
      perLevelGains: {
        [PrimaryStat.Strength]: 2.5,
        [PrimaryStat.Agility]: 1.0,
        // missing others
      },
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should validate a mana-based class", () => {
    const mageClass: ClassDefinition = {
      id: ClassName.Mage,
      name: "Mage",
      description: "A master of arcane magic.",
      resourceType: ResourceType.Mana,
      armorProficiency: [ArmorType.Cloth],
      weaponProficiency: [WeaponType.Staff, WeaponType.Wand, WeaponType.Dagger],
      baseStats: {
        [PrimaryStat.Strength]: 5,
        [PrimaryStat.Agility]: 10,
        [PrimaryStat.Intellect]: 28,
        [PrimaryStat.Stamina]: 12,
        [PrimaryStat.Spirit]: 20,
      },
      perLevelGains: {
        [PrimaryStat.Strength]: 0.3,
        [PrimaryStat.Agility]: 0.5,
        [PrimaryStat.Intellect]: 2.8,
        [PrimaryStat.Stamina]: 1.0,
        [PrimaryStat.Spirit]: 1.8,
      },
      classBaseHp: 50,
      classBaseMana: 200,
      specs: [TalentSpec.FireMage, TalentSpec.FrostMage, TalentSpec.ArcaneMage],
    };

    expect(() => classDefinitionSchema.parse(mageClass)).not.toThrow();
  });

  it("should reject specs array with more than 3 elements", () => {
    const invalidClass = {
      ...validClass,
      specs: [TalentSpec.Protection, TalentSpec.Arms, TalentSpec.Fury, TalentSpec.Holy] as any,
    };
    expect(() => classDefinitionSchema.parse(invalidClass)).toThrow();
  });

  it("should parse and return the validated data", () => {
    const result = classDefinitionSchema.parse(validClass);
    expect(result).toEqual(validClass);
    expect(result.id).toBe(ClassName.Warrior);
    expect(result.specs).toHaveLength(3);
  });
});
