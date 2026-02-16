// tests/game/data/content/stats.test.ts

import { describe, it, expect } from "vitest";
import { statFormulasSchema } from "@game/data/schemas/stats.schema";
import statsJson from "@game/data/content/stats.json";
import { HP_PER_STAMINA, MANA_PER_INTELLECT, ARMOR_CONSTANT_BASE, ARMOR_CONSTANT_PER_LEVEL, RATING_CONVERSIONS } from "@shared/constants";

describe("stats.json", () => {
  it("should load and parse the stats JSON file", () => {
    expect(statsJson).toBeDefined();
  });

  it("should validate against the stat formulas schema", () => {
    expect(() => statFormulasSchema.parse(statsJson)).not.toThrow();
  });

  describe("Health formula per constants", () => {
    it("should match HP_PER_STAMINA constant", () => {
      expect(statsJson.health.staminaMultiplier).toBe(HP_PER_STAMINA);
      expect(statsJson.health.staminaMultiplier).toBe(10);
    });
  });

  describe("Mana formula per constants", () => {
    it("should match MANA_PER_INTELLECT constant", () => {
      expect(statsJson.mana.intellectMultiplier).toBe(MANA_PER_INTELLECT);
      expect(statsJson.mana.intellectMultiplier).toBe(15);
    });
  });

  describe("Armor reduction formula per constants", () => {
    it("should match ARMOR_CONSTANT_BASE constant", () => {
      expect(statsJson.armorReduction.constantBase).toBe(ARMOR_CONSTANT_BASE);
      expect(statsJson.armorReduction.constantBase).toBe(400);
    });

    it("should match ARMOR_CONSTANT_PER_LEVEL constant", () => {
      expect(statsJson.armorReduction.levelMultiplier).toBe(ARMOR_CONSTANT_PER_LEVEL);
      expect(statsJson.armorReduction.levelMultiplier).toBe(85);
    });
  });

  describe("Rating conversions per constants", () => {
    it("should include crit rating conversion", () => {
      const critRating = statsJson.ratingConversions.find((r: any) => r.stat === "crit_rating");
      expect(critRating).toBeDefined();
      expect(critRating.ratingPerPercent).toBe(RATING_CONVERSIONS.critRating);
      expect(critRating.ratingPerPercent).toBe(22);
    });

    it("should include hit rating conversion", () => {
      const hitRating = statsJson.ratingConversions.find((r: any) => r.stat === "hit_rating");
      expect(hitRating).toBeDefined();
      expect(hitRating.ratingPerPercent).toBe(RATING_CONVERSIONS.hitRating);
      expect(hitRating.ratingPerPercent).toBe(12.5);
    });

    it("should include haste rating conversion", () => {
      const hasteRating = statsJson.ratingConversions.find((r: any) => r.stat === "haste_rating");
      expect(hasteRating).toBeDefined();
      expect(hasteRating.ratingPerPercent).toBe(RATING_CONVERSIONS.hasteRating);
      expect(hasteRating.ratingPerPercent).toBe(15);
    });

    it("should include defense rating conversion", () => {
      const defenseRating = statsJson.ratingConversions.find((r: any) => r.stat === "defense_rating");
      expect(defenseRating).toBeDefined();
      expect(defenseRating.ratingPerPercent).toBe(RATING_CONVERSIONS.defenseRating);
      expect(defenseRating.ratingPerPercent).toBe(2.5);
    });

    it("should include dodge rating conversion", () => {
      const dodgeRating = statsJson.ratingConversions.find((r: any) => r.stat === "dodge_rating");
      expect(dodgeRating).toBeDefined();
      expect(dodgeRating.ratingPerPercent).toBe(RATING_CONVERSIONS.dodgeRating);
      expect(dodgeRating.ratingPerPercent).toBe(18);
    });

    it("should include parry rating conversion", () => {
      const parryRating = statsJson.ratingConversions.find((r: any) => r.stat === "parry_rating");
      expect(parryRating).toBeDefined();
      expect(parryRating.ratingPerPercent).toBe(RATING_CONVERSIONS.parryRating);
      expect(parryRating.ratingPerPercent).toBe(20);
    });

    it("should include block rating conversion", () => {
      const blockRating = statsJson.ratingConversions.find((r: any) => r.stat === "block_rating");
      expect(blockRating).toBeDefined();
      expect(blockRating.ratingPerPercent).toBe(RATING_CONVERSIONS.blockRating);
      expect(blockRating.ratingPerPercent).toBe(5);
    });

    it("should include resilience conversion", () => {
      const resilience = statsJson.ratingConversions.find((r: any) => r.stat === "resilience");
      expect(resilience).toBeDefined();
      expect(resilience.ratingPerPercent).toBe(RATING_CONVERSIONS.resilience);
      expect(resilience.ratingPerPercent).toBe(25);
    });
  });

  describe("Stat caps per design doc", () => {
    it("should include melee hit cap", () => {
      const meleeHitCap = statsJson.caps.find((c: any) => c.stat === "melee_hit");
      expect(meleeHitCap).toBeDefined();
      expect(meleeHitCap.hardCap).toBeDefined();
      expect(meleeHitCap.description).toBeTruthy();
    });

    it("should include spell hit cap", () => {
      const spellHitCap = statsJson.caps.find((c: any) => c.stat === "spell_hit");
      expect(spellHitCap).toBeDefined();
      expect(spellHitCap.hardCap).toBeDefined();
      expect(spellHitCap.description).toBeTruthy();
    });

    it("should include defense cap", () => {
      const defenseCap = statsJson.caps.find((c: any) => c.stat === "defense");
      expect(defenseCap).toBeDefined();
      expect(defenseCap.softCap).toBeDefined();
      expect(defenseCap.description).toBeTruthy();
    });

    it("should include armor cap with diminishing returns", () => {
      const armorCap = statsJson.caps.find((c: any) => c.stat === "armor");
      expect(armorCap).toBeDefined();
      expect(armorCap.softCap).toBeDefined();
      expect(armorCap.hardCap).toBeDefined();
      expect(armorCap.description).toBeTruthy();
    });
  });

  it("should have valid crit chance formula", () => {
    expect(statsJson.critChance).toBeDefined();
    expect(statsJson.critChance.agilityDivisor).toBeGreaterThan(0);
    expect(statsJson.critChance.intDivisor).toBeGreaterThan(0);
    expect(statsJson.critChance.baseCritSuppression).toBeDefined();
  });

  it("should have valid dodge formula", () => {
    expect(statsJson.dodge).toBeDefined();
    expect(statsJson.dodge.agilityDivisor).toBeGreaterThan(0);
    expect(statsJson.dodge.diminishingReturnThreshold).toBeGreaterThan(0);
  });

  it("should have valid parry formula", () => {
    expect(statsJson.parry).toBeDefined();
    expect(statsJson.parry.basePercent).toBeGreaterThanOrEqual(0);
  });

  it("should have valid block formula", () => {
    expect(statsJson.block).toBeDefined();
    expect(statsJson.block.basePercent).toBeGreaterThanOrEqual(0);
    expect(statsJson.block.strengthDivisor).toBeGreaterThan(0);
  });
});
