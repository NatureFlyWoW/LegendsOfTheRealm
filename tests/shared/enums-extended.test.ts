// tests/shared/enums-extended.test.ts
import { describe, test, expect } from "vitest";
import { WeaponType, ArmorType, TalentSpec } from "@shared/enums";

describe("WeaponType enum", () => {
  test("has 13 weapon types", () => {
    expect(Object.values(WeaponType)).toHaveLength(13);
  });

  test("includes all expected weapon types", () => {
    expect(WeaponType.Sword1H).toBe("sword_1h");
    expect(WeaponType.Sword2H).toBe("sword_2h");
    expect(WeaponType.Dagger).toBe("dagger");
    expect(WeaponType.Staff).toBe("staff");
    expect(WeaponType.Bow).toBe("bow");
    expect(WeaponType.Shield).toBe("shield");
    expect(WeaponType.Wand).toBe("wand");
  });
});

describe("ArmorType enum", () => {
  test("has 4 armor types", () => {
    expect(Object.values(ArmorType)).toHaveLength(4);
  });

  test("includes cloth through plate", () => {
    expect(ArmorType.Cloth).toBe("cloth");
    expect(ArmorType.Leather).toBe("leather");
    expect(ArmorType.Mail).toBe("mail");
    expect(ArmorType.Plate).toBe("plate");
  });
});

describe("TalentSpec enum", () => {
  test("has exactly 24 specs (3 per class x 8 classes)", () => {
    expect(Object.values(TalentSpec)).toHaveLength(24);
  });

  test("includes warrior specs", () => {
    expect(TalentSpec.Protection).toBe("protection");
    expect(TalentSpec.Arms).toBe("arms");
    expect(TalentSpec.Fury).toBe("fury");
  });

  test("includes mage specs", () => {
    expect(TalentSpec.FireMage).toBe("fire");
    expect(TalentSpec.FrostMage).toBe("frost");
    expect(TalentSpec.ArcaneMage).toBe("arcane");
  });

  test("includes cleric specs", () => {
    expect(TalentSpec.Holy).toBe("holy");
    expect(TalentSpec.Discipline).toBe("discipline");
    expect(TalentSpec.Retribution).toBe("retribution");
  });

  test("includes rogue specs", () => {
    expect(TalentSpec.Assassination).toBe("assassination");
    expect(TalentSpec.Combat).toBe("combat");
    expect(TalentSpec.Subtlety).toBe("subtlety");
  });
});
