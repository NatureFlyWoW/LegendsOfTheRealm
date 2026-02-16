import { describe, test, expect, beforeEach } from "vitest";
import { getRace, getClass, getAllRaces, getAllClasses, getStatFormulas, resetCache } from "@game/data";
import { RaceName, ClassName } from "@shared/enums";

beforeEach(() => resetCache());

describe("Data Public API", () => {
  test("getRace returns Human", () => {
    const human = getRace(RaceName.Human);
    expect(human).toBeDefined();
    expect(human!.name).toBe("Human");
  });

  test("getRace returns undefined for invalid id", () => {
    expect(getRace("invalid" as any)).toBeUndefined();
  });

  test("getClass returns Warrior", () => {
    const warrior = getClass(ClassName.Warrior);
    expect(warrior).toBeDefined();
    expect(warrior!.name).toBe("Warrior");
    expect(warrior!.specs).toHaveLength(3);
  });

  test("getClass returns undefined for invalid id", () => {
    expect(getClass("invalid" as any)).toBeUndefined();
  });

  test("getAllRaces returns 6 races", () => {
    expect(getAllRaces()).toHaveLength(6);
  });

  test("getAllClasses returns 8 classes", () => {
    expect(getAllClasses()).toHaveLength(8);
  });

  test("getStatFormulas returns stats", () => {
    const stats = getStatFormulas();
    expect(stats.health.staminaMultiplier).toBe(10);
    expect(stats.mana.intellectMultiplier).toBe(15);
  });
});
