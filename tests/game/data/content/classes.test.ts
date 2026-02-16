// tests/game/data/content/classes.test.ts

import { describe, it, expect } from "vitest";
import { classDefinitionsSchema } from "@game/data/schemas/class.schema";
import { ClassName, ResourceType, TalentSpec, PrimaryStat } from "@shared/enums";
import classesJson from "@game/data/content/classes.json";

describe("classes.json", () => {
  it("should load and parse the classes JSON file", () => {
    expect(classesJson).toBeDefined();
    expect(Array.isArray(classesJson)).toBe(true);
  });

  it("should validate against the class schema", () => {
    expect(() => classDefinitionsSchema.parse(classesJson)).not.toThrow();
  });

  it("should contain exactly 8 classes", () => {
    expect(classesJson).toHaveLength(8);
  });

  it("should include all class types from the enum", () => {
    const classIds = classesJson.map((c: any) => c.id);
    expect(classIds).toContain(ClassName.Warrior);
    expect(classIds).toContain(ClassName.Mage);
    expect(classIds).toContain(ClassName.Cleric);
    expect(classIds).toContain(ClassName.Rogue);
    expect(classIds).toContain(ClassName.Ranger);
    expect(classIds).toContain(ClassName.Druid);
    expect(classIds).toContain(ClassName.Necromancer);
    expect(classIds).toContain(ClassName.Shaman);
  });

  describe("Warrior class per design doc", () => {
    it("should have correct resource and stats", () => {
      const warrior = classesJson.find((c: any) => c.id === ClassName.Warrior);
      expect(warrior).toBeDefined();
      expect(warrior.resourceType).toBe(ResourceType.Rage);
      expect(warrior.baseStats[PrimaryStat.Strength]).toBe(25);
      expect(warrior.baseStats[PrimaryStat.Agility]).toBe(15);
      expect(warrior.baseStats[PrimaryStat.Intellect]).toBe(8);
      expect(warrior.baseStats[PrimaryStat.Stamina]).toBe(22);
      expect(warrior.baseStats[PrimaryStat.Spirit]).toBe(10);
      expect(warrior.classBaseHp).toBe(100);
    });

    it("should have correct specs", () => {
      const warrior = classesJson.find((c: any) => c.id === ClassName.Warrior);
      expect(warrior.specs).toEqual([TalentSpec.Protection, TalentSpec.Arms, TalentSpec.Fury]);
    });
  });

  describe("Mage class per design doc", () => {
    it("should have correct resource and stats", () => {
      const mage = classesJson.find((c: any) => c.id === ClassName.Mage);
      expect(mage).toBeDefined();
      expect(mage.resourceType).toBe(ResourceType.Mana);
      expect(mage.baseStats[PrimaryStat.Strength]).toBe(5);
      expect(mage.baseStats[PrimaryStat.Agility]).toBe(10);
      expect(mage.baseStats[PrimaryStat.Intellect]).toBe(28);
      expect(mage.baseStats[PrimaryStat.Stamina]).toBe(12);
      expect(mage.baseStats[PrimaryStat.Spirit]).toBe(20);
      expect(mage.classBaseHp).toBe(50);
      expect(mage.classBaseMana).toBe(200);
    });

    it("should have correct specs", () => {
      const mage = classesJson.find((c: any) => c.id === ClassName.Mage);
      expect(mage.specs).toEqual([TalentSpec.FireMage, TalentSpec.FrostMage, TalentSpec.ArcaneMage]);
    });
  });

  describe("Cleric class per design doc", () => {
    it("should have correct resource and stats", () => {
      const cleric = classesJson.find((c: any) => c.id === ClassName.Cleric);
      expect(cleric).toBeDefined();
      expect(cleric.resourceType).toBe(ResourceType.Mana);
      expect(cleric.baseStats[PrimaryStat.Strength]).toBe(18);
      expect(cleric.baseStats[PrimaryStat.Agility]).toBe(10);
      expect(cleric.baseStats[PrimaryStat.Intellect]).toBe(20);
      expect(cleric.baseStats[PrimaryStat.Stamina]).toBe(20);
      expect(cleric.baseStats[PrimaryStat.Spirit]).toBe(22);
      expect(cleric.classBaseHp).toBe(80);
      expect(cleric.classBaseMana).toBe(150);
    });

    it("should have correct specs", () => {
      const cleric = classesJson.find((c: any) => c.id === ClassName.Cleric);
      expect(cleric.specs).toEqual([TalentSpec.Holy, TalentSpec.Discipline, TalentSpec.Retribution]);
    });
  });

  describe("Rogue class per design doc", () => {
    it("should have correct resource and stats", () => {
      const rogue = classesJson.find((c: any) => c.id === ClassName.Rogue);
      expect(rogue).toBeDefined();
      expect(rogue.resourceType).toBe(ResourceType.Energy);
      expect(rogue.baseStats[PrimaryStat.Strength]).toBe(12);
      expect(rogue.baseStats[PrimaryStat.Agility]).toBe(28);
      expect(rogue.baseStats[PrimaryStat.Intellect]).toBe(5);
      expect(rogue.baseStats[PrimaryStat.Stamina]).toBe(18);
      expect(rogue.baseStats[PrimaryStat.Spirit]).toBe(10);
      expect(rogue.classBaseHp).toBe(70);
    });

    it("should have correct specs", () => {
      const rogue = classesJson.find((c: any) => c.id === ClassName.Rogue);
      expect(rogue.specs).toEqual([TalentSpec.Assassination, TalentSpec.Combat, TalentSpec.Subtlety]);
    });
  });

  describe("Ranger class per design doc", () => {
    it("should have correct resource and stats", () => {
      const ranger = classesJson.find((c: any) => c.id === ClassName.Ranger);
      expect(ranger).toBeDefined();
      expect(ranger.resourceType).toBe(ResourceType.Focus);
      expect(ranger.baseStats[PrimaryStat.Strength]).toBe(12);
      expect(ranger.baseStats[PrimaryStat.Agility]).toBe(25);
      expect(ranger.baseStats[PrimaryStat.Intellect]).toBe(10);
      expect(ranger.baseStats[PrimaryStat.Stamina]).toBe(18);
      expect(ranger.baseStats[PrimaryStat.Spirit]).toBe(12);
      expect(ranger.classBaseHp).toBe(70);
    });

    it("should have correct specs", () => {
      const ranger = classesJson.find((c: any) => c.id === ClassName.Ranger);
      expect(ranger.specs).toEqual([TalentSpec.Marksmanship, TalentSpec.BeastMastery, TalentSpec.Survival]);
    });
  });

  describe("Druid class per design doc", () => {
    it("should have correct resource and stats", () => {
      const druid = classesJson.find((c: any) => c.id === ClassName.Druid);
      expect(druid).toBeDefined();
      expect(druid.resourceType).toBe(ResourceType.Mana);
      expect(druid.baseStats[PrimaryStat.Strength]).toBe(14);
      expect(druid.baseStats[PrimaryStat.Agility]).toBe(14);
      expect(druid.baseStats[PrimaryStat.Intellect]).toBe(22);
      expect(druid.baseStats[PrimaryStat.Stamina]).toBe(16);
      expect(druid.baseStats[PrimaryStat.Spirit]).toBe(20);
      expect(druid.classBaseHp).toBe(70);
      expect(druid.classBaseMana).toBe(130);
    });

    it("should have correct specs", () => {
      const druid = classesJson.find((c: any) => c.id === ClassName.Druid);
      expect(druid.specs).toEqual([TalentSpec.RestorationDruid, TalentSpec.Feral, TalentSpec.Balance]);
    });
  });

  describe("Necromancer class per design doc", () => {
    it("should have correct resource and stats", () => {
      const necromancer = classesJson.find((c: any) => c.id === ClassName.Necromancer);
      expect(necromancer).toBeDefined();
      expect(necromancer.resourceType).toBe(ResourceType.Mana);
      expect(necromancer.baseStats[PrimaryStat.Strength]).toBe(5);
      expect(necromancer.baseStats[PrimaryStat.Agility]).toBe(8);
      expect(necromancer.baseStats[PrimaryStat.Intellect]).toBe(26);
      expect(necromancer.baseStats[PrimaryStat.Stamina]).toBe(14);
      expect(necromancer.baseStats[PrimaryStat.Spirit]).toBe(18);
      expect(necromancer.classBaseHp).toBe(50);
      expect(necromancer.classBaseMana).toBe(180);
    });

    it("should have correct specs", () => {
      const necromancer = classesJson.find((c: any) => c.id === ClassName.Necromancer);
      expect(necromancer.specs).toEqual([TalentSpec.Affliction, TalentSpec.Demonology, TalentSpec.Destruction]);
    });
  });

  describe("Shaman class per design doc", () => {
    it("should have correct resource and stats", () => {
      const shaman = classesJson.find((c: any) => c.id === ClassName.Shaman);
      expect(shaman).toBeDefined();
      expect(shaman.resourceType).toBe(ResourceType.Mana);
      expect(shaman.baseStats[PrimaryStat.Strength]).toBe(16);
      expect(shaman.baseStats[PrimaryStat.Agility]).toBe(12);
      expect(shaman.baseStats[PrimaryStat.Intellect]).toBe(20);
      expect(shaman.baseStats[PrimaryStat.Stamina]).toBe(18);
      expect(shaman.baseStats[PrimaryStat.Spirit]).toBe(18);
      expect(shaman.classBaseHp).toBe(75);
      expect(shaman.classBaseMana).toBe(140);
    });

    it("should have correct specs", () => {
      const shaman = classesJson.find((c: any) => c.id === ClassName.Shaman);
      expect(shaman.specs).toEqual([TalentSpec.Elemental, TalentSpec.Enhancement, TalentSpec.RestorationShaman]);
    });
  });

  it("should have all classes with exactly 3 specs", () => {
    classesJson.forEach((c: any) => {
      expect(c.specs).toHaveLength(3);
    });
  });

  it("should have all classes with all 5 primary stats defined", () => {
    classesJson.forEach((c: any) => {
      expect(c.baseStats).toHaveProperty(PrimaryStat.Strength);
      expect(c.baseStats).toHaveProperty(PrimaryStat.Agility);
      expect(c.baseStats).toHaveProperty(PrimaryStat.Intellect);
      expect(c.baseStats).toHaveProperty(PrimaryStat.Stamina);
      expect(c.baseStats).toHaveProperty(PrimaryStat.Spirit);
    });
  });
});
