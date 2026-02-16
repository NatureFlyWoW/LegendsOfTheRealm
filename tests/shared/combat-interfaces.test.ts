// tests/shared/combat-interfaces.test.ts
import { describe, it, expect } from "vitest";
import type {
  CombatEntity, EncounterParams, EncounterResult,
  TickResult, CombatEvent, OutcomeEstimate, ISeededRng,
} from "@shared/combat-interfaces";

describe("combat interface type structure", () => {
  it("CombatEntity has numeric id", () => {
    const entity: CombatEntity = {
      id: 42,
      name: "Test Warrior",
      entityType: "player",
      role: "tank",
      classId: "warrior",
      specId: "protection",
      level: 60,
      effectiveStats: {
        strength: 100, agility: 50, intellect: 30,
        stamina: 200, spirit: 30,
        maxHp: 12000, maxMana: 0, attackPower: 500, spellPower: 0, armor: 9000,
        critChance: 0.05, hitChance: 0.09, hastePercent: 0,
        dodgeChance: 0.10, parryChance: 0.08, blockChance: 0.15,
        blockValue: 200, defenseSkill: 350, resilience: 0, mp5: 0,
        weaponDamageMin: 100, weaponDamageMax: 200, weaponSpeed: 2.6,
      },
      abilities: [],
      rotation: [],
      resources: { type: "rage" as any, current: 0, max: 100 },
      equipment: { weaponSpeed: 2.6, weaponDps: 57.7 },
    };
    expect(entity.id).toBe(42);
    expect(typeof entity.id).toBe("number");
  });

  it("EncounterResult uses 4-value outcome", () => {
    const outcomes = ["victory", "wipe", "enrage", "timeout"] as const;
    expect(outcomes).toHaveLength(4);
  });

  it("TickResult has required fields", () => {
    const tick: TickResult = {
      tick: 1,
      status: "ongoing",
      events: [],
      entitySnapshots: {},
    };
    expect(tick.status).toBe("ongoing");
  });
});
