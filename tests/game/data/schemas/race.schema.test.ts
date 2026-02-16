// tests/game/data/schemas/race.schema.test.ts

import { describe, it, expect } from "vitest";
import { raceDefinitionSchema, racialBonusSchema } from "@game/data/schemas/race.schema";
import { RaceName, PrimaryStat } from "@shared/enums";
import type { RaceDefinition } from "@shared/definitions";

describe("race.schema", () => {
  describe("racialBonusSchema", () => {
    it("should validate a valid primary stat bonus", () => {
      const bonus = {
        stat: "strength" as PrimaryStat,
        value: 5,
        isPercentage: true,
      };
      expect(() => racialBonusSchema.parse(bonus)).not.toThrow();
    });

    it("should validate a valid non-stat bonus", () => {
      const bonus = {
        stat: "xp_gain",
        value: 5,
        isPercentage: true,
      };
      expect(() => racialBonusSchema.parse(bonus)).not.toThrow();
    });

    it("should reject missing fields", () => {
      const bonus = {
        stat: "strength",
        value: 5,
        // missing isPercentage
      };
      expect(() => racialBonusSchema.parse(bonus)).toThrow();
    });

    it("should reject invalid stat values", () => {
      const bonus = {
        stat: "invalid_stat",
        value: 5,
        isPercentage: true,
      };
      expect(() => racialBonusSchema.parse(bonus)).toThrow();
    });
  });

  describe("raceDefinitionSchema", () => {
    const validRace: RaceDefinition = {
      id: RaceName.Human,
      name: "Human",
      lore: "Adaptable and versatile, humans are the most populous race.",
      primaryBonus: {
        stat: "xp_gain",
        value: 5,
        isPercentage: true,
      },
      secondaryBonus: {
        stat: "spirit",
        value: 3,
        isPercentage: true,
      },
      professionBonuses: [
        { profession: "diplomacy", value: 10 },
      ],
      icon: "☺",
    };

    it("should validate a complete valid race definition", () => {
      expect(() => raceDefinitionSchema.parse(validRace)).not.toThrow();
    });

    it("should reject invalid race enum value", () => {
      const invalidRace = {
        ...validRace,
        id: "invalid_race",
      };
      expect(() => raceDefinitionSchema.parse(invalidRace)).toThrow();
    });

    it("should reject missing required fields", () => {
      const invalidRace = {
        id: RaceName.Dwarf,
        name: "Dwarf",
        // missing lore and bonuses
      };
      expect(() => raceDefinitionSchema.parse(invalidRace)).toThrow();
    });

    it("should validate race with empty profession bonuses", () => {
      const race = {
        ...validRace,
        professionBonuses: [],
      };
      expect(() => raceDefinitionSchema.parse(race)).not.toThrow();
    });

    it("should validate race with multiple profession bonuses", () => {
      const race: RaceDefinition = {
        ...validRace,
        professionBonuses: [
          { profession: "mining", value: 5 },
          { profession: "blacksmithing", value: 5 },
        ],
      };
      expect(() => raceDefinitionSchema.parse(race)).not.toThrow();
    });

    it("should parse and return the validated data", () => {
      const result = raceDefinitionSchema.parse(validRace);
      expect(result).toEqual(validRace);
      expect(result.id).toBe(RaceName.Human);
    });
  });
});
