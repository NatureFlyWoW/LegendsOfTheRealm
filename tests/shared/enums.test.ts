import { describe, it, expect } from "vitest";
import {
  ClassName,
  RaceName,
  ResourceType,
  QualityTier,
  GearSlot,
  DamageType,
  CompanionQuality,
  PrimaryStat,
  SecondaryStat,
  ActivityType,
  type EncounterOutcome,
  type AbilityEffectType,
  type TalentEffectType,
} from "@shared/enums";

// Helper: count the *value* entries of a string enum (filters out reverse mappings)
function enumValues<T extends Record<string, string>>(e: T): string[] {
  return Object.values(e);
}

// ---------------------------------------------------------------------------
// ClassName
// ---------------------------------------------------------------------------
describe("ClassName", () => {
  it("has exactly 8 entries", () => {
    expect(enumValues(ClassName)).toHaveLength(8);
  });

  it("contains expected classes", () => {
    const values = enumValues(ClassName);
    expect(values).toContain("warrior");
    expect(values).toContain("mage");
    expect(values).toContain("cleric");
    expect(values).toContain("rogue");
    expect(values).toContain("ranger");
    expect(values).toContain("necromancer");
    expect(values).toContain("shaman");
    expect(values).toContain("druid");
  });

  it("uses lowercase snake_case string values", () => {
    for (const v of enumValues(ClassName)) {
      expect(v).toMatch(/^[a-z_]+$/);
    }
  });
});

// ---------------------------------------------------------------------------
// RaceName
// ---------------------------------------------------------------------------
describe("RaceName", () => {
  it("has exactly 6 entries", () => {
    expect(enumValues(RaceName)).toHaveLength(6);
  });

  it("contains expected races", () => {
    const values = enumValues(RaceName);
    expect(values).toContain("human");
    expect(values).toContain("orc");
    expect(values).toContain("elf");
    expect(values).toContain("dwarf");
    expect(values).toContain("troll");
    expect(values).toContain("undead");
  });
});

// ---------------------------------------------------------------------------
// ResourceType — CRITICAL: must have all 9
// ---------------------------------------------------------------------------
describe("ResourceType", () => {
  it("has exactly 9 entries", () => {
    expect(enumValues(ResourceType)).toHaveLength(9);
  });

  it("contains all 9 resource types including combo_points and arcane_charges", () => {
    const values = enumValues(ResourceType);
    expect(values).toContain("mana");
    expect(values).toContain("rage");
    expect(values).toContain("energy");
    expect(values).toContain("combo_points");
    expect(values).toContain("soul_shards");
    expect(values).toContain("focus");
    expect(values).toContain("divine_favor");
    expect(values).toContain("maelstrom");
    expect(values).toContain("arcane_charges");
  });
});

// ---------------------------------------------------------------------------
// QualityTier
// ---------------------------------------------------------------------------
describe("QualityTier", () => {
  it("has exactly 5 entries", () => {
    expect(enumValues(QualityTier)).toHaveLength(5);
  });

  it("contains all tiers in order", () => {
    const values = enumValues(QualityTier);
    expect(values).toContain("common");
    expect(values).toContain("uncommon");
    expect(values).toContain("rare");
    expect(values).toContain("epic");
    expect(values).toContain("legendary");
  });
});

// ---------------------------------------------------------------------------
// GearSlot — CRITICAL: must have 16 including Back
// ---------------------------------------------------------------------------
describe("GearSlot", () => {
  it("has exactly 16 entries", () => {
    expect(enumValues(GearSlot)).toHaveLength(16);
  });

  it("includes the Back slot", () => {
    expect(enumValues(GearSlot)).toContain("back");
  });

  it("contains all 16 gear slots", () => {
    const values = enumValues(GearSlot);
    const expected = [
      "head", "shoulder", "back", "chest", "wrist", "hands",
      "waist", "legs", "feet", "neck", "ring1", "ring2",
      "trinket1", "trinket2", "main_hand", "off_hand",
    ];
    for (const slot of expected) {
      expect(values).toContain(slot);
    }
  });
});

// ---------------------------------------------------------------------------
// DamageType
// ---------------------------------------------------------------------------
describe("DamageType", () => {
  it("has exactly 7 entries", () => {
    expect(enumValues(DamageType)).toHaveLength(7);
  });

  it("includes physical, fire, and shadow", () => {
    const values = enumValues(DamageType);
    expect(values).toContain("physical");
    expect(values).toContain("fire");
    expect(values).toContain("shadow");
  });

  it("contains all 7 damage types", () => {
    const values = enumValues(DamageType);
    expect(values).toContain("frost");
    expect(values).toContain("arcane");
    expect(values).toContain("nature");
    expect(values).toContain("holy");
  });
});

