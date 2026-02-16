# Phase 2: "First Blood" — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a playable level 1-5 idle loop: create a character, enter Greenhollow Vale, fight mobs, gain XP, equip loot, complete quests, close/reopen with offline gains.

**Architecture:** Data Sprint (2A) builds Zod schemas + minimal JSON content for abilities, items, zones, mobs, quests, loot tables, and XP curves. Vertical Slice (2B) wires combat orchestration (AbilitySystem, EncounterRunner), engine services (GameManager, CharacterService, etc.), and UI components (CharacterCreate, CharacterSheet, CombatLog, ZoneView).

**Tech Stack:** TypeScript 5+, Zod, Vitest, React 19, Zustand, Tailwind CSS v4, Electron, Kysely/SQLite

**Design doc:** `docs/plans/2026-02-16-phase2-first-blood-design.md`

**Parallel execution note:** Tasks 1-8 (Data Sprint) are independent and can execute in parallel. Task 9 (loader/API extension) depends on Tasks 1-8. Tasks 10-13 (Combat) depend on Task 9. Tasks 14-21 (Engine) depend on Task 10 (EventBus) and some on Task 13 (EncounterRunner). Tasks 22-27 (UI) depend on engine services being available via IPC. Task 28 (verification) depends on all.

---

## PHASE 2A: DATA SPRINT

---

### Task 1: Add LootTableDefinition type alias to definitions.ts

`LootTable` already exists in `src/shared/types.ts`. Add a `LootTableDefinition` alias in `definitions.ts` for naming consistency with other definition types.

**Files:**
- Modify: `src/shared/definitions.ts`

**Step 1: Add the type alias**

At the bottom of `src/shared/definitions.ts`, before the closing comment, add:

```typescript
// ============================================================
// Loot Table Definition (re-export from types.ts for naming consistency)
// ============================================================

export type { LootTable as LootTableDefinition } from "./types";
```

**Step 2: Run full test suite to check for regressions**

```bash
npx vitest run
```

Expected: All 532 tests pass. No regressions — this is only a type alias.

**Step 3: Commit**

```bash
git add src/shared/definitions.ts
git commit -m "feat: add LootTableDefinition alias for data schema consistency"
```

---

### Task 2: Ability Schema + Content

**Files:**
- Create: `src/game/data/schemas/ability.schema.ts`
- Create: `src/game/data/content/abilities.json`
- Create: `tests/game/data/schemas/ability.schema.test.ts`
- Create: `tests/game/data/content/abilities.test.ts`

**Step 1: Write the failing schema test**

```typescript
// tests/game/data/schemas/ability.schema.test.ts
import { describe, it, expect } from "vitest";
import { abilityDefinitionSchema } from "@game/data/schemas/ability.schema";
import { ClassName, ResourceType, DamageType } from "@shared/enums";

describe("ability.schema", () => {
  const validAbility = {
    id: "warrior_heroic_strike",
    name: "Heroic Strike",
    className: ClassName.Warrior,
    spec: null,
    description: "A powerful melee strike.",
    icon: { char: "!", fg: 9, bg: 0 },
    castTime: 0,
    cooldown: 0,
    globalCooldown: true,
    channeled: false,
    resourceCost: 15,
    resourceType: ResourceType.Rage,
    targetType: "enemy",
    range: 5,
    effects: [{
      type: "damage",
      damageType: DamageType.Physical,
      baseDamageMin: 10,
      baseDamageMax: 14,
      coefficient: 1.0,
      scalingStat: "attack_power",
    }],
    aiPriority: 1,
  };

  it("validates a complete ability definition", () => {
    expect(() => abilityDefinitionSchema.parse(validAbility)).not.toThrow();
  });

  it("rejects invalid className", () => {
    expect(() => abilityDefinitionSchema.parse({ ...validAbility, className: "invalid" })).toThrow();
  });

  it("rejects invalid resourceType", () => {
    expect(() => abilityDefinitionSchema.parse({ ...validAbility, resourceType: "invalid" })).toThrow();
  });

  it("rejects missing effects array", () => {
    const { effects, ...noEffects } = validAbility;
    expect(() => abilityDefinitionSchema.parse(noEffects)).toThrow();
  });

  it("validates ability with optional fields", () => {
    const withOptionals = {
      ...validAbility,
      aoeRadius: 10,
      maxTargets: 5,
      aiCondition: "self_resource_above:50",
      channelDuration: 3,
    };
    expect(() => abilityDefinitionSchema.parse(withOptionals)).not.toThrow();
  });

  it("allows spec to be null for base class abilities", () => {
    const result = abilityDefinitionSchema.parse(validAbility);
    expect(result.spec).toBeNull();
  });

  it("validates spec when provided", () => {
    const withSpec = { ...validAbility, spec: "protection" };
    expect(() => abilityDefinitionSchema.parse(withSpec)).not.toThrow();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/game/data/schemas/ability.schema.test.ts
```

Expected: FAIL — module `@game/data/schemas/ability.schema` not found.

**Step 3: Implement ability schema**

```typescript
// src/game/data/schemas/ability.schema.ts
import { z } from "zod";
import { ClassName, ResourceType, DamageType, PrimaryStat, TalentSpec } from "@shared/enums";

const asciiIconSchema = z.object({
  char: z.string(),
  fg: z.number(),
  bg: z.number(),
});

const abilityEffectSchema = z.object({
  type: z.string(),
  damageType: z.nativeEnum(DamageType).optional(),
  baseDamageMin: z.number().optional(),
  baseDamageMax: z.number().optional(),
  coefficient: z.number(),
  scalingStat: z.union([
    z.nativeEnum(PrimaryStat),
    z.enum(["attack_power", "spell_power", "weapon_dps"]),
  ]),
  duration: z.number().optional(),
  tickInterval: z.number().optional(),
  stacks: z.number().optional(),
  threatMultiplier: z.number().optional(),
  dispellable: z.boolean().optional(),
  procChance: z.number().optional(),
});

export const abilityDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  className: z.nativeEnum(ClassName),
  spec: z.nativeEnum(TalentSpec).nullable(),
  description: z.string(),
  icon: asciiIconSchema,
  castTime: z.number(),
  cooldown: z.number(),
  globalCooldown: z.boolean(),
  channeled: z.boolean(),
  channelDuration: z.number().optional(),
  resourceCost: z.number(),
  resourceType: z.nativeEnum(ResourceType),
  targetType: z.enum(["self", "enemy", "friendly", "aoe_ground", "aoe_self", "cone"]),
  range: z.number(),
  aoeRadius: z.number().optional(),
  maxTargets: z.number().optional(),
  effects: z.array(abilityEffectSchema),
  aiPriority: z.number(),
  aiCondition: z.string().optional(),
});

export const abilityDefinitionsSchema = z.array(abilityDefinitionSchema);

export type AbilityDefinitionSchema = z.infer<typeof abilityDefinitionSchema>;
```

**Step 4: Run schema test to verify it passes**

```bash
npx vitest run tests/game/data/schemas/ability.schema.test.ts
```

Expected: PASS.

**Step 5: Create abilities.json content**

Create `src/game/data/content/abilities.json` with 2 abilities per class (16 total). Every class gets:
1. A basic attack (instant, low cost, short cooldown) — the spammable filler
2. A signature ability (may have cast time, higher cost/cooldown, more damage)

