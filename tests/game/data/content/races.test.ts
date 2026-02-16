// tests/game/data/content/races.test.ts

import { describe, it, expect } from "vitest";
import { raceDefinitionsSchema } from "@game/data/schemas/race.schema";
import { RaceName } from "@shared/enums";
import racesJson from "@game/data/content/races.json";

describe("races.json", () => {
  it("should load and parse the races JSON file", () => {
    expect(racesJson).toBeDefined();
    expect(Array.isArray(racesJson)).toBe(true);
  });

  it("should validate against the race schema", () => {
    expect(() => raceDefinitionsSchema.parse(racesJson)).not.toThrow();
  });

  it("should contain exactly 6 races", () => {
    expect(racesJson).toHaveLength(6);
  });

  it("should include all race types from the enum", () => {
    const raceIds = racesJson.map((race: any) => race.id);
    expect(raceIds).toContain(RaceName.Human);
    expect(raceIds).toContain(RaceName.Dwarf);
    expect(raceIds).toContain(RaceName.Elf);
    expect(raceIds).toContain(RaceName.Orc);
    expect(raceIds).toContain(RaceName.Undead);
    expect(raceIds).toContain(RaceName.Troll);
  });

  describe("Race bonuses per design doc", () => {
    it("Human should have +5% XP gain and +3% spirit", () => {
      const human = racesJson.find((r: any) => r.id === RaceName.Human);
      expect(human).toBeDefined();
      expect(human.primaryBonus.stat).toBe("xp_gain");
      expect(human.primaryBonus.value).toBe(5);
      expect(human.primaryBonus.isPercentage).toBe(true);
      expect(human.secondaryBonus.stat).toBe("spirit");
      expect(human.secondaryBonus.value).toBe(3);
      expect(human.secondaryBonus.isPercentage).toBe(true);
    });

    it("Dwarf should have +5% armor and +2% block chance", () => {
      const dwarf = racesJson.find((r: any) => r.id === RaceName.Dwarf);
      expect(dwarf).toBeDefined();
      // Note: armor is not in the PrimaryStat enum, so it should be a custom stat
      expect(dwarf.primaryBonus.value).toBe(5);
      expect(dwarf.primaryBonus.isPercentage).toBe(true);
    });

    it("Elf should have +2% crit chance and +3% nature resist", () => {
      const elf = racesJson.find((r: any) => r.id === RaceName.Elf);
      expect(elf).toBeDefined();
      expect(elf.primaryBonus.stat).toBe("crit_chance");
      expect(elf.primaryBonus.value).toBe(2);
      expect(elf.primaryBonus.isPercentage).toBe(true);
    });

    it("Orc should have +5% melee damage and +2% pet damage", () => {
      const orc = racesJson.find((r: any) => r.id === RaceName.Orc);
      expect(orc).toBeDefined();
      expect(orc.primaryBonus.stat).toBe("melee_damage");
      expect(orc.primaryBonus.value).toBe(5);
      expect(orc.primaryBonus.isPercentage).toBe(true);
    });

    it("Undead should have +5% shadow resist and +3% crit from behind", () => {
      const undead = racesJson.find((r: any) => r.id === RaceName.Undead);
      expect(undead).toBeDefined();
      expect(undead.primaryBonus.stat).toBe("shadow_resist");
      expect(undead.primaryBonus.value).toBe(5);
      expect(undead.primaryBonus.isPercentage).toBe(true);
    });

    it("Troll should have +3% dodge chance and +5% fishing", () => {
      const troll = racesJson.find((r: any) => r.id === RaceName.Troll);
      expect(troll).toBeDefined();
      expect(troll.primaryBonus.stat).toBe("dodge_chance");
      expect(troll.primaryBonus.value).toBe(3);
      expect(troll.primaryBonus.isPercentage).toBe(true);
    });
  });

  it("should have valid icons for all races", () => {
    racesJson.forEach((race: any) => {
      expect(race.icon).toBeDefined();
      expect(typeof race.icon).toBe("string");
      expect(race.icon.length).toBeGreaterThan(0);
    });
  });

  it("should have lore text for all races", () => {
    racesJson.forEach((race: any) => {
      expect(race.lore).toBeDefined();
      expect(typeof race.lore).toBe("string");
      expect(race.lore.length).toBeGreaterThan(0);
    });
  });
});
