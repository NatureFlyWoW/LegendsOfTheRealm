// tests/game/data/schemas/stats.schema.test.ts

import { describe, it, expect } from "vitest";
import { statFormulasSchema, ratingConversionSchema, statCapSchema } from "@game/data/schemas/stats.schema";
import type { StatFormulas } from "@shared/definitions";

describe("stats.schema", () => {
  describe("ratingConversionSchema", () => {
    it("should validate a valid rating conversion", () => {
      const rating = {
        stat: "crit_rating",
        ratingPerPercent: 22,
      };
      expect(() => ratingConversionSchema.parse(rating)).not.toThrow();
    });

    it("should reject missing fields", () => {
      const rating = {
        stat: "crit_rating",
        // missing ratingPerPercent
      };
      expect(() => ratingConversionSchema.parse(rating)).toThrow();
    });
  });

  describe("statCapSchema", () => {
    it("should validate a stat cap with both soft and hard caps", () => {
      const cap = {
        stat: "armor",
        softCap: 25000,
        hardCap: 75000,
        description: "Armor has diminishing returns after 25k",
      };
      expect(() => statCapSchema.parse(cap)).not.toThrow();
    });

    it("should validate a stat cap with only soft cap", () => {
      const cap = {
        stat: "defense",
        softCap: 540,
        description: "Defense capped at 540 for raids",
      };
      expect(() => statCapSchema.parse(cap)).not.toThrow();
    });

    it("should validate a stat cap with only hard cap", () => {
      const cap = {
        stat: "spell_hit",
        hardCap: 16,
        description: "Spell hit capped at 16%",
      };
      expect(() => statCapSchema.parse(cap)).not.toThrow();
    });

    it("should reject missing description", () => {
      const cap = {
        stat: "armor",
        softCap: 25000,
      };
      expect(() => statCapSchema.parse(cap)).toThrow();
    });
  });

  describe("statFormulasSchema", () => {
    const validFormulas: StatFormulas = {
      health: { staminaMultiplier: 10 },
      mana: { intellectMultiplier: 15 },
      armorReduction: { constantBase: 400, levelMultiplier: 85 },
      critChance: { agilityDivisor: 52, intDivisor: 60, baseCritSuppression: 0.048 },
      dodge: { agilityDivisor: 40, diminishingReturnThreshold: 30 },
      parry: { basePercent: 5 },
      block: { basePercent: 5, strengthDivisor: 20 },
      ratingConversions: [
        { stat: "crit_rating", ratingPerPercent: 22 },
        { stat: "hit_rating", ratingPerPercent: 12.5 },
        { stat: "haste_rating", ratingPerPercent: 15 },
      ],
      caps: [
        { stat: "armor", softCap: 25000, hardCap: 75000, description: "Armor diminishing returns" },
        { stat: "defense", softCap: 540, description: "Defense cap" },
      ],
    };

    it("should validate a complete valid stat formulas object", () => {
      expect(() => statFormulasSchema.parse(validFormulas)).not.toThrow();
    });

    it("should reject missing health field", () => {
      const invalid = {
        ...validFormulas,
        health: undefined,
      };
      expect(() => statFormulasSchema.parse(invalid)).toThrow();
    });

    it("should reject missing mana field", () => {
      const invalid = {
        ...validFormulas,
        mana: undefined,
      };
      expect(() => statFormulasSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid armorReduction structure", () => {
      const invalid = {
        ...validFormulas,
        armorReduction: { constantBase: 400 }, // missing levelMultiplier
      };
      expect(() => statFormulasSchema.parse(invalid)).toThrow();
    });

    it("should reject invalid critChance structure", () => {
      const invalid = {
        ...validFormulas,
        critChance: { agilityDivisor: 52 }, // missing other fields
      };
      expect(() => statFormulasSchema.parse(invalid)).toThrow();
    });

    it("should validate with empty rating conversions", () => {
      const formulas = {
        ...validFormulas,
        ratingConversions: [],
      };
      expect(() => statFormulasSchema.parse(formulas)).not.toThrow();
    });

    it("should validate with empty caps", () => {
      const formulas = {
        ...validFormulas,
        caps: [],
      };
      expect(() => statFormulasSchema.parse(formulas)).not.toThrow();
    });

    it("should parse and return the validated data", () => {
      const result = statFormulasSchema.parse(validFormulas);
      expect(result).toEqual(validFormulas);
      expect(result.health.staminaMultiplier).toBe(10);
      expect(result.ratingConversions).toHaveLength(3);
    });
  });
});