The JSON must use exact enum string values from `src/shared/enums.ts`. All abilities are spec=null (available to all specs at level 1). Use `aiPriority` where 1 = highest priority (use first if available), 2 = filler.

Content for abilities.json: 16 abilities (2 per class). Reference the design doc for ability names. All abilities target "enemy" (no heals — Cleric gets Smite + Holy Fire instead of heal, since healing requires friendly targets which zone grinding doesn't have yet).

**Step 6: Write the content validation test**

```typescript
// tests/game/data/content/abilities.test.ts
import { describe, it, expect } from "vitest";
import { abilityDefinitionsSchema } from "@game/data/schemas/ability.schema";
import { ClassName } from "@shared/enums";
import abilitiesJson from "@game/data/content/abilities.json";

describe("abilities.json", () => {
  it("loads and parses the abilities JSON file", () => {
    expect(abilitiesJson).toBeDefined();
    expect(Array.isArray(abilitiesJson)).toBe(true);
  });

  it("validates against the ability schema", () => {
    expect(() => abilityDefinitionsSchema.parse(abilitiesJson)).not.toThrow();
  });

  it("contains 16 abilities (2 per class)", () => {
    expect(abilitiesJson).toHaveLength(16);
  });

  it("has abilities for every class", () => {
    const classNames = abilitiesJson.map((a: any) => a.className);
    for (const cls of Object.values(ClassName)) {
      expect(classNames.filter((c: string) => c === cls).length).toBe(2);
    }
  });

  it("all abilities have spec=null (base class abilities)", () => {
    for (const ability of abilitiesJson as any[]) {
      expect(ability.spec).toBeNull();
    }
  });

  it("all abilities have at least one effect", () => {
    for (const ability of abilitiesJson as any[]) {
      expect(ability.effects.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all abilities have unique IDs", () => {
    const ids = (abilitiesJson as any[]).map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Warrior has Heroic Strike and Battle Shout", () => {
    const warriorAbilities = (abilitiesJson as any[]).filter(a => a.className === ClassName.Warrior);
    const names = warriorAbilities.map((a: any) => a.name);
    expect(names).toContain("Heroic Strike");
  });
});
```

**Step 7: Run content test to verify it passes**

```bash
npx vitest run tests/game/data/content/abilities.test.ts
```

Expected: PASS.

**Step 8: Run full test suite**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 9: Commit**

```bash
git add src/game/data/schemas/ability.schema.ts src/game/data/content/abilities.json tests/game/data/schemas/ability.schema.test.ts tests/game/data/content/abilities.test.ts
git commit -m "feat: add ability schema and 16 starter abilities (2 per class)"
```

---

### Task 3: Item Schema + Content

**Files:**
- Create: `src/game/data/schemas/item.schema.ts`
- Create: `src/game/data/content/items.json`
- Create: `tests/game/data/schemas/item.schema.test.ts`
- Create: `tests/game/data/content/items.test.ts`

Follow the same TDD pattern as Task 2. The schema validates `ItemDefinition` from `src/shared/definitions.ts`.

**Schema key fields:** id (string), name, quality (QualityTier enum), itemLevel, requiredLevel, description, icon (AsciiIcon), slot (union of GearSlot enum + literal strings "consumable"|"material"|"quest"|"recipe"|"gem"|"mount"|"bag"), armorType? (ArmorType), weaponType? (WeaponType), stats (record of string→number), weaponDamageMin?, weaponDamageMax?, weaponSpeed?, armorValue?, blockValue?, bindOnPickup, bindOnEquip, unique, stackSize, vendorSellPrice, sources[] array.

**Content:** ~15 items from the design doc Greenhollow Vale section. Include quest reward items (Farmer's Pitchfork, Wolf Hide Vest, Iron Shortsword, Merchant's Ring, Kragg's Head Trophy), mob drops (Rat Tooth Dagger, Wolf Pelt Shoulders, Bandit's Leather Belt), vendor starter gear (Crude Cloth Robe, Rusty Mail Chestpiece, Wooden Shield, Apprentice's Wand, Cracked Wooden Staff), and world drops (Worn Leather Gloves, Tarnished Silver Ring).

**Tests:** Schema validation (valid/invalid), content validation (15 items, all unique IDs, all have at least one source, quality tier distribution), design doc spot-checks (Farmer's Pitchfork is Common 2H weapon, Iron Shortsword is Uncommon).

**Commit message:** `feat: add item schema and 15 Greenhollow Vale items`

---

### Task 4: Zone Schema + Content

**Files:**
- Create: `src/game/data/schemas/zone.schema.ts`
- Create: `src/game/data/content/zones.json`
- Create: `tests/game/data/schemas/zone.schema.test.ts`
- Create: `tests/game/data/content/zones.test.ts`

**Schema:** Validates `ZoneDefinition` from `definitions.ts`. Key fields: id (string), name, levelRange ({min, max}), theme, loreDescription, mobIds[] (string[]), questIds[] (string[]), dungeonUnlock? (string), gatheringNodes[] (array of objects), rareSpawns[] (array of objects), worldDropTable (string), breadcrumbQuestTo? (string).

**Content:** 1 zone — Greenhollow Vale (levels 1-5). Reference mob IDs and quest IDs that match Tasks 5 and 6. Include the 5 mob IDs and 5 quest IDs. Lore from design doc: "Pastoral starter zone with wolf attacks and bandit troubles."

**Tests:** Schema validation, content validation (1 zone, level range 1-5, has mob and quest IDs, name matches).

**Commit message:** `feat: add zone schema and Greenhollow Vale zone data`

---

### Task 5: Mob Schema + Content

**Files:**
- Create: `src/game/data/schemas/mob.schema.ts`
- Create: `src/game/data/content/mobs.json`
- Create: `tests/game/data/schemas/mob.schema.test.ts`
- Create: `tests/game/data/content/mobs.test.ts`

**Schema:** Validates `MobDefinition` from `definitions.ts`. Key fields: id (string), name, level, isElite, isBoss, isRareSpawn, health, mana? (optional), armor, meleeDamageMin, meleeDamageMax, attackSpeed, abilities[] (MobAbility objects), zoneId (string), lootTableId (string), xpReward, icon (AsciiIcon).

**MobAbility sub-schema:** id, name, damageType (DamageType enum), castTime, cooldown, damage, targetType (enum of "tank"|"random"|"all"|"cone_frontal"|"aoe_ground"|"self").

**Content:** 5 mobs from design doc:
1. Cellar Rat — level 1, 50 HP, 5 armor, 3-5 dmg, 2.0 speed, no abilities, 45 XP
2. Dire Wolf — level 2-3 (use level 3), 120 HP, 15 armor, 8-12 dmg, 2.5 speed, no abilities, 135 XP
3. Blackthorn Scout — level 3-4 (use level 4), 180 HP, 30 armor, 12-18 dmg, 2.0 speed, no abilities, 180 XP
4. Blackthorn Bandit — level 4, 220 HP, 50 armor, 15-22 dmg, 2.5 speed, no abilities, 180 XP
5. Bandit Leader Kragg — level 5, elite, 800 HP, 80 armor, 25-35 dmg, 3.0 speed, 1 ability (Cleave: physical, 0 cast, 6s CD, 40 dmg, cone_frontal), 800 XP

XP values follow design doc formula: `Mob Level × 45 + 100`, adjusted for elite multiplier.

**Tests:** Schema validation, content validation (5 mobs, levels 1-5, Kragg is elite+boss, all have lootTableIds, XP values are positive).

**Commit message:** `feat: add mob schema and 5 Greenhollow Vale mob types`

---

### Task 6: Quest Schema + Content

**Files:**
- Create: `src/game/data/schemas/quest.schema.ts`
- Create: `src/game/data/content/quests.json`
- Create: `tests/game/data/schemas/quest.schema.test.ts`
- Create: `tests/game/data/content/quests.test.ts`

**Schema:** Validates `QuestDefinition` from `definitions.ts`. Key fields: id (string), name, questText, turnInText, level, zoneId (string), prerequisites[] (string[]), followUp? (string), chainName?, chainOrder?, objectives[] (QuestObjective objects), rewards ({xp, gold, choiceItems?, guaranteedItems?, unlocksContent?}), type (enum literal union), repeatable, dailyReset.

**QuestObjective sub-schema:** type (enum of "kill"|"collect"|"deliver"|etc.), targetId?, description, requiredCount, dropRate?, baseRate?

**Content:** 5 quests from "Defense of Greenhollow" chain (design doc Zone 1). Use `chainName: "defense_of_greenhollow"`, `chainOrder: 1-5`. Each quest has `prerequisites` pointing to the previous quest (quest 1 has empty prerequisites). Each quest has `followUp` pointing to the next. All are `type: "main_chain"`, `repeatable: false`, `dailyReset: false`.

Quest 1: "The Rat Problem" — kill 10 Cellar Rats, rewards 250 XP + 15 silver (1500 copper) + Farmer's Pitchfork item
Quest 2: "Wolf Menace" — kill 15 Dire Wolves, rewards 400 XP + 25 silver + Wolf Hide Vest
Quest 3: "Bandit Scouts" — kill 12 Blackthorn Scouts, rewards 500 XP + 35 silver + Iron Shortsword
Quest 4: "Stolen Supplies" — kill 8 Blackthorn Bandits, rewards 600 XP + 50 silver + Merchant's Ring
Quest 5: "The Bandit Leader" — kill 1 Bandit Leader Kragg, rewards 800 XP + 100 silver + Kragg's Head Trophy

**Tests:** Schema validation, content validation (5 quests, correct chain order, each has followUp, rewards have XP > 0).

**Commit message:** `feat: add quest schema and Defense of Greenhollow quest chain`

---

### Task 7: Loot Table Schema + Content

**Files:**
- Create: `src/game/data/schemas/loot-table.schema.ts`
- Create: `src/game/data/content/loot-tables.json`
- Create: `tests/game/data/schemas/loot-table.schema.test.ts`
- Create: `tests/game/data/content/loot-tables.test.ts`

**Schema:** Validates `LootTable` from `src/shared/types.ts`. Key fields: id (string), guaranteedDrops[] (LootEntry: itemId, weight, minQuantity, maxQuantity), rolledDrops[] (LootEntry), rolledDropCount (number), goldRange ({min, max}), bonusRolls? (LootEntry[]), smartLoot? optional.

**Content:** 6 loot tables:
1. `loot_cellar_rat` — rolledDrops: Rat Tooth Dagger (weight 10), rolledDropCount: 1, gold 5-12
2. `loot_dire_wolf` — rolledDrops: Wolf Pelt Shoulders (weight 8), rolledDropCount: 1, gold 10-20
3. `loot_blackthorn_scout` — rolledDrops: Bandit's Leather Belt (weight 12), rolledDropCount: 1, gold 15-30
4. `loot_blackthorn_bandit` — rolledDrops: Worn Leather Gloves (weight 10), rolledDropCount: 1, gold 20-40
5. `loot_kragg` — rolledDrops: Tarnished Silver Ring (weight 25), rolledDropCount: 1, gold 50-100
6. `loot_greenhollow_world` — rolledDrops: Worn Leather Gloves (weight 2), Tarnished Silver Ring (weight 1), rolledDropCount: 1, gold 1-5

Use `weight` for probability (higher = more likely). `guaranteedDrops` is empty for all except Kragg who always drops gold.

**Tests:** Schema validation, content validation (6 tables, all have unique IDs, gold ranges valid, Kragg table has higher gold range).

**Commit message:** `feat: add loot table schema and 6 Greenhollow Vale loot tables`

---

### Task 8: XP Curves Data

**Files:**
- Create: `src/game/data/content/xp-curves.json`
- Create: `tests/game/data/content/xp-curves.test.ts`

No schema needed — this is a simple array of numbers. The JSON is an object `{ "xpPerLevel": [number, ...] }` where index 0 = XP for level 1→2, index 58 = XP for level 59→60.

**Step 1: Write the test**

```typescript
// tests/game/data/content/xp-curves.test.ts
import { describe, it, expect } from "vitest";
import xpCurves from "@game/data/content/xp-curves.json";

describe("xp-curves.json", () => {
  it("has xpPerLevel array with 59 entries (levels 1-59 → 2-60)", () => {
    expect(xpCurves.xpPerLevel).toBeDefined();
    expect(xpCurves.xpPerLevel).toHaveLength(59);
  });

  it("XP values are monotonically increasing", () => {
    for (let i = 1; i < xpCurves.xpPerLevel.length; i++) {
      expect(xpCurves.xpPerLevel[i]).toBeGreaterThan(xpCurves.xpPerLevel[i - 1]);
    }
  });

  it("level 1→2 requires ~1000 XP (formula: round(1000 * 1^2.4))", () => {
    expect(xpCurves.xpPerLevel[0]).toBe(1000);
  });

  it("level 10→11 matches formula approximately", () => {
    const expected = Math.round(1000 * Math.pow(10, 2.4));
    expect(xpCurves.xpPerLevel[9]).toBe(expected);
  });

  it("level 59→60 matches formula approximately", () => {
    const expected = Math.round(1000 * Math.pow(59, 2.4));
    expect(xpCurves.xpPerLevel[58]).toBe(expected);
  });

  it("all values are positive integers", () => {
    for (const xp of xpCurves.xpPerLevel) {
      expect(xp).toBeGreaterThan(0);
      expect(Number.isInteger(xp)).toBe(true);
    }
  });
});
```

**Step 2: Generate the JSON content**

Generate `xp-curves.json` with `xpPerLevel` array using formula `round(1000 * level^2.4)` for levels 1-59.

**Step 3: Run test and commit**

```bash
npx vitest run tests/game/data/content/xp-curves.test.ts
git add src/game/data/content/xp-curves.json tests/game/data/content/xp-curves.test.ts
git commit -m "feat: add XP curve data for levels 1-60"
```

---

### Task 9: Extend Data Loader and API

**Files:**
- Modify: `src/game/data/loader.ts`
- Modify: `src/game/data/index.ts`
- Modify: `tests/game/data/loader.test.ts`
- Create: `tests/game/data/api.extended.test.ts`

**Step 1: Write the failing loader test**

Add new test cases to `tests/game/data/loader.test.ts`:

```typescript
test("abilities has 16 entries", () => {
  const data = loadGameData();
  expect(data.abilities).toHaveLength(16);
});

test("items has entries", () => {
  const data = loadGameData();
  expect(data.items.length).toBeGreaterThan(0);
});

test("zones has 1 entry", () => {
  const data = loadGameData();
  expect(data.zones).toHaveLength(1);
});

test("mobs has 5 entries", () => {
  const data = loadGameData();
  expect(data.mobs).toHaveLength(5);
});

test("quests has 5 entries", () => {
  const data = loadGameData();
  expect(data.quests).toHaveLength(5);
});

test("lootTables has 6 entries", () => {
  const data = loadGameData();
  expect(data.lootTables).toHaveLength(6);
});

test("xpPerLevel has 59 entries", () => {
  const data = loadGameData();
  expect(data.xpPerLevel).toHaveLength(59);
});
```

**Step 2: Write the failing API tests**

```typescript
// tests/game/data/api.extended.test.ts
import { describe, test, expect, beforeEach } from "vitest";
import { resetCache } from "@game/data/loader";
import {
  getAbility, getAllAbilities, getAbilitiesByClass,
  getItem, getAllItems,
  getZone, getAllZones,
  getMob, getMobsByZone,
  getQuest, getQuestsByZone, getQuestChain,
  getLootTable,
  getXpForLevel, getTotalXpToLevel,
} from "@game/data";
import { ClassName } from "@shared/enums";

beforeEach(() => resetCache());

describe("Ability API", () => {
  test("getAbility returns ability by ID", () => {
    const ability = getAbility("warrior_heroic_strike");
    expect(ability).toBeDefined();
    expect(ability!.name).toBe("Heroic Strike");
  });

  test("getAbility returns undefined for unknown ID", () => {
    expect(getAbility("nonexistent")).toBeUndefined();
  });

  test("getAllAbilities returns all abilities", () => {
    expect(getAllAbilities()).toHaveLength(16);
  });

  test("getAbilitiesByClass returns only that class", () => {
    const warrior = getAbilitiesByClass(ClassName.Warrior);
    expect(warrior.length).toBe(2);
    warrior.forEach(a => expect(a.className).toBe(ClassName.Warrior));
  });
});

describe("Item API", () => {
  test("getItem returns item by ID", () => {
    const item = getItem("item_farmers_pitchfork");
    expect(item).toBeDefined();
    expect(item!.name).toBe("Farmer's Pitchfork");
  });

  test("getAllItems returns all items", () => {
    expect(getAllItems().length).toBeGreaterThan(0);
  });
});

describe("Zone API", () => {
  test("getZone returns Greenhollow Vale", () => {
    const zone = getZone("zone_greenhollow_vale");
    expect(zone).toBeDefined();
    expect(zone!.levelRange.min).toBe(1);
    expect(zone!.levelRange.max).toBe(5);
  });

  test("getAllZones returns 1 zone", () => {
    expect(getAllZones()).toHaveLength(1);
  });
});

describe("Mob API", () => {
  test("getMob returns mob by ID", () => {
    const mob = getMob("mob_cellar_rat");
    expect(mob).toBeDefined();
    expect(mob!.level).toBe(1);
  });

  test("getMobsByZone returns mobs for Greenhollow", () => {
    const mobs = getMobsByZone("zone_greenhollow_vale");
    expect(mobs).toHaveLength(5);
  });
});

describe("Quest API", () => {
  test("getQuest returns quest by ID", () => {
    const quest = getQuest("quest_rat_problem");
    expect(quest).toBeDefined();
    expect(quest!.rewards.xp).toBe(250);
  });

  test("getQuestsByZone returns quests for zone", () => {
    const quests = getQuestsByZone("zone_greenhollow_vale");
    expect(quests).toHaveLength(5);
  });

  test("getQuestChain returns ordered chain", () => {
    const chain = getQuestChain("defense_of_greenhollow");
    expect(chain).toHaveLength(5);
    expect(chain[0].chainOrder).toBe(1);
    expect(chain[4].chainOrder).toBe(5);
  });
});

describe("Loot Table API", () => {
  test("getLootTable returns table by ID", () => {
    const table = getLootTable("loot_cellar_rat");
    expect(table).toBeDefined();
    expect(table!.goldRange.min).toBeGreaterThanOrEqual(0);
  });
});

describe("XP Curve API", () => {
  test("getXpForLevel returns XP for level 1→2", () => {
    expect(getXpForLevel(1)).toBe(1000);
  });

  test("getXpForLevel returns 0 for level 60 (max)", () => {
    expect(getXpForLevel(60)).toBe(0);
  });

  test("getTotalXpToLevel(1) is 0", () => {
    expect(getTotalXpToLevel(1)).toBe(0);
  });

  test("getTotalXpToLevel(2) equals getXpForLevel(1)", () => {
    expect(getTotalXpToLevel(2)).toBe(getXpForLevel(1));
  });
});
```

**Step 3: Implement loader extension**

Update `src/game/data/loader.ts`:
- Import all new JSON + schemas
- Add to `GameData` interface: `abilities`, `items`, `zones`, `mobs`, `quests`, `lootTables`, `xpPerLevel`
- Validate each in `loadGameData()` using the same `.map(x => schema.parse(x))` pattern
- For xp-curves, just assign the array directly (no Zod schema, validated by tests)
- For loot tables, use `lootTableSchema` from the new schema

**Step 4: Implement API extension**

Update `src/game/data/index.ts`:
- Add imports for new definition types from `@shared/definitions`
- Add new functions: `getAbility(id)`, `getAllAbilities()`, `getAbilitiesByClass(className)`, `getItem(id)`, `getAllItems()`, `getZone(id)`, `getAllZones()`, `getMob(id)`, `getMobsByZone(zoneId)`, `getQuest(id)`, `getQuestsByZone(zoneId)`, `getQuestChain(chainName)`, `getLootTable(id)`, `getXpForLevel(level)`, `getTotalXpToLevel(level)`
- `getXpForLevel(level)`: returns `xpPerLevel[level - 1]` or 0 if out of range
- `getTotalXpToLevel(level)`: sum of `xpPerLevel[0..level-2]`
- `getQuestChain(chainName)`: filter quests by chainName, sort by chainOrder

**Step 5: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (target: ~580+).

**Step 6: Commit**

```bash
git add src/game/data/loader.ts src/game/data/index.ts tests/game/data/loader.test.ts tests/game/data/api.extended.test.ts
git commit -m "feat: extend data loader and API for abilities, items, zones, mobs, quests, loot tables, XP curves"
```

---

## PHASE 2B: VERTICAL SLICE

---

### Task 10: EventBus — Typed Pub/Sub

**Files:**
- Create: `src/game/engine/EventBus.ts`
- Create: `tests/game/engine/EventBus.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/game/engine/EventBus.test.ts
import { describe, it, expect, vi } from "vitest";
import { EventBus } from "@game/engine/EventBus";
import type { GameEvent } from "@shared/events";

describe("EventBus", () => {
  it("subscribes and receives events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    const event: GameEvent = { type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 };
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("does not call handler for other event types", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    bus.emit({ type: "GOLD_CHANGED", characterId: 1, amount: 100, reason: "loot", timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple handlers for same event", () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on("CHARACTER_LEVELED", handler1);
    bus.on("CHARACTER_LEVELED", handler2);
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("unsubscribes with returned cleanup function", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on("CHARACTER_LEVELED", handler);
    unsub();
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("onAny receives all events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.onAny(handler);
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    bus.emit({ type: "GOLD_CHANGED", characterId: 1, amount: 50, reason: "loot", timestamp: 1001 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("clear removes all handlers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    bus.clear();
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });
});
```

**Step 2: Implement EventBus**

```typescript
// src/game/engine/EventBus.ts
import type { GameEvent, GameEventOfType } from "@shared/events";

type Handler<T extends GameEvent["type"]> = (event: GameEventOfType<T>) => void;
type AnyHandler = (event: GameEvent) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<any>>>();
  private anyHandlers = new Set<AnyHandler>();

  on<T extends GameEvent["type"]>(type: T, handler: Handler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => { this.handlers.get(type)?.delete(handler); };
  }

  onAny(handler: AnyHandler): () => void {
    this.anyHandlers.add(handler);
    return () => { this.anyHandlers.delete(handler); };
  }

  emit(event: GameEvent): void {
    const typeHandlers = this.handlers.get(event.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        handler(event);
      }
    }
    for (const handler of this.anyHandlers) {
      handler(event);
    }
  }

  clear(): void {
    this.handlers.clear();
    this.anyHandlers.clear();
  }
}
```

**Step 3: Run tests and commit**

```bash
npx vitest run tests/game/engine/EventBus.test.ts
npx vitest run
git add src/game/engine/EventBus.ts tests/game/engine/EventBus.test.ts
git commit -m "feat: add typed EventBus for engine event pub/sub"
```

---

### Task 11: AbilitySystem — Ability Execution

**Files:**
- Create: `src/game/combat/AbilitySystem.ts`
- Create: `tests/game/combat/AbilitySystem.test.ts`

**Purpose:** Execute an ability from one CombatEntity against a target. Validates resource cost, checks cooldown, resolves through existing attack table + damage formulas, returns events generated.

**Interface:**

```typescript
interface AbilityResult {
  success: boolean;
  failReason?: "on_cooldown" | "insufficient_resource" | "invalid_target";
  events: CombatEvent[];
  resourceSpent: number;
  cooldownStarted: number;
}

function executeAbility(
  caster: CombatEntity,
  ability: AbilityInstance,
  target: CombatEntity,
  casterHp: number,
  targetHp: number,
  rng: ISeededRng,
  tick: number,
  cooldowns: Map<string, number>,
  casterResource: { current: number; max: number },
): AbilityResult;
```

**Key logic:**
1. Check if ability is on cooldown (`cooldowns.get(ability.id) > tick`)
2. Check if caster has enough resource (`casterResource.current >= ability.resourceCost`)
3. Build `AttackTableInput` from caster/target stats, call `buildAttackTable()` + `resolveAttack()`
4. If hit/crit: call `calculatePhysicalDamage()` or `calculateSpellDamage()` from existing formulas
5. Deduct resource, set cooldown, generate `CombatEvent` entries
6. Return result

**Tests:** Test successful ability execution, insufficient resource, on cooldown, miss result, crit result. Use deterministic seeded RNG for all tests.

**Commit message:** `feat: add AbilitySystem for ability execution with attack table resolution`

---

### Task 12: CombatFactory — Entity Construction

**Files:**
- Create: `src/game/combat/CombatFactory.ts`
- Create: `tests/game/combat/CombatFactory.test.ts`

**Purpose:** Build `CombatEntity` from `CharacterState` + game data. Build `CombatEntity` from `MobDefinition`.

**Interface:**

```typescript
function buildPlayerEntity(
  character: CharacterState,
  classDef: ClassDefinition,
  abilities: AbilityDefinition[],
  equippedItems: Array<{ slot: GearSlot; item: ItemDefinition }>,
): CombatEntity;

function buildMobEntity(mob: MobDefinition): CombatEntity;
```

**Key logic for buildPlayerEntity:**
1. Calculate base stats: `classDef.baseStats[stat] + classDef.perLevelGains[stat] * (character.level - 1)`
2. Add equipment stats from equipped items
3. Calculate derived stats using existing `stats.ts` functions (HP from stamina, armor mitigation, crit chance, etc.)
4. Map `AbilityDefinition[]` to `AbilityInstance[]`
5. Build rotation from `aiPriority` ordering
6. Return `CombatEntity`

**Key logic for buildMobEntity:**
1. Map mob stats directly to `EffectiveStats`
2. Map `MobAbility[]` to `AbilityInstance[]`
3. Build simple priority rotation
4. Return `CombatEntity` with `entityType: "enemy"`

**Tests:** Build a level 1 Warrior with no gear, verify stats match class base. Build with a weapon equipped, verify weapon damage in stats. Build a Cellar Rat mob, verify HP/damage. Build Kragg, verify he has an ability.

**Commit message:** `feat: add CombatFactory for building player and mob combat entities`

---

### Task 13: EncounterRunner — Core Combat Loop

**Files:**
- Create: `src/game/combat/EncounterRunner.ts`
- Create: `tests/game/combat/EncounterRunner.test.ts`

**Purpose:** Run a tick-by-tick combat encounter between a player entity and an enemy entity. Pure function, deterministic.

**Interface:**

```typescript
interface SimpleEncounterParams {
  player: CombatEntity;
  enemy: CombatEntity;
  tickLimit: number;
}

interface SimpleEncounterResult {
  outcome: "victory" | "defeat" | "timeout";
  durationTicks: number;
  events: CombatEvent[];
  playerHpRemaining: number;
  xpAwarded: number;
}

function runSimpleEncounter(
  params: SimpleEncounterParams,
  rng: ISeededRng,
): SimpleEncounterResult;
```

Note: This is a simplified version of the full `EncounterRunner` for Phase 2. It handles 1v1 combat (player vs mob), not full party encounters. The `EncounterParams`/`EncounterResult` interfaces from `combat-interfaces.ts` are for the full system in later phases.

**Per-tick logic:**
1. Player selects ability: iterate rotation by priority, pick first available (off cooldown, has resource)
2. If no ability available: auto-attack (use basic melee with weapon damage)
3. Execute ability via `AbilitySystem.executeAbility()`
4. Enemy selects and executes ability similarly
5. Apply resource regeneration (existing `resources.ts` functions)
6. Tick down cooldowns
7. Check death: enemy HP ≤ 0 → victory, player HP ≤ 0 → defeat
8. Accumulate events

**Tests:**
- Level 1 Warrior vs Cellar Rat → victory (deterministic with known seed)
- Level 1 Mage vs Cellar Rat → victory
- Verify combat ends within reasonable tick count (< 30 ticks for rat)
- Verify events include damage events
- Verify XP awarded on victory matches mob's xpReward
- Verify defeat scenario (weak character vs Kragg)
- Verify timeout when tickLimit reached

**Commit message:** `feat: add EncounterRunner for tick-by-tick 1v1 combat simulation`

---

### Task 14: CharacterService — Character CRUD

**Files:**
- Create: `src/game/engine/CharacterService.ts`
- Create: `tests/game/engine/CharacterService.test.ts`

**Purpose:** Create, load, save, delete characters. Persists to SQLite via Kysely.

**Interface:**

```typescript
class CharacterService {
  constructor(db: Kysely<Database>);
  createCharacter(name: string, race: RaceName, className: ClassName): Promise<CharacterState>;
  loadCharacter(id: number): Promise<CharacterState | null>;
  loadAllCharacters(): Promise<CharacterState[]>;
  saveCharacter(state: CharacterState): Promise<void>;
  deleteCharacter(id: number): Promise<void>;
}
```

**Key logic:**
- `createCharacter`: validates name (2-16 chars, alphanumeric+spaces), race/class via data API, builds initial `CharacterState` with base stats from `ClassDefinition`, level 1, 0 XP, 0 gold, empty equipment, Greenhollow Vale as starting zone, activity=Idle
- Persists as JSON blob in the `characters` column of SQLite (the schema already has a `characters` table)
- Uses `getClass()` and `getRace()` from data API for validation

**Tests:** Create a character (verify returned state), load by ID, save modified state + reload (verify changes persist), delete + verify gone, reject invalid name, reject invalid class. Use in-memory SQLite for tests.

**Commit message:** `feat: add CharacterService for character CRUD with SQLite persistence`

---

### Task 15: InventoryService — Equipment & Bags

**Files:**
- Create: `src/game/engine/InventoryService.ts`
- Create: `tests/game/engine/InventoryService.test.ts`

**Purpose:** Manage character inventory (bag slots) and equipment (gear slots). Recalculate stats from equipped items.

**Interface:**

```typescript
class InventoryService {
  addItem(character: CharacterState, item: ItemInstance): CharacterState;
  removeItem(character: CharacterState, bagSlot: number): { character: CharacterState; item: ItemInstance | null };
  equipItem(character: CharacterState, bagSlot: number, itemDefs: Map<string, ItemDefinition>): CharacterState;
  unequipItem(character: CharacterState, gearSlot: GearSlot): CharacterState;
  getEquippedItems(character: CharacterState, itemDefs: Map<string, ItemDefinition>): Array<{ slot: GearSlot; item: ItemDefinition }>;
  recalculateStats(character: CharacterState, classDef: ClassDefinition, itemDefs: Map<string, ItemDefinition>): EffectiveStats;
}
```

**Key logic:**
- `addItem`: find first empty bag slot (null in a fixed-size array), place item there
- `equipItem`: check slot compatibility (item.slot matches GearSlot), move item from bag to equipment, move old equipped item to bag if present, recalculate stats
- `recalculateStats`: base stats + per-level gains + sum of all equipped item stats → compute derived stats (HP, mana, AP, SP, etc.) using existing `stats.ts` formulas

Character state tracks equipment as `Record<GearSlot, number | null>` (item instance IDs) and inventory as an array of `ItemInstance` objects.

**Tests:** Add item to empty inventory, add item to full inventory (fails), equip weapon, unequip, equip over existing (swap), stat recalculation with/without gear.

**Commit message:** `feat: add InventoryService for equipment and bag management`

---

### Task 16: ProgressionService — XP and Leveling

**Files:**
- Create: `src/game/engine/ProgressionService.ts`
- Create: `tests/game/engine/ProgressionService.test.ts`

**Purpose:** Award XP, check level-up thresholds, apply per-level stat gains.

**Interface:**

```typescript
interface LevelUpResult {
  levelsGained: number;
  oldLevel: number;
  newLevel: number;
  events: GameEvent[];
}

class ProgressionService {
  constructor(eventBus: EventBus);
  awardXp(character: CharacterState, amount: number): LevelUpResult;
}
```

**Key logic:**
- Add XP to character. While `character.xp >= getXpForLevel(character.level)`, subtract threshold, increment level, apply per-level stat gains from `ClassDefinition.perLevelGains`, emit `CHARACTER_LEVELED` event.
- Supports multi-level-up (e.g., large XP gain crosses 2 level boundaries).
- Recalculates effective stats after level-up.

**Tests:** Award XP below threshold (no level up). Award XP exactly at threshold (level up). Award large XP (multi-level). Verify stats increase after level-up. Verify events emitted.

**Commit message:** `feat: add ProgressionService for XP awards and level-up handling`

---

### Task 17: LootService — Loot Rolling

**Files:**
- Create: `src/game/engine/LootService.ts`
- Create: `tests/game/engine/LootService.test.ts`

**Purpose:** Roll loot tables using seeded RNG, create `ItemInstance` from results.

**Interface:**

```typescript
interface LootResult {
  items: ItemInstance[];
  gold: number;
}

class LootService {
  rollLoot(lootTableId: string, characterId: number, rng: ISeededRng): LootResult;
}
```

**Key logic:**
- Load loot table from data API
- Process guaranteed drops (always included)
- For rolled drops: roll `rolledDropCount` times. Each roll: sum weights, pick random weighted entry, create `ItemInstance` with unique ID
- Roll gold: `rng.nextInt(goldRange.min, goldRange.max)`

**Tests:** Roll with known seed → verify deterministic output. Roll Kragg table → verify gold in range. Roll cellar rat table multiple times → verify drop rate roughly matches weight. Verify items have unique instance IDs.

**Commit message:** `feat: add LootService for seeded loot table rolling`

---

### Task 18: QuestTracker — Skeleton Quest System

**Files:**
- Create: `src/game/engine/QuestTracker.ts`
- Create: `tests/game/engine/QuestTracker.test.ts`

**Purpose:** Track quest progress per character. Auto-accept sequential chain quests. Count kills. Auto-turn-in on completion.

**Interface:**

```typescript
interface QuestState {
  questId: string;
  objectives: Record<string, number>; // objectiveTargetId → kill count
  status: "active" | "complete";
}

class QuestTracker {
  constructor(eventBus: EventBus);
  initializeForZone(characterId: number, zoneId: string): QuestState[];
  onMobKill(characterId: number, mobId: string): { questCompleted: boolean; rewards?: QuestRewards };
  getActiveQuests(characterId: number): QuestState[];
}

interface QuestRewards {
  xp: number;
  gold: number;
  itemIds: string[];
  nextQuestId?: string;
}
```

**Key logic:**
- `initializeForZone`: load quest chain for zone, auto-accept first quest, return initial state
- `onMobKill`: check if mob matches any active quest objective `targetId`, increment count. If objective complete → auto-turn-in (emit `QUEST_COMPLETED` event), auto-accept next quest in chain
- Quest objectives reference mob IDs (e.g., `targetId: "mob_cellar_rat"`, `requiredCount: 10`)

**Tests:** Initialize quest chain, kill matching mobs → progress updates, complete objective → quest completes with rewards, next quest auto-accepts, complete all 5 quests in chain.

**Commit message:** `feat: add QuestTracker skeleton for sequential kill-quest chains`

---

### Task 19: ActivityManager — State Machine

**Files:**
- Create: `src/game/engine/ActivityManager.ts`
- Create: `tests/game/engine/ActivityManager.test.ts`

**Purpose:** Manage character activity state (idle vs zone_grinding). Handle per-tick zone grinding loop: pick mob → run encounter → award XP/loot → track quest progress → pick next mob.

**Interface:**

```typescript
class ActivityManager {
  constructor(
    eventBus: EventBus,
    progressionService: ProgressionService,
    lootService: LootService,
    questTracker: QuestTracker,
  );
  startZoneGrinding(character: CharacterState, zoneId: string): void;
  stopGrinding(characterId: number): void;
  onTick(character: CharacterState, rng: ISeededRng, tick: number): ActivityTickResult;
  getState(characterId: number): ActivityState;
}

interface ActivityState {
  activity: "idle" | "zone_grinding";
  zoneId?: string;
  currentEncounter?: { mobId: string; ticksElapsed: number };
  encounterState?: EncounterInProgress;
}

interface ActivityTickResult {
  characterUpdates: Partial<CharacterState>;
  events: CombatEvent[];
  mobKilled?: string;
  loot?: LootResult;
  questUpdate?: { questCompleted: boolean; rewards?: QuestRewards };
}
```

**Key logic:**
- When zone_grinding: maintain an in-progress encounter state. Each tick advances the encounter by one tick.
- When encounter ends (victory): award XP via ProgressionService, roll loot via LootService, notify QuestTracker of mob kill, pick next mob for zone (round-robin or weighted random by level).
- When encounter ends (defeat): character rests for a few ticks, then re-engages (idle game — no permadeath).
- Character heals to full between encounters.

**Tests:** Start grinding → first tick starts encounter, run ticks until mob dies → verify XP/loot, verify next mob starts. Stop grinding → returns to idle. Defeat → character recovers and continues.

**Commit message:** `feat: add ActivityManager state machine for zone grinding loop`

---

### Task 20: GameManager — Central Coordinator

**Files:**
- Create: `src/game/engine/GameManager.ts`
- Create: `tests/game/engine/GameManager.test.ts`

**Purpose:** Coordinates all engine services. Handles IPC commands and queries. Routes game loop ticks.

**Interface:**

```typescript
class GameManager {
  constructor(db: Kysely<Database>, eventBus: EventBus);

  // Lifecycle
  async initialize(): Promise<void>;

  // Tick handler (called by GameLoop)
  onTick(tickNumber: number): void;

  // Commands (from IPC)
  async handleCommand(cmd: EngineCommand): Promise<any>;

  // Queries (from IPC)
  async handleQuery(query: EngineQuery): Promise<any>;

  // State access
  getCharacterRoster(): CharacterState[];
  getActiveCharacterId(): number | null;
}
```

**Key logic:**
- `initialize()`: instantiate all services (CharacterService, InventoryService, ProgressionService, LootService, QuestTracker, ActivityManager), load character roster from DB
- `onTick()`: for active character, call `activityManager.onTick()`, process results (save state, emit events)
- `handleCommand()`: dispatch to appropriate service (create_character → CharacterService, start_grinding → ActivityManager, equip_item → InventoryService, etc.)
- Periodically auto-save dirty state to DB

**Tests:** Initialize with empty DB → no characters. Create character via command → appears in roster. Start grinding → tick produces combat events. Equip item → stats change. Integration test: full loop from create → grind → level up.

**Commit message:** `feat: add GameManager as central engine coordinator`

---

### Task 21: OfflineCalculator — Fast-Sim Offline Gains

**Files:**
- Create: `src/game/engine/OfflineCalculator.ts`
- Create: `tests/game/engine/OfflineCalculator.test.ts`

**Purpose:** Calculate offline progress using statistical estimation (not tick-by-tick replay).

**Interface:**

```typescript
function calculateOfflineGains(
  character: CharacterState,
  elapsedSeconds: number,
  rng: ISeededRng,
): CharacterOfflineResult;
```

**Key logic:**
1. Estimate average fight duration from character level vs zone mob levels (higher level = faster kills)
2. Estimate fights completed = elapsedSeconds / avgFightDuration
3. Calculate total XP: fights × avg mob XP reward, apply level-ups iteratively
4. Roll loot tables statistically: fights × weighted drop rates
5. Advance quest progress: fights × (kills split across mob types)
6. Calculate gold earned: fights × avg gold per kill
7. Cap at reasonable maximums (e.g., no gaining more than 10 levels offline)

**Tests:** 0 seconds offline → no gains. 1 hour offline at level 1 → gains XP/gold/items (verify reasonable ranges). Verify level-ups are applied correctly. Verify deterministic with same seed.

**Commit message:** `feat: add OfflineCalculator for fast-sim offline progression`

---

### Task 22: Game Store — Zustand IPC Bridge

**Files:**
- Create: `src/renderer/stores/gameStore.ts`
- Create: `tests/renderer/stores/gameStore.test.ts`

**Purpose:** Zustand store bridging UI to engine via IPC. Holds character roster, active character state, combat events.

**Interface:**

```typescript
interface GameStoreState {
  characters: CharacterState[];
  activeCharacterId: number | null;
  combatEvents: CombatEvent[];
  zoneState: { grinding: boolean; zoneId: string | null; currentMob: string | null } | null;
  questProgress: QuestState[];
  welcomeBack: WelcomeBackSummary | null;
  isLoading: boolean;

  // Actions
  loadRoster(): Promise<void>;
  createCharacter(name: string, race: RaceName, className: ClassName): Promise<void>;
  selectCharacter(id: number): void;
  startGrinding(zoneId: string): Promise<void>;
  stopGrinding(): Promise<void>;
  equipItem(bagSlot: number): Promise<void>;
  unequipItem(gearSlot: GearSlot): Promise<void>;
  addCombatEvents(events: CombatEvent[]): void;
  dismissWelcomeBack(): void;
}
```

**Key logic:**
- Actions call `window.api.*` IPC methods
- `onTick` subscription pushes combat events and state updates into the store
- Combat events ring buffer (max from settingsStore.combatLogMaxLines)

**Tests:** Test store actions with mocked `window.api`. Create character → appears in roster. Start grinding → zoneState updates. Add combat events → stored with max cap. Mock tests only — no real IPC.

**Commit message:** `feat: add gameStore Zustand store with IPC bridge`

---

### Task 23: CharacterCreate Component

**Files:**
- Create: `src/renderer/components/CharacterCreate.tsx`
- Create: `tests/renderer/components/CharacterCreate.test.tsx`

**Purpose:** Multi-step character creation form: name → race → class → preview → create.

**Key elements:**
- Name input with validation feedback (2-16 chars)
- Race cards (6 races with icons and bonus descriptions)
- Class cards (8 classes with descriptions and resource type)
- Stat preview panel (computed base stats from selected race + class)
- Create button (calls gameStore.createCharacter)

**Tests (jsdom):** Renders name input. Race cards show all 6 races. Selecting race updates preview. Class cards show all 8 classes. Create button disabled until name + race + class selected. Successful creation calls store action.

**Commit message:** `feat: add CharacterCreate component with race/class selection`

---

### Task 24: CharacterSheet Component

**Files:**
- Create: `src/renderer/components/CharacterSheet.tsx`
- Create: `tests/renderer/components/CharacterSheet.test.tsx`

**Purpose:** Display character stats, level, XP bar, equipment slots, and inventory grid.

**Key elements:**
- Header: name, race icon, class, level badge
- XP bar: current/required with percentage
- Stats panel: STR, AGI, INT, STA, SPI + derived stats (HP, Mana, AP, SP, Crit%, etc.)
- Equipment slots: 16 gear slots displayed as labeled boxes, show item name + quality color if equipped
- Inventory grid: 16 bag slots, items shown with quality-colored text, click to equip

**Tests (jsdom):** Renders character name and level. Shows XP bar. Displays base stats. Equipment slots render. Inventory slots render. Click equip calls gameStore.equipItem.

**Commit message:** `feat: add CharacterSheet component with stats, equipment, and inventory`

---

### Task 25: CombatLog Component

**Files:**
- Create: `src/renderer/components/CombatLog.tsx`
- Create: `tests/renderer/components/CombatLog.test.tsx`

**Purpose:** Scrolling color-coded combat event log.

**Key elements:**
- Scrollable container with auto-scroll to bottom
- Events formatted as text lines with color coding:
  - damage → red text
  - heal → green text
  - miss/dodge/parry → grey text
  - XP gain → yellow text
  - loot → cyan text
  - level-up → bright white, bold
  - quest progress → amber text
- Max lines enforced from settingsStore
- Clear button

**Tests (jsdom):** Renders empty log. Renders damage events in red. Renders multiple event types. Clear button empties log. Respects max lines.

**Commit message:** `feat: add CombatLog component with color-coded event display`

---

### Task 26: ZoneView Component

**Files:**
- Create: `src/renderer/components/ZoneView.tsx`
- Create: `tests/renderer/components/ZoneView.test.tsx`

**Purpose:** Display current zone, active mob encounter, and quest progress.

**Key elements:**
- Zone header: name, level range
- Current encounter: mob name, HP bar, level indicator
- Player status: HP bar, resource bar
- Start/Stop grinding toggle button
- Quest sidebar: active quest name, objective text, progress counter (e.g., "7/10 Cellar Rats")

**Tests (jsdom):** Renders zone name. Start button calls gameStore.startGrinding. When grinding, shows mob info. Stop button calls gameStore.stopGrinding. Quest progress displays correctly.

**Commit message:** `feat: add ZoneView component with mob encounter and quest progress display`

---

### Task 27: AppShell Wiring + IPC Bridge

**Files:**
- Modify: `src/renderer/components/AppShell.tsx`
- Modify: `src/main/ipc/handlers.ts`
- Modify: `src/main/preload.ts`
- Create: `src/main/ipc/gamebridge.ts`

**Purpose:** Connect everything: AppShell routes tabs to new components, IPC handlers delegate to GameManager, preload exposes new API methods.

**Key changes to AppShell:**
- If no characters exist → show CharacterCreate full-screen
- "Character" tab → CharacterSheet
- "Combat Log" tab → CombatLog
- Other tabs → placeholder "Coming in Phase 3" text
- Add ZoneView as a persistent bottom panel when grinding

**New IPC bridge (`gamebridge.ts`):**
- Instantiate GameManager with real database
- Wire GameLoop's onTick to GameManager.onTick
- Handle IPC commands: `engine:command` channel → GameManager.handleCommand
- Handle IPC queries: `engine:query` channel → GameManager.handleQuery
- Forward GameEvent emissions to renderer via IPC `game:event` channel

**Preload additions:**
- `sendCommand(cmd)` → invokes `engine:command`
- `sendQuery(query)` → invokes `engine:query`
- `onGameEvent(handler)` → listens to `game:event`

**Tests:** Mostly integration — verify AppShell renders CharacterCreate when no characters. Verify tab routing. IPC handler tests with mocked GameManager.

**Commit message:** `feat: wire AppShell tabs to game components and connect IPC to GameManager`

---

### Task 28: Final Phase 2 Verification

**Depends on:** All previous tasks complete.

**Step 1: Type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (target: 650+).

**Step 3: Build**

```bash
npx electron-vite build
```

Expected: Clean build.

**Step 4: Manual smoke test**

```bash
npx electron-vite dev
```

Expected:
1. App opens → CharacterCreate screen (no existing characters)
2. Enter name, pick Human Warrior → stat preview updates → Create
3. CharacterSheet shows level 1 stats
4. Click "Enter Greenhollow Vale" → ZoneView appears
5. Combat log fills with events: "Your Heroic Strike hits Cellar Rat for 12 damage"
6. XP bar advances, eventually level up notification
7. Loot drops appear in inventory
8. Quest progress: "Kill Cellar Rats: 3/10"
9. Close app → reopen → Welcome Back summary shows offline gains

**Step 5: Fix any issues found**

If any step fails, diagnose and fix. Re-run all tests.

**Step 6: Tag**

```bash
git tag v0.2.0-phase2
```

**Step 7: Report Phase 2 metrics**

Count: test files, total tests, source files, line count.

---

## Dependency Summary

```
Task 1  (LootTableDef alias)      ─┐
Task 2  (ability schema+content)   │
Task 3  (item schema+content)      │
Task 4  (zone schema+content)      ├─► Task 9 (loader/API) ─┐
Task 5  (mob schema+content)       │                         │
Task 6  (quest schema+content)     │                         │
Task 7  (loot table schema+content)│                         │
Task 8  (XP curves)               ─┘                         │
                                                              │
Task 10 (EventBus) ─────────────────────────────────────────┐ │
                                                             │ │
Task 11 (AbilitySystem) ◄── Task 9 ─────────────────────────┤ │
Task 12 (CombatFactory) ◄── Task 9 ─────────────────────────┤ │
Task 13 (EncounterRunner) ◄── Tasks 11, 12 ─────────────────┤ │
                                                             │ │
Task 14 (CharacterService) ◄── Task 9 ──────────────────────┤ │
Task 15 (InventoryService) ◄── Task 9 ──────────────────────┤ │
Task 16 (ProgressionService) ◄── Tasks 9, 10 ───────────────┤ │
Task 17 (LootService) ◄── Task 9 ───────────────────────────┤ │
Task 18 (QuestTracker) ◄── Tasks 9, 10 ─────────────────────┤ │
Task 19 (ActivityManager) ◄── Tasks 13, 16, 17, 18 ─────────┤ │
Task 20 (GameManager) ◄── Tasks 14, 15, 19 ─────────────────┤ │
Task 21 (OfflineCalculator) ◄── Tasks 9, 16 ────────────────┘ │
                                                               │
Task 22 (gameStore) ────────────────────────────────────────┐  │
Task 23 (CharacterCreate) ◄── Task 22 ─────────────────────┤  │
Task 24 (CharacterSheet) ◄── Task 22 ──────────────────────┤  │
Task 25 (CombatLog) ◄── Task 22 ───────────────────────────┤  │
Task 26 (ZoneView) ◄── Task 22 ────────────────────────────┤  │
Task 27 (AppShell wiring) ◄── Tasks 20, 23-26 ─────────────┘  │
                                                               │
Task 28 (Final verification) ◄── ALL ─────────────────────────┘
```

## Parallel Execution Groups

**Group A (independent, all parallel):** Tasks 1-8
**Group B (after Group A):** Task 9
**Group C (after Task 9+10, parallel):** Tasks 11-12, 14-18
**Group D (after Group C):** Tasks 13, 19-21
**Group E (after Task 9, parallel with C/D):** Tasks 22-26
**Group F (after D+E):** Task 27
**Group G (after all):** Task 28