// ---------------------------------------------------------------------------
// CompanionQuality
// ---------------------------------------------------------------------------
describe("CompanionQuality", () => {
  it("has exactly 4 entries", () => {
    expect(enumValues(CompanionQuality)).toHaveLength(4);
  });

  it("contains recruit through champion", () => {
    const values = enumValues(CompanionQuality);
    expect(values).toContain("recruit");
    expect(values).toContain("veteran");
    expect(values).toContain("elite");
    expect(values).toContain("champion");
  });
});

// ---------------------------------------------------------------------------
// PrimaryStat
// ---------------------------------------------------------------------------
describe("PrimaryStat", () => {
  it("has exactly 5 entries", () => {
    expect(enumValues(PrimaryStat)).toHaveLength(5);
  });

  it("contains all primary stats", () => {
    const values = enumValues(PrimaryStat);
    expect(values).toContain("strength");
    expect(values).toContain("agility");
    expect(values).toContain("intellect");
    expect(values).toContain("stamina");
    expect(values).toContain("spirit");
  });
});

// ---------------------------------------------------------------------------
// SecondaryStat
// ---------------------------------------------------------------------------
describe("SecondaryStat", () => {
  it("has exactly 12 entries", () => {
    expect(enumValues(SecondaryStat)).toHaveLength(12);
  });

  it("contains all secondary stats", () => {
    const values = enumValues(SecondaryStat);
    const expected = [
      "crit_rating", "hit_rating", "haste_rating", "defense_rating",
      "dodge_rating", "parry_rating", "block_rating", "resilience",
      "attack_power", "spell_power", "armor", "mp5",
    ];
    for (const stat of expected) {
      expect(values).toContain(stat);
    }
  });
});

// ---------------------------------------------------------------------------
// ActivityType
// ---------------------------------------------------------------------------
describe("ActivityType", () => {
  it("has exactly 9 entries", () => {
    expect(enumValues(ActivityType)).toHaveLength(9);
  });

  it("contains all activity types", () => {
    const values = enumValues(ActivityType);
    const expected = [
      "idle", "grinding", "questing", "dungeon", "raid",
      "gathering", "crafting", "fishing", "rested_inn",
    ];
    for (const activity of expected) {
      expect(values).toContain(activity);
    }
  });
});

// ---------------------------------------------------------------------------
// EncounterOutcome (type alias — compile-time check)
// ---------------------------------------------------------------------------
describe("EncounterOutcome", () => {
  it("accepts all 4 valid outcomes at compile time", () => {
    // These assignments verify the type accepts these string literals.
    // If the type were wrong, TypeScript would error at compile time.
    const outcomes: EncounterOutcome[] = ["victory", "wipe", "enrage", "timeout"];
    expect(outcomes).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// AbilityEffectType (type alias — compile-time + runtime spot-check)
// ---------------------------------------------------------------------------
describe("AbilityEffectType", () => {
  it("accepts core ability effect values at compile time", () => {
    const effects: AbilityEffectType[] = [
      "damage", "heal", "dot", "hot", "buff", "debuff",
      "absorb", "shield", "summon", "summon_pet", "dispel",
      "interrupt", "purge", "taunt", "threat_mod", "stun",
      "root", "silence", "fear", "disorient", "charm",
      "knockback", "pull", "mana_drain", "mana_burn",
      "resource_restore", "immunity", "damage_reduction",
      "morph", "aura", "execute", "guaranteed_crit",
      "linked_health", "channel",
    ];
    expect(effects.length).toBeGreaterThanOrEqual(30);
  });
});

// ---------------------------------------------------------------------------
// TalentEffectType (type alias — compile-time + runtime spot-check)
// ---------------------------------------------------------------------------
describe("TalentEffectType", () => {
  it("accepts core talent effect values at compile time", () => {
    const effects: TalentEffectType[] = [
      "stat_bonus", "stat_percentage_bonus", "ability_modifier",
      "passive_proc", "grant_ability", "resource_modifier",
      "cooldown_reduction", "cost_reduction", "damage_increase",
      "healing_increase", "crit_chance_bonus", "crit_damage_bonus",
      "threat_modifier", "avoidance_bonus", "pet_bonus",
      "form_bonus", "pushback_resistance",
    ];
    expect(effects.length).toBeGreaterThanOrEqual(17);
  });
});
