# Phase 0: Cross-Domain Resolution & Shared Foundation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve all P0/P1 cross-domain conflicts from Round 1 critiques, then implement the canonical shared type system and project scaffolding that all 4 domain plans depend on.

**Architecture:** All game content IDs use human-readable strings. All runtime instance IDs use SQLite auto-increment numbers. IPC uses plain JSON serialization (no Map/Set). Engine ticks at 1 Hz with a separate combat event stream. Shared types in `src/shared/` are the single source of truth — no domain redefines them.

**Tech Stack:** TypeScript 5.4+, Vitest, Electron 28+, Vite 5+, React 18, Zustand 4, better-sqlite3, Kysely

---

## Part 1: Cross-Domain Conflict Resolutions

Every decision below is FINAL. The v2 domain plans must conform to these. Rationale is provided so future contributors understand why.

---

### Decision 1: ID Format — String Content IDs, Numeric Instance IDs

**Issue:** Engine plan uses `number` for entity IDs. Combat uses `string`. Data uses branded strings. SQLite schema has a mix of INTEGER and TEXT.

**Resolution:**
- **Content IDs** (items, zones, quests, mobs, dungeons, raids, abilities, talents, recipes, achievements) = `string`, stored as `TEXT` in SQLite. Human-readable, e.g. `"bjornskars_icebreaker"`, `"deadhollow_crypt"`.
- **Instance IDs** (character rows, item instance rows, save slots) = `number`, SQLite `INTEGER PRIMARY KEY AUTOINCREMENT`.
- **CombatEntity.id** = `number` (refers to character instance ID or a generated numeric ID for companions/enemies during encounter setup).
- The design doc's SQLite schema is **superseded** where it uses `INTEGER` for content foreign keys. All `item_template_id`, `quest_id`, `zone_id` columns become `TEXT`.

**Rationale:** Content is authored in JSON files by humans — string IDs are readable and diffable. Runtime instances need efficient integer keys for SQLite joins. CombatEntity uses number because the engine assigns numeric IDs to all encounter participants (player characters already have SQLite integer IDs; companions/enemies get temporary numeric IDs from a counter).

**Branded types** provide compile-time safety:
```typescript
type ItemId = string & { readonly __brand: "ItemId" };
type QuestId = string & { readonly __brand: "QuestId" };
// etc.
```
These are zero-cost at runtime (just strings) but prevent accidentally passing a QuestId where an ItemId is expected.

---

### Decision 2: Shared Types Ownership

**Issue:** All 4 plans reference `src/shared/types.ts` but none define or own it.

**Resolution:**
- `src/shared/` is **co-owned** — no single domain owns it, but changes require cross-domain agreement.
- **Phase 0 (this plan) creates all shared type files.** Domain plans consume them, never redefine them.
- File breakdown:
  - `src/shared/enums.ts` — All game enums (ClassName, RaceName, ResourceType, QualityTier, GearSlot, etc.)
  - `src/shared/types.ts` — Core entity interfaces (Character, Item, Zone, etc.) and branded ID types
  - `src/shared/constants.ts` — Numeric constants (XP formula, stat conversions, tick rate, etc.)
  - `src/shared/ipc-api.ts` — Complete IPC contract (commands, state deltas, subscriptions)
  - `src/shared/combat-interfaces.ts` — Combat API contract (EncounterParams, EncounterResult, CombatEntity, etc.)
  - `src/shared/events.ts` — Typed event bus event definitions
  - `src/shared/utils.ts` — Pure utility functions (clamp, lerp, formatGold, etc.)

**Naming conventions (MANDATORY):**

| Concept | Name | Example |
|---------|------|---------|
| Static game data from JSON | `*Definition` | `ItemDefinition`, `ZoneDefinition`, `AbilityDefinition` |
| Runtime mutable state | `*State` | `CharacterState`, `InventoryState`, `QuestProgressState` |
| IPC payloads | `*Payload` / `*Command` | `EquipItemCommand`, `CharacterUpdatePayload` |
| Combat-time entities | `CombatEntity`, `EncounterParams`, `EncounterResult` | (no prefix/suffix) |
| Branded content IDs | `*Id` | `ItemId`, `ZoneId`, `QuestId` |

---

### Decision 3: IPC Contract

**Issue:** Engine sends `GameStateDelta` with `Map<>` fields. UI expects `EngineStateUpdate` with arrays and a `type` discriminator. Field names differ (`charId` vs `characterId`). Update frequency: 1 Hz vs 10 Hz.

**Resolution:**
- **JSON-only serialization.** No `Map`, `Set`, or `BigInt` in any IPC payload. Use `Record<number, T>` instead of `Map<number, T>`.
- **Single canonical type:** `GameStateDelta` (engine's name wins, but with UI's discriminator added).
- **Field naming:** `characterId` everywhere (not `charId`). All content IDs use the canonical branded string type name.
- **Update frequency:**
  - Base state: **1 Hz** (one delta per tick, batching all changes)
  - Combat events: **separate channel, up to 10 Hz** during active encounters
  - Notifications: **separate channel, push-on-event** (not batched into deltas)
- **Request/response for commands:** All player actions use `invoke`-style IPC (returns Promise). State deltas are a separate push channel.
- **No pre-formatted strings.** `WelcomeBackSummary` and notifications use structured data, not human-readable strings. UI formats them.

---

### Decision 4: Encounter Result Outcomes

**Issue:** Engine expects 3 outcomes (`victory | wipe | enrage_wipe`). Combat defines 4 (`victory | wipe | enrage | timeout`).

**Resolution:** Use **4 outcomes**: `'victory' | 'wipe' | 'enrage' | 'timeout'`
- `victory` — all enemies dead
- `wipe` — all player-side entities dead
- `enrage` — boss enrage timer expired (boss still fighting, but with massive buffs — effectively a wipe in progress)
- `timeout` — hard tick limit reached (safety valve, should never happen in balanced content)

Engine's dungeon/raid state machines handle all 4. Both `enrage` and `timeout` result in the run being marked as failed.

---

### Decision 5: Loot Table Schema

**Issue:** Engine expects flat `entries[]` with `dropRate`. Data defines 3-layer model with `weight`.

**Resolution:** Use Data's **3-layer model**:
```typescript
interface LootTable {
  id: LootTableId;
  guaranteedDrops: LootEntry[];     // Always awarded
  rolledDrops: LootEntry[];         // Weighted random selection
  rolledDropCount: number;          // How many picks from rolledDrops pool
  goldRange: { min: number; max: number };
  bonusRolls?: LootEntry[];         // Additional low-chance rolls (chase items)
}

interface LootEntry {
  itemId: ItemId;
  weight: number;          // Relative weight for weighted selection (NOT independent probability)
  minQuantity: number;
  maxQuantity: number;
}
```
- `weight` = relative weight for **weighted random selection** from the pool. NOT independent drop probability.
- `rolledDropCount` = number of picks from the pool per kill.
- `bonusRolls` = independently rolled at their `weight` as a probability (0.0-1.0) — these ARE independent. Used for chase items.
- Engine's `LootSystem` implements the rolling algorithm. Data defines the tables.
- Smart loot fields added to `LootTable` (spec awareness, upgrade weighting).

---

### Decision 6: Stat Budget Formula

**Issue:** Data plan fabricated quality multipliers not in design doc. Produces 20% stat inflation.

**Resolution:** Design doc formula is authoritative:
```
Item Level = Content Level + Quality Offset
Quality Offsets: Common +0, Uncommon +5, Rare +10, Epic +20, Legendary +30
Total Stat Points = iLvl * 2
```
No quality multiplier on the budget. Quality is already baked into iLvl via the flat offset. The data plan's multiplier table is **deleted**.

---

### Decision 7: ResourceType Enum

**Issue:** Data enum has 3 entries. Combat needs 8+.

**Resolution:** **9 resource types:**
```typescript
enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
  ComboPoints = "combo_points",
  SoulShards = "soul_shards",
  Focus = "focus",
  DivineFavor = "divine_favor",
  Maelstrom = "maelstrom",
  ArcaneCharges = "arcane_charges",
}
```
Combo Points, Soul Shards, Focus, Divine Favor, and Maelstrom are inferred from class design but necessary for the ability system. Arcane Charges are confirmed by design doc (Arcane Mage capstone). All 9 must be in the data enum and supported by combat's resource system.

---

### Decision 8: AbilityEffect Types

**Issue:** Data plan missing ~10 critical effect types.

**Resolution:** Complete effect type union:
```typescript
type AbilityEffectType =
  | "damage" | "heal" | "dot" | "hot"
  | "buff" | "debuff"
  | "absorb" | "shield"
  | "summon" | "summon_pet"
  | "dispel" | "interrupt" | "purge"
  | "taunt" | "threat_mod"
  | "stun" | "root" | "silence" | "fear" | "disorient" | "charm"
  | "knockback" | "pull"
  | "mana_drain" | "mana_burn" | "resource_restore"
  | "immunity" | "damage_reduction"
  | "morph"              // Bear/Cat form, Metamorphosis, Moonkin, Tree of Life
  | "aura"               // Party-wide passive effects
  | "execute"            // Only usable below HP threshold
  | "guaranteed_crit"    // Lava Burst vs Flame Shock, Cold Blood
  | "linked_health"      // Boss mechanic: Risen Twins
  | "channel";           // Channeled spells
```

---

### Decision 9: TalentEffect Types

**Issue:** `crit_bonus` conflates crit chance and crit damage multiplier.

**Resolution:** Split into explicit types:
```typescript
type TalentEffectType =
  | "stat_bonus"              // +X to a stat
  | "stat_percentage_bonus"   // +X% to a stat
  | "ability_modifier"        // Modifies a specific ability
  | "passive_proc"            // Chance-on-event effect
  | "grant_ability"           // Unlocks a new ability
  | "resource_modifier"       // Changes resource gen/cost
  | "cooldown_reduction"      // Reduces ability cooldown
  | "cost_reduction"          // Reduces ability resource cost
  | "damage_increase"         // +X% damage (category or all)
  | "healing_increase"        // +X% healing
  | "crit_chance_bonus"       // +X% crit chance (was "crit_bonus")
  | "crit_damage_bonus"       // +X% crit damage multiplier (NEW)
  | "threat_modifier"         // +/-X% threat
  | "avoidance_bonus"         // +X% dodge/parry/block
  | "pet_bonus"               // Modifies pet stats/damage
  | "form_bonus"              // Only active in specific form
  | "pushback_resistance";    // Spell pushback reduction
```

---

### Decision 10: Combat Log Event Schema

**Issue:** No plan defines `CombatEvent`. UI cannot build combat log.

**Resolution:** Canonical `CombatEvent` discriminated union:
```typescript
interface CombatEventBase {
  tick: number;
  sourceId: number;        // CombatEntity.id
  sourceName: string;
  targetId: number;
  targetName: string;
}

type CombatEvent =
  | CombatEventBase & { type: "damage"; abilityName: string; amount: number; damageType: DamageType; isCrit: boolean; isBlocked: boolean; blockAmount: number; overkill: number; }
  | CombatEventBase & { type: "heal"; abilityName: string; amount: number; isCrit: boolean; overheal: number; }
  | CombatEventBase & { type: "miss"; abilityName: string; missType: "miss" | "dodge" | "parry"; }
  | CombatEventBase & { type: "buff_apply"; buffName: string; duration: number; stacks: number; }
  | CombatEventBase & { type: "buff_expire"; buffName: string; }
  | CombatEventBase & { type: "death"; killingAbility: string; }
  | CombatEventBase & { type: "ability_cast"; abilityName: string; castTime: number; }
  | CombatEventBase & { type: "interrupt"; abilityName: string; interruptedAbility: string; }
  | CombatEventBase & { type: "dispel"; abilityName: string; dispelledBuff: string; }
  | CombatEventBase & { type: "absorb"; abilityName: string; amount: number; }
  | CombatEventBase & { type: "phase_change"; phase: number; phaseName: string; }
  | CombatEventBase & { type: "enrage"; }
  | CombatEventBase & { type: "summon"; summonName: string; summonId: number; }
  | CombatEventBase & { type: "resource_change"; resourceType: ResourceType; amount: number; current: number; };
```
This lives in `src/shared/combat-interfaces.ts`. UI consumes it directly for combat log rendering.

---

### Decision 11: SeededRng Naming and API

**Issue:** `SeededRng` vs `SeededRNG`. Missing `nextFloat(min, max)`.

**Resolution:**
- Name: **`SeededRng`** (lowercase "ng", PascalCase class name convention)
- API:
```typescript
interface ISeededRng {
  next(): number;                              // [0, 1)
  nextInt(min: number, max: number): number;   // [min, max] inclusive
  nextFloat(min: number, max: number): number; // [min, max)
  nextBool(probability: number): boolean;      // true with given probability
  getState(): RngState;
  setState(state: RngState): void;
}
```
- Combat receives `ISeededRng` as a parameter. Never creates one.

---

### Decision 12: Encounter State Ownership

**Issue:** Engine expects to hold `ActiveEncounter` between ticks. Combat returns new `CombatState` each tick.

**Resolution:**
- **Combat owns encounter state internally.** Combat exposes:
  - `createEncounter(params: EncounterParams, rng: ISeededRng): EncounterId` — initializes internal state, returns handle
  - `tickEncounter(encounterId: EncounterId): TickResult` — advances one tick, returns events + status
  - `resolveEncounter(params: EncounterParams, rng: ISeededRng): EncounterResult` — runs full encounter to completion
  - `estimateOutcome(party: CombatEntity[], contentDifficulty: ContentDifficulty): OutcomeEstimate` — statistical estimate (no RNG)
- Engine holds an `EncounterId` handle, not the full combat state.
- For offline: engine calls `resolveEncounter()` (full sim) or `estimateOutcome()` (fast path).
- For active play: engine calls `createEncounter()` then `tickEncounter()` each game tick.
- `TickResult` includes `events: CombatEvent[]`, `status: 'ongoing' | 'victory' | 'wipe' | 'enrage' | 'timeout'`, and per-entity HP/resource snapshots for UI display.

---

### Decision 13: XP Formula Ownership

**Issue:** Both combat and engine claim proximity to mob XP calculation.

**Resolution:**
- **`calculateBaseMobXP(mobLevel: number): number`** lives in `src/shared/constants.ts` — it is a pure formula from the design doc (`MobLevel * 45 + 100`). Neither combat nor engine owns it exclusively.
- **Level delta modifier** lives in `src/shared/constants.ts` as a lookup table.
- **XP modifier stacking** (rested, racial, heirloom, guild hall) lives in engine's `ProgressionSystem` — engine owns application of modifiers.
- **`xpToNextLevel(level: number): number`** lives in `src/shared/constants.ts` — pure formula (`round(1000 * level^2.4)`).

---

### Decision 14: Data Loading Across Process Boundary

**Issue:** Main process and renderer both need game data. Nobody defines how.

**Resolution:**
- **Static data is bundled by Vite as JSON imports** in both processes.
- Data JSON files live in `src/game/data/content/`. Vite is configured to make these importable.
- **Main process:** `loadGameData()` imports + validates (Zod) at startup. Validation failure = app refuses to start (production) or logs warnings (dev mode).
- **Renderer process:** Imports the same JSON files directly (Vite bundles them into the renderer JS). NO Zod validation in renderer (already validated in main). No IPC needed for static data.
- This means static data is in memory twice (~2-3 MB each), which is acceptable within the 300 MB budget.
- Dynamic data (character state, inventory, quest progress) flows through IPC deltas as always.

---

### Decision 15: GearSlot — Back/Cloak Slot

**Issue:** Data plan includes `Back` slot. SQLite schema from design doc omits `back_item_id`.

**Resolution:** Add `back_item_id TEXT` to the characters table (or the equipment table if we normalize). The back/cloak slot exists — design doc loot references cloaks. The SQLite schema is **amended**.

Complete gear slot enum (16 slots):
```
Head, Shoulder, Back, Chest, Wrist, Hands, Waist, Legs, Feet,
Neck, Ring1, Ring2, Trinket1, Trinket2, MainHand, OffHand
```

---

### Decision 16: Companion Generation

**Issue:** No plan owns the algorithm for generating companion CombatEntities.

**Resolution:**
- **Engine owns companion generation.** `CompanionFactory` in `src/game/engine/CompanionFactory.ts`.
- Engine determines companion class/spec based on content requirements and player's role (fill missing roles).
- Engine calls combat's `aggregateCharacterStats()` with synthetic companion data to get `EffectiveStats`.
- **Data provides:** `companion_templates.json` — per-class/spec stat templates at various iLvl ranges, plus a default rotation reference per spec.
- **Combat provides:** `createCompanionCombatEntity()` that takes the template + quality tier and produces a ready `CombatEntity`.
- Quality tier iLvl offsets and efficiency multipliers are defined in `src/shared/constants.ts`:
  ```
  Recruit:  iLvl - 10,  70% efficiency
  Veteran:  iLvl + 0,   85% efficiency
  Elite:    iLvl + 5,  100% efficiency
  Champion: iLvl + 10, 115% efficiency
  ```
- Companion unlock thresholds are in dungeon/raid data files (not hardcoded in types).

---

### Decision 17: Combat Speed Controls

**Issue:** No plan addresses fast-forward for the auto-battler idle game.

**Resolution:**
- Engine supports **tick multiplier**: 1x, 2x, 4x, 8x, Max (instant resolve).
- At >1x, engine calls `tickEncounter()` multiple times per wall-clock second.
- At "Max", engine calls `resolveEncounter()` to skip to the end.
- This is an engine concern (GameLoop.ts). UI sends a `SET_SPEED` command.
- Combat functions are unchanged — they process one tick at a time regardless of wall-clock speed.

---

### Decision 18: Missing Systems Acknowledged (Deferred)

These are real gaps but NOT blockers for Phase 0. They will be addressed in v2 domain plans:

- **Pet/summon combat system** — combat v2 must add pet entities, stat inheritance, pet auto-attack
- **Form/stance switching** (Feral Druid) — combat v2 must add form state to CombatEntity
- **Heirloom definitions** — data v2 adds `heirlooms.json`
- **Guild hall upgrade definitions** — data v2 adds `guild_hall_upgrades.json`
- **Buff management outside combat** — engine v2 adds `BuffManager` for consumables/world buffs
- **Rotation data files** — data v2 adds `rotations.json` (data-driven, not hardcoded)
- **Character creation screen** — UI v2 adds as Phase 1 deliverable
- **Tutorial/onboarding** — UI v2 adds as Phase 1 deliverable
- **Confirmation dialogs** — UI v2 adds as Phase 0 deliverable
- **Notification toast system** — UI v2 adds as Phase 1 deliverable
- **Death penalty formula** — engine v2 specifies (repair cost, corpse run time loss)
- **Block value in damage pipeline** — combat v2 adds to physical damage calculation
- **Boss ability damage pathway** — combat v2 adds `applyBossAbility()` separate from player formulas
- **AoE damage models** — combat v2 adds uncapped/capped/chain variants

---

## Part 2: Implementation Tasks

These tasks create the shared foundation. After completion, v2 domain plans can be produced and executed independently.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.main.json`
- Create: `tsconfig.renderer.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/shared/.gitkeep` (directory marker)

**Step 1: Initialize package.json**

```bash
cd /mnt/c/Users/Caus/Desktop/LegendsOfTheRealm
npm init -y
```

Then replace contents of `package.json`:

```json
{
  "name": "legends-of-the-shattered-realm",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "description": "Offline single-player idle/incremental MMORPG",
  "main": "dist/main/main.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0"
  }
}
```

**Step 2: Install dependencies**

```bash
npm install
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"],
      "@game/*": ["src/game/*"],
      "@main/*": ["src/main/*"],
      "@renderer/*": ["src/renderer/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Step 4: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@game": path.resolve(__dirname, "src/game"),
      "@main": path.resolve(__dirname, "src/main"),
      "@renderer": path.resolve(__dirname, "src/renderer"),
    },
  },
});
```

**Step 5: Create directory structure**

```bash
mkdir -p src/shared src/game/engine src/game/combat src/game/data src/game/rng src/game/systems src/game/state-machines src/main src/renderer tests/shared
```

**Step 6: Create .gitignore**

```
node_modules/
dist/
*.db
*.db-journal
*.db-wal
*.db.bak
*.db.premigration.bak
.env
```

**Step 7: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors (no source files yet).

**Step 8: Verify Vitest runs**

```bash
npx vitest run
```

Expected: "No test files found" or similar (no tests yet).

**Step 9: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts .gitignore src/ tests/
git commit -m "chore: project scaffolding with TypeScript, Vitest, path aliases"
```

---

### Task 2: Shared Enums (`src/shared/enums.ts`)

**Files:**
- Create: `src/shared/enums.ts`
- Create: `tests/shared/enums.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/enums.test.ts
import { describe, it, expect } from "vitest";
import {
  ClassName,
  RaceName,
  ResourceType,
  QualityTier,
  GearSlot,
  DamageType,
  CompanionQuality,
  AbilityEffectType,
  TalentEffectType,
} from "@shared/enums";

describe("enums", () => {
  it("ClassName has 8 classes", () => {
    expect(Object.values(ClassName)).toHaveLength(8);
  });

  it("RaceName has 6 races", () => {
    expect(Object.values(RaceName)).toHaveLength(6);
  });

  it("ResourceType has 9 resource types", () => {
    expect(Object.values(ResourceType)).toHaveLength(9);
    expect(ResourceType.ComboPoints).toBe("combo_points");
    expect(ResourceType.ArcaneCharges).toBe("arcane_charges");
  });

  it("GearSlot has 16 slots", () => {
    expect(Object.values(GearSlot)).toHaveLength(16);
    expect(GearSlot.Back).toBe("back");
  });

  it("QualityTier has 5 tiers", () => {
    expect(Object.values(QualityTier)).toHaveLength(5);
  });

  it("CompanionQuality has 4 tiers", () => {
    expect(Object.values(CompanionQuality)).toHaveLength(4);
  });

  it("DamageType has physical and all magic schools", () => {
    expect(Object.values(DamageType)).toContain("physical");
    expect(Object.values(DamageType)).toContain("fire");
    expect(Object.values(DamageType)).toContain("shadow");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/enums.test.ts
```

Expected: FAIL (module not found).

**Step 3: Write the implementation**

```typescript
// src/shared/enums.ts

export enum ClassName {
  Warrior = "warrior",
  Mage = "mage",
  Cleric = "cleric",
  Rogue = "rogue",
  Ranger = "ranger",
  Necromancer = "necromancer",
  Shaman = "shaman",
  Druid = "druid",
}

export enum RaceName {
  Human = "human",
  Orc = "orc",
  Elf = "elf",
  Dwarf = "dwarf",
  Troll = "troll",
  Undead = "undead",
}

export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
  ComboPoints = "combo_points",
  SoulShards = "soul_shards",
  Focus = "focus",
  DivineFavor = "divine_favor",
  Maelstrom = "maelstrom",
  ArcaneCharges = "arcane_charges",
}

export enum QualityTier {
  Common = "common",
  Uncommon = "uncommon",
  Rare = "rare",
  Epic = "epic",
  Legendary = "legendary",
}

export enum GearSlot {
  Head = "head",
  Shoulder = "shoulder",
  Back = "back",
  Chest = "chest",
  Wrist = "wrist",
  Hands = "hands",
  Waist = "waist",
  Legs = "legs",
  Feet = "feet",
  Neck = "neck",
  Ring1 = "ring1",
  Ring2 = "ring2",
  Trinket1 = "trinket1",
  Trinket2 = "trinket2",
  MainHand = "main_hand",
  OffHand = "off_hand",
}

export enum DamageType {
  Physical = "physical",
  Fire = "fire",
  Frost = "frost",
  Arcane = "arcane",
  Nature = "nature",
  Shadow = "shadow",
  Holy = "holy",
}

export enum CompanionQuality {
  Recruit = "recruit",
  Veteran = "veteran",
  Elite = "elite",
  Champion = "champion",
}

// AbilityEffect types — the complete set from Decision 8
export type AbilityEffectType =
  | "damage" | "heal" | "dot" | "hot"
  | "buff" | "debuff"
  | "absorb" | "shield"
  | "summon" | "summon_pet"
  | "dispel" | "interrupt" | "purge"
  | "taunt" | "threat_mod"
  | "stun" | "root" | "silence" | "fear" | "disorient" | "charm"
  | "knockback" | "pull"
  | "mana_drain" | "mana_burn" | "resource_restore"
  | "immunity" | "damage_reduction"
  | "morph"
  | "aura"
  | "execute"
  | "guaranteed_crit"
  | "linked_health"
  | "channel";

// TalentEffect types — the complete set from Decision 9
export type TalentEffectType =
  | "stat_bonus"
  | "stat_percentage_bonus"
  | "ability_modifier"
  | "passive_proc"
  | "grant_ability"
  | "resource_modifier"
  | "cooldown_reduction"
  | "cost_reduction"
  | "damage_increase"
  | "healing_increase"
  | "crit_chance_bonus"
  | "crit_damage_bonus"
  | "threat_modifier"
  | "avoidance_bonus"
  | "pet_bonus"
  | "form_bonus"
  | "pushback_resistance";

// Primary stat names
export enum PrimaryStat {
  Strength = "strength",
  Agility = "agility",
  Intellect = "intellect",
  Stamina = "stamina",
  Spirit = "spirit",
}

// Secondary stat rating names
export enum SecondaryStat {
  CritRating = "crit_rating",
  HitRating = "hit_rating",
  HasteRating = "haste_rating",
  DefenseRating = "defense_rating",
  DodgeRating = "dodge_rating",
  ParryRating = "parry_rating",
  BlockRating = "block_rating",
  Resilience = "resilience",
  AttackPower = "attack_power",
  SpellPower = "spell_power",
  Armor = "armor",
  MP5 = "mp5",
}

// Character activity states
export enum ActivityType {
  Idle = "idle",
  Grinding = "grinding",
  Questing = "questing",
  Dungeon = "dungeon",
  Raid = "raid",
  Gathering = "gathering",
  Crafting = "crafting",
  Fishing = "fishing",
  RestedInn = "rested_inn",
}

// Encounter outcome (Decision 4)
export type EncounterOutcome = "victory" | "wipe" | "enrage" | "timeout";
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/enums.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/enums.ts tests/shared/enums.test.ts
git commit -m "feat: add canonical shared enums (9 resource types, 16 gear slots, all effect types)"
```

---

### Task 3: Branded ID Types and Core Type Definitions (`src/shared/types.ts`)

**Files:**
- Create: `src/shared/types.ts`
- Create: `tests/shared/types.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/types.test.ts
import { describe, it, expect } from "vitest";
import type {
  ItemId, QuestId, ZoneId, DungeonId, RaidId, AbilityId,
  TalentId, MobId, LootTableId, RecipeId, AchievementId,
  CharacterState, ItemInstance, LootTable, LootEntry,
} from "@shared/types";
import { makeItemId, makeQuestId, makeZoneId } from "@shared/types";

describe("branded ID helpers", () => {
  it("makeItemId creates a branded string", () => {
    const id = makeItemId("bjornskars_icebreaker");
    // At runtime it is just a string
    expect(typeof id).toBe("string");
    expect(id).toBe("bjornskars_icebreaker");
  });

  it("makeQuestId creates a branded string", () => {
    const id = makeQuestId("greenhollow_01");
    expect(id).toBe("greenhollow_01");
  });

  it("makeZoneId creates a branded string", () => {
    const id = makeZoneId("greenhollow_vale");
    expect(id).toBe("greenhollow_vale");
  });
});

describe("type structure smoke tests", () => {
  it("LootEntry has required fields", () => {
    const entry: LootEntry = {
      itemId: makeItemId("test_sword"),
      weight: 0.5,
      minQuantity: 1,
      maxQuantity: 1,
    };
    expect(entry.weight).toBe(0.5);
  });

  it("LootTable has 3-layer structure", () => {
    const table: LootTable = {
      id: "test_table" as LootTableId,
      guaranteedDrops: [],
      rolledDrops: [],
      rolledDropCount: 2,
      goldRange: { min: 10, max: 50 },
    };
    expect(table.rolledDropCount).toBe(2);
    expect(table.goldRange.min).toBe(10);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/types.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/types.ts
import type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, ActivityType, PrimaryStat, SecondaryStat,
  DamageType, AbilityEffectType, TalentEffectType,
} from "./enums";

// ============================================================
// Branded ID Types (compile-time safety, zero runtime cost)
// ============================================================

export type ItemId = string & { readonly __brand: "ItemId" };
export type QuestId = string & { readonly __brand: "QuestId" };
export type ZoneId = string & { readonly __brand: "ZoneId" };
export type DungeonId = string & { readonly __brand: "DungeonId" };
export type RaidId = string & { readonly __brand: "RaidId" };
export type AbilityId = string & { readonly __brand: "AbilityId" };
export type TalentId = string & { readonly __brand: "TalentId" };
export type MobId = string & { readonly __brand: "MobId" };
export type LootTableId = string & { readonly __brand: "LootTableId" };
export type RecipeId = string & { readonly __brand: "RecipeId" };
export type AchievementId = string & { readonly __brand: "AchievementId" };
export type BossId = string & { readonly __brand: "BossId" };

// ID factory functions (runtime casts)
export function makeItemId(s: string): ItemId { return s as ItemId; }
export function makeQuestId(s: string): QuestId { return s as QuestId; }
export function makeZoneId(s: string): ZoneId { return s as ZoneId; }
export function makeDungeonId(s: string): DungeonId { return s as DungeonId; }
export function makeRaidId(s: string): RaidId { return s as RaidId; }
export function makeAbilityId(s: string): AbilityId { return s as AbilityId; }
export function makeTalentId(s: string): TalentId { return s as TalentId; }
export function makeMobId(s: string): MobId { return s as MobId; }
export function makeLootTableId(s: string): LootTableId { return s as LootTableId; }
export function makeRecipeId(s: string): RecipeId { return s as RecipeId; }
export function makeAchievementId(s: string): AchievementId { return s as AchievementId; }
export function makeBossId(s: string): BossId { return s as BossId; }

// ============================================================
// Icon (used across data definitions for ASCII rendering)
// ============================================================

export interface AsciiIcon {
  char: string;    // Single character (CP437 or Unicode)
  fg: number;      // Foreground color index 0-31 (extended palette)
  bg: number;      // Background color index 0-31
}

// ============================================================
// Loot Table (Decision 5 — 3-layer model)
// ============================================================

export interface LootEntry {
  itemId: ItemId;
  weight: number;       // Relative weight (rolledDrops) or probability (bonusRolls)
  minQuantity: number;
  maxQuantity: number;
}

export interface SmartLootConfig {
  classWeightBonus: number;     // Extra weight for items usable by player's class
  specWeightBonus: number;      // Extra weight for items matching active spec
  upgradeWeightBonus: number;   // Extra weight for items that are an iLvl upgrade
}

export interface LootTable {
  id: LootTableId;
  guaranteedDrops: LootEntry[];
  rolledDrops: LootEntry[];
  rolledDropCount: number;
  goldRange: { min: number; max: number };
  bonusRolls?: LootEntry[];          // Independent probability rolls (chase items)
  smartLoot?: SmartLootConfig;
}

// ============================================================
// Character State (runtime, mutable, stored in SQLite)
// ============================================================

export interface CharacterState {
  id: number;                           // SQLite AUTOINCREMENT
  name: string;
  race: RaceName;
  className: ClassName;
  level: number;
  xp: number;
  restedXp: number;
  gold: number;
  currentZone: ZoneId;
  activity: ActivityType;
  activeSpec: string;                   // Spec ID within class
  talentPoints: Record<string, Record<TalentId, number>>;  // specId -> talentId -> points
  equipment: Record<GearSlot, number | null>;  // GearSlot -> item instance ID or null
  stats: EffectiveStats;
  companionClears: Record<string, number>;  // contentId -> clear count
  createdAt: number;                    // Unix timestamp
  lastPlayedAt: number;
}

// ============================================================
// Effective Stats (computed by combat, cached by engine)
// ============================================================

export interface EffectiveStats {
  // Primary
  strength: number;
  agility: number;
  intellect: number;
  stamina: number;
  spirit: number;

  // Derived
  maxHp: number;
  maxMana: number;
  attackPower: number;
  spellPower: number;
  armor: number;

  // Secondary (percentages, post-diminishing-returns)
  critChance: number;
  hitChance: number;
  hastePercent: number;
  dodgeChance: number;
  parryChance: number;
  blockChance: number;
  blockValue: number;
  defenseSkill: number;
  resilience: number;
  mp5: number;

  // Weapon
  weaponDamageMin: number;
  weaponDamageMax: number;
  weaponSpeed: number;
  offhandDamageMin?: number;
  offhandDamageMax?: number;
  offhandSpeed?: number;
}

// ============================================================
// Item Instance (runtime, stored in SQLite)
// ============================================================

export interface ItemInstance {
  id: number;                    // SQLite AUTOINCREMENT (instance ID)
  templateId: ItemId;            // References ItemDefinition
  characterId: number;           // Owning character
  bagSlot: number | null;        // null if equipped
  equippedSlot: GearSlot | null; // null if in bag
  durability: number;
  enchantId?: string;
  gemIds?: string[];
}

// ============================================================
// Quest Progress (runtime, stored in SQLite)
// ============================================================

export interface QuestProgressState {
  questId: QuestId;
  characterId: number;
  status: "accepted" | "in_progress" | "objectives_complete" | "turned_in";
  objectives: Record<string, number>;   // objectiveId -> current progress
  acceptedAt: number;
}

// ============================================================
// Account-wide Data
// ============================================================

export interface AccountData {
  heirloomUnlocks: ItemId[];
  transmogUnlocks: ItemId[];
  mountUnlocks: string[];
  titleUnlocks: string[];
  achievementPoints: number;
  guildHallLevel: number;
}

// ============================================================
// Notification (structured, not pre-formatted strings)
// ============================================================

export type GameNotification =
  | { type: "level_up"; characterId: number; newLevel: number }
  | { type: "item_acquired"; characterId: number; itemId: ItemId; quality: QualityTier }
  | { type: "quest_completed"; characterId: number; questId: QuestId }
  | { type: "achievement_earned"; achievementId: AchievementId; title: string; points: number }
  | { type: "companion_upgraded"; characterId: number; contentId: string; newQuality: CompanionQuality }
  | { type: "boss_killed"; characterId: number; bossId: BossId }
  | { type: "dungeon_cleared"; characterId: number; dungeonId: DungeonId }
  | { type: "lockout_expired"; contentType: "dungeon" | "raid"; contentId: string }
  | { type: "cooldown_ready"; characterId: number; cooldownType: string }
  | { type: "death"; characterId: number; zone: ZoneId };

// ============================================================
// Welcome Back Summary (structured data, UI formats)
// ============================================================

export interface WelcomeBackSummary {
  offlineSeconds: number;
  perCharacter: CharacterOfflineResult[];
  expiredLockouts: Array<{ contentType: "dungeon" | "raid"; contentId: string }>;
  cooldownsReady: Array<{ characterId: number; cooldownType: string }>;
}

export interface CharacterOfflineResult {
  characterId: number;
  characterName: string;
  activity: ActivityType;
  xpGained: number;
  levelsGained: number;
  goldEarned: number;
  itemsAcquired: Array<{ itemId: ItemId; quality: QualityTier; count: number }>;
  killCount?: number;
  questsCompleted?: QuestId[];
  dungeonClears?: number;
  professionSkillups?: Array<{ profession: string; gained: number }>;
  deaths?: number;
  restedXpGained: number;
}

// Re-export enums for convenience
export type {
  ClassName, RaceName, QualityTier, GearSlot, ResourceType,
  CompanionQuality, ActivityType, PrimaryStat, SecondaryStat,
  DamageType, AbilityEffectType, TalentEffectType,
} from "./enums";
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/types.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/types.ts tests/shared/types.test.ts
git commit -m "feat: add canonical shared types (branded IDs, CharacterState, LootTable, etc.)"
```

---

### Task 4: Shared Constants (`src/shared/constants.ts`)

**Files:**
- Create: `src/shared/constants.ts`
- Create: `tests/shared/constants.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/constants.test.ts
import { describe, it, expect } from "vitest";
import {
  TICK_RATE_MS, MAX_LEVEL, XP_FORMULA_EXPONENT,
  xpToNextLevel, calculateBaseMobXP, getMobXpLevelModifier,
  QUALITY_ILVL_OFFSET, STAT_BUDGET_PER_ILVL,
  COMPANION_THRESHOLDS, OFFLINE_EFFICIENCY,
  RATING_CONVERSIONS,
} from "@shared/constants";

describe("XP formulas", () => {
  it("xpToNextLevel matches design doc at key levels", () => {
    // Level 1: round(1000 * 1^2.4) = 1000
    expect(xpToNextLevel(1)).toBe(1000);
    // Level 10: round(1000 * 10^2.4) = round(251189) = 251189
    expect(xpToNextLevel(10)).toBe(Math.round(1000 * Math.pow(10, 2.4)));
    // Level 59 should be the last level
    expect(xpToNextLevel(59)).toBeGreaterThan(0);
    // Level 60 returns 0 (max level)
    expect(xpToNextLevel(60)).toBe(0);
  });

  it("calculateBaseMobXP follows MobLevel * 45 + 100", () => {
    expect(calculateBaseMobXP(1)).toBe(145);
    expect(calculateBaseMobXP(10)).toBe(550);
    expect(calculateBaseMobXP(60)).toBe(2800);
  });

  it("level delta modifiers match design doc", () => {
    expect(getMobXpLevelModifier(0)).toBe(1.0);    // Same level
    expect(getMobXpLevelModifier(-1)).toBe(0.9);   // 1 below
    expect(getMobXpLevelModifier(-2)).toBe(0.75);
    expect(getMobXpLevelModifier(-3)).toBe(0.5);
    expect(getMobXpLevelModifier(-5)).toBe(0.1);   // Grey
    expect(getMobXpLevelModifier(1)).toBe(1.1);    // 1 above
    expect(getMobXpLevelModifier(4)).toBe(1.4);    // 4+ above, capped
  });
});

describe("stat budget", () => {
  it("quality offsets match design doc", () => {
    expect(QUALITY_ILVL_OFFSET.common).toBe(0);
    expect(QUALITY_ILVL_OFFSET.uncommon).toBe(5);
    expect(QUALITY_ILVL_OFFSET.rare).toBe(10);
    expect(QUALITY_ILVL_OFFSET.epic).toBe(20);
    expect(QUALITY_ILVL_OFFSET.legendary).toBe(30);
  });

  it("stat budget is iLvl * 2", () => {
    expect(STAT_BUDGET_PER_ILVL).toBe(2);
  });
});

describe("companion thresholds", () => {
  it("dungeon thresholds: 1 / 10 / 25", () => {
    expect(COMPANION_THRESHOLDS.dungeon.veteran).toBe(1);
    expect(COMPANION_THRESHOLDS.dungeon.elite).toBe(10);
    expect(COMPANION_THRESHOLDS.dungeon.champion).toBe(25);
  });

  it("raid thresholds: 1 / 5 / 15", () => {
    expect(COMPANION_THRESHOLDS.raid.veteran).toBe(1);
    expect(COMPANION_THRESHOLDS.raid.elite).toBe(5);
    expect(COMPANION_THRESHOLDS.raid.champion).toBe(15);
  });
});

describe("offline efficiency penalties", () => {
  it("grinding is 80%", () => {
    expect(OFFLINE_EFFICIENCY.grinding).toBe(0.80);
  });
  it("raids are 0%", () => {
    expect(OFFLINE_EFFICIENCY.raid).toBe(0);
  });
});

describe("rating conversions at level 60", () => {
  it("22 crit rating = 1% crit", () => {
    expect(RATING_CONVERSIONS.critRating).toBe(22);
  });
  it("12.5 hit rating = 1% hit", () => {
    expect(RATING_CONVERSIONS.hitRating).toBe(12.5);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/constants.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/constants.ts

// ============================================================
// Core Game Constants
// ============================================================

export const TICK_RATE_MS = 1000;
export const MAX_LEVEL = 60;
export const XP_FORMULA_EXPONENT = 2.4;
export const BAG_SLOT_COUNT = 80;          // 4 bags * 20 slots (upgradeable)
export const MAX_CHARACTERS_PER_SAVE = 50;
export const AUTO_SAVE_INTERVAL_MS = 60_000;
export const MAX_OFFLINE_SECONDS = 604_800; // 7 days
export const TICK_BUDGET_MS = 50;           // Warn if tick exceeds this

// ============================================================
// XP Formulas (from design doc Section 2.4)
// ============================================================

/** XP required to go from `level` to `level + 1`. Returns 0 at max level. */
export function xpToNextLevel(level: number): number {
  if (level >= MAX_LEVEL) return 0;
  return Math.round(1000 * Math.pow(level, XP_FORMULA_EXPONENT));
}

/** Base XP reward for killing a mob of the given level. */
export function calculateBaseMobXP(mobLevel: number): number {
  return mobLevel * 45 + 100;
}

/**
 * XP modifier based on level delta (playerLevel - mobLevel).
 * Positive delta = mob is lower level than player.
 * Negative delta = mob is higher level than player.
 */
export function getMobXpLevelModifier(delta: number): number {
  // delta = mobLevel - playerLevel (positive = mob higher)
  if (delta >= 4) return 1.4;
  if (delta === 3) return 1.3;
  if (delta === 2) return 1.2;
  if (delta === 1) return 1.1;
  if (delta === 0) return 1.0;
  if (delta === -1) return 0.9;
  if (delta === -2) return 0.75;
  if (delta === -3) return 0.5;
  if (delta === -4) return 0.25;
  return 0.1; // -5 or worse = grey
}

// ============================================================
// Stat Budget (from design doc Section 2.2)
// ============================================================

export const STAT_BUDGET_PER_ILVL = 2;

export const QUALITY_ILVL_OFFSET = {
  common: 0,
  uncommon: 5,
  rare: 10,
  epic: 20,
  legendary: 30,
} as const;

// ============================================================
// Companion System
// ============================================================

export const COMPANION_THRESHOLDS = {
  dungeon: { veteran: 1, elite: 10, champion: 25 },
  raid: { veteran: 1, elite: 5, champion: 15 },
} as const;

export const COMPANION_EFFICIENCY = {
  recruit: 0.70,
  veteran: 0.85,
  elite: 1.00,
  champion: 1.15,
} as const;

export const COMPANION_ILVL_OFFSET = {
  recruit: -10,
  veteran: 0,
  elite: 5,
  champion: 10,
} as const;

// ============================================================
// Offline Efficiency Penalties
// ============================================================

export const OFFLINE_EFFICIENCY = {
  grinding: 0.80,
  questing: 0.75,
  dungeon: 0.70,
  gathering: 0.85,
  crafting: 0.95,
  fishing: 0.90,
  raid: 0,             // Raids cannot be idled
} as const;

// ============================================================
// Rested XP
// ============================================================

export const RESTED_XP_RATE = 0.05;        // 5% of level XP per 8 hours
export const RESTED_XP_INTERVAL = 28_800;  // 8 hours in seconds
export const RESTED_XP_CAP_MULTIPLIER = 1.5; // Cap at 150% of level XP
export const RESTED_XP_CONSUMPTION_MULTIPLIER = 2.0; // Doubles XP while active

// ============================================================
// Rating Conversions at Level 60 (from design doc Section 2.1.2)
// ============================================================

export const RATING_CONVERSIONS = {
  critRating: 22,        // 22 rating = 1% crit
  hitRating: 12.5,       // 12.5 rating = 1% hit
  hasteRating: 15,       // 15 rating = 1% haste
  defenseRating: 2.5,    // 2.5 rating = 1 defense skill
  dodgeRating: 18,       // 18 rating = 1% dodge
  parryRating: 20,       // 20 rating = 1% parry
  blockRating: 5,        // 5 rating = 1% block
  resilience: 25,        // 25 rating = 1% crit damage reduction
  spellHitRating: 12.5,  // Same as physical hit
} as const;

// ============================================================
// Combat Constants
// ============================================================

export const BASE_GCD_SECONDS = 1.5;
export const MIN_GCD_SECONDS = 1.0;
export const BASE_PHYSICAL_CRIT_MULTIPLIER = 2.0;
export const BASE_HEALING_CRIT_MULTIPLIER = 1.5;
export const BOSS_CRIT_SUPPRESSION = 0.048; // 4.8%
export const DUAL_WIELD_MISS_PENALTY = 0.19; // 19%
export const MELEE_AGGRO_THRESHOLD = 1.1;   // 110% threat to pull
export const RANGED_AGGRO_THRESHOLD = 1.3;  // 130% threat to pull
export const HEALING_THREAT_MULTIPLIER = 0.5;

// ============================================================
// HP and Mana formulas
// ============================================================

export const HP_PER_STAMINA = 10;
export const MANA_PER_INTELLECT = 15;

// ============================================================
// Armor Mitigation
// ============================================================

export const ARMOR_CONSTANT_BASE = 400;
export const ARMOR_CONSTANT_PER_LEVEL = 85;
// DamageReduction = Armor / (Armor + 400 + 85 * AttackerLevel)

// ============================================================
// Spell Coefficients
// ============================================================

export const SPELL_COEFFICIENT_REFERENCE_CAST = 3.5; // 3.5s cast = 1.0 coefficient
// coefficient = castTime / 3.5
// DoT coefficient = duration / 15
// AoE penalty = totalCoeff / sqrt(targetCount)
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/constants.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/constants.ts tests/shared/constants.test.ts
git commit -m "feat: add shared constants (XP formulas, stat budgets, rating conversions)"
```

---

### Task 5: Combat Interface Types (`src/shared/combat-interfaces.ts`)

**Files:**
- Create: `src/shared/combat-interfaces.ts`
- Create: `tests/shared/combat-interfaces.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/combat-interfaces.test.ts
import { describe, it, expect } from "vitest";
import type {
  CombatEntity, EncounterParams, EncounterResult,
  TickResult, CombatEvent, OutcomeEstimate, ISeededRng,
} from "@shared/combat-interfaces";
import { EncounterOutcome } from "@shared/enums";

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
      resources: { type: "rage", current: 0, max: 100 },
      equipment: { weaponSpeed: 2.6, weaponDps: 57.7 },
    };
    expect(entity.id).toBe(42);
    expect(typeof entity.id).toBe("number");
  });

  it("EncounterResult uses 4-value outcome", () => {
    const outcomes: EncounterOutcome[] = ["victory", "wipe", "enrage", "timeout"];
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
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/combat-interfaces.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/combat-interfaces.ts
import type {
  EffectiveStats, AbilityId, ItemId,
} from "./types";
import type {
  ResourceType, DamageType, CompanionQuality,
  EncounterOutcome,
} from "./enums";

// ============================================================
// Seeded RNG Interface (Decision 11)
// ============================================================

export interface RngState {
  s0: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface ISeededRng {
  next(): number;                              // [0, 1)
  nextInt(min: number, max: number): number;   // [min, max] inclusive
  nextFloat(min: number, max: number): number; // [min, max)
  nextBool(probability: number): boolean;
  getState(): RngState;
  setState(state: RngState): void;
}

// ============================================================
// Combat Entity (Decision 1 — numeric IDs)
// ============================================================

export interface ResourceState {
  type: ResourceType;
  current: number;
  max: number;
  secondary?: { type: ResourceType; current: number; max: number }; // e.g., combo points
}

export interface EquipmentSummary {
  weaponSpeed: number;
  weaponDps: number;
  offhandSpeed?: number;
  offhandDps?: number;
}

export interface AbilityInstance {
  id: AbilityId;
  name: string;
  resourceCost: number;
  resourceType: ResourceType;
  cooldownMs: number;
  castTimeMs: number;
  coefficient: number;
  baseDamage?: number;
  baseHealing?: number;
  damageType?: DamageType;
  maxTargets?: number;
  isAoE?: boolean;
}

export interface RotationEntry {
  abilityId: AbilityId;
  priority: number;           // Lower = higher priority
  condition?: RotationCondition;
}

export type RotationCondition =
  | { type: "target_hp_below"; threshold: number }
  | { type: "target_hp_above"; threshold: number }
  | { type: "self_resource_above"; threshold: number }
  | { type: "self_resource_below"; threshold: number }
  | { type: "buff_missing"; buffName: string }
  | { type: "debuff_missing_on_target"; debuffName: string }
  | { type: "cooldown_ready"; abilityId: AbilityId }
  | { type: "combo_points_at"; value: number }
  | { type: "always" };

export interface CombatEntity {
  id: number;                      // Numeric (Decision 1)
  name: string;
  entityType: "player" | "companion" | "enemy";
  role: "tank" | "healer" | "dps";
  classId: string;
  specId: string;
  level: number;
  effectiveStats: EffectiveStats;
  abilities: AbilityInstance[];
  rotation: RotationEntry[];
  resources: ResourceState;
  equipment: EquipmentSummary;
  companionQuality?: CompanionQuality;
  activePets?: PetState[];        // For pet classes (Decision 18 — placeholder)
}

export interface PetState {
  id: number;
  name: string;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
}

// ============================================================
// Encounter Params & Result (Decision 4, 12)
// ============================================================

export interface EncounterParams {
  party: CombatEntity[];
  enemies: CombatEntity[];
  encounterDefinition: EncounterDefinitionRef;
  tickLimit: number;
}

/** Reference to a boss encounter definition from data files. */
export interface EncounterDefinitionRef {
  bossId: string;
  phases: PhaseDefinition[];
  enrageTimerTicks: number;
  mechanics: MechanicDefinition[];
}

export interface PhaseDefinition {
  phase: number;
  name: string;
  triggerHpPercent?: number;
  triggerTick?: number;
  abilities: string[];
}

export interface MechanicDefinition {
  type: string;
  name: string;
  damage?: number;
  interval?: number;
  interruptible?: boolean;
  dispellable?: boolean;
}

export interface EncounterResult {
  outcome: EncounterOutcome;
  durationTicks: number;
  perEntity: Record<number, EntityPerformance>;  // Record, not Map (Decision 3)
  deaths: DeathEvent[];
  events: CombatEvent[];
  phasesReached: number;
  finalRngState: RngState;
}

export interface EntityPerformance {
  totalDamage: number;
  totalHealing: number;
  totalOverhealing: number;
  totalThreat: number;
  totalDamageTaken: number;
  totalHealingReceived: number;
  dps: number;
  hps: number;
  tps: number;
  deaths: number;
  abilitiesUsed: Record<string, number>;  // abilityId -> count
}

export interface DeathEvent {
  tick: number;
  entityId: number;
  killedBy: string;
}

// ============================================================
// Tick Result (Decision 12 — per-tick output)
// ============================================================

export interface TickResult {
  tick: number;
  status: "ongoing" | EncounterOutcome;
  events: CombatEvent[];
  entitySnapshots: Record<number, EntitySnapshot>;
}

export interface EntitySnapshot {
  hp: number;
  maxHp: number;
  resource: number;
  maxResource: number;
  buffs: string[];
  debuffs: string[];
  alive: boolean;
}

// ============================================================
// Combat Events (Decision 10)
// ============================================================

interface CombatEventBase {
  tick: number;
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
}

export type CombatEvent =
  | CombatEventBase & { type: "damage"; abilityName: string; amount: number; damageType: DamageType; isCrit: boolean; isBlocked: boolean; blockAmount: number; overkill: number }
  | CombatEventBase & { type: "heal"; abilityName: string; amount: number; isCrit: boolean; overheal: number }
  | CombatEventBase & { type: "miss"; abilityName: string; missType: "miss" | "dodge" | "parry" }
  | CombatEventBase & { type: "buff_apply"; buffName: string; duration: number; stacks: number }
  | CombatEventBase & { type: "buff_expire"; buffName: string }
  | CombatEventBase & { type: "death"; killingAbility: string }
  | CombatEventBase & { type: "ability_cast"; abilityName: string; castTime: number }
  | CombatEventBase & { type: "interrupt"; abilityName: string; interruptedAbility: string }
  | CombatEventBase & { type: "dispel"; abilityName: string; dispelledBuff: string }
  | CombatEventBase & { type: "absorb"; abilityName: string; amount: number }
  | CombatEventBase & { type: "phase_change"; phase: number; phaseName: string }
  | CombatEventBase & { type: "enrage" }
  | CombatEventBase & { type: "summon"; summonName: string; summonId: number }
  | CombatEventBase & { type: "resource_change"; resourceType: ResourceType; amount: number; current: number };

// ============================================================
// Outcome Estimate (Decision 12 — fast path for offline)
// ============================================================

export interface ContentDifficulty {
  contentId: string;
  contentType: "dungeon" | "raid10" | "raid20";
  requiredILvl: number;
  bossCount: number;
  averageClearTimeTicks: number;
}

export interface OutcomeEstimate {
  successRate: number;           // 0.0 - 1.0
  averageDurationTicks: number;
  expectedDeaths: number;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/combat-interfaces.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/combat-interfaces.ts tests/shared/combat-interfaces.test.ts
git commit -m "feat: add combat interface types (CombatEntity, EncounterResult, CombatEvent, etc.)"
```

---

### Task 6: IPC API Types (`src/shared/ipc-api.ts`)

**Files:**
- Create: `src/shared/ipc-api.ts`
- Create: `tests/shared/ipc-api.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/ipc-api.test.ts
import { describe, it, expect } from "vitest";
import { IPC_CHANNELS } from "@shared/ipc-api";
import type {
  GameStateDelta, EngineCommand, GameAPI,
} from "@shared/ipc-api";

describe("IPC channel names", () => {
  it("has all required channels", () => {
    expect(IPC_CHANNELS.STATE_DELTA).toBe("engine:state-delta");
    expect(IPC_CHANNELS.COMBAT_EVENTS).toBe("engine:combat-events");
    expect(IPC_CHANNELS.NOTIFICATION).toBe("engine:notification");
    expect(IPC_CHANNELS.COMMAND).toBe("engine:command");
    expect(IPC_CHANNELS.WELCOME_BACK).toBe("engine:welcome-back");
  });
});

describe("GameStateDelta uses Record not Map", () => {
  it("characterUpdates is a Record", () => {
    const delta: GameStateDelta = {
      timestamp: Date.now(),
      characterUpdates: { 1: { level: 10 } },
    };
    // Verify it serializes to JSON cleanly
    const json = JSON.stringify(delta);
    const parsed = JSON.parse(json) as GameStateDelta;
    expect(parsed.characterUpdates?.[1]?.level).toBe(10);
  });
});

describe("EngineCommand uses characterId not charId", () => {
  it("EQUIP_ITEM uses characterId", () => {
    const cmd: EngineCommand = {
      type: "EQUIP_ITEM",
      characterId: 1,
      itemInstanceId: 42,
      slot: "main_hand" as any,
    };
    expect(cmd.characterId).toBe(1);
    expect((cmd as any).charId).toBeUndefined();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/ipc-api.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/ipc-api.ts
import type {
  CharacterState, ItemInstance, QuestProgressState,
  AccountData, WelcomeBackSummary, GameNotification,
  EffectiveStats, ItemId, QuestId, ZoneId, DungeonId, RaidId,
  LootTable,
} from "./types";
import type { GearSlot, ActivityType, QualityTier } from "./enums";
import type { CombatEvent, TickResult } from "./combat-interfaces";

// ============================================================
// IPC Channel Names (single source of truth)
// ============================================================

export const IPC_CHANNELS = {
  COMMAND: "engine:command",
  STATE_DELTA: "engine:state-delta",
  COMBAT_EVENTS: "engine:combat-events",
  NOTIFICATION: "engine:notification",
  WELCOME_BACK: "engine:welcome-back",
  QUERY: "engine:query",
} as const;

// ============================================================
// State Delta (Decision 3 — JSON-safe, uses Record not Map)
// ============================================================

export interface GameStateDelta {
  timestamp: number;
  characterUpdates?: Record<number, Partial<CharacterState>>;
  inventoryUpdates?: Record<number, InventoryDelta>;
  questUpdates?: Record<number, QuestProgressDelta>;
  accountUpdates?: Partial<AccountData>;
}

export interface InventoryDelta {
  added?: ItemInstance[];
  removed?: number[];        // Item instance IDs
  updated?: ItemInstance[];
}

export interface QuestProgressDelta {
  questId: QuestId;
  objectives?: Record<string, number>;
  status?: QuestProgressState["status"];
}

// ============================================================
// Engine Commands (Decision 3 — uses characterId everywhere)
// ============================================================

export type EngineCommand =
  | { type: "CREATE_CHARACTER"; name: string; race: string; className: string }
  | { type: "DELETE_CHARACTER"; characterId: number }
  | { type: "SET_ACTIVITY"; characterId: number; activity: ActivityType; zoneId?: ZoneId; dungeonId?: DungeonId }
  | { type: "EQUIP_ITEM"; characterId: number; itemInstanceId: number; slot: GearSlot }
  | { type: "UNEQUIP_ITEM"; characterId: number; slot: GearSlot }
  | { type: "SET_TALENTS"; characterId: number; specId: string; points: Record<string, number> }
  | { type: "RESPEC_TALENTS"; characterId: number }
  | { type: "START_DUNGEON"; characterId: number; dungeonId: DungeonId }
  | { type: "START_RAID"; characterId: number; raidId: RaidId }
  | { type: "ACCEPT_QUEST"; characterId: number; questId: QuestId }
  | { type: "TURN_IN_QUEST"; characterId: number; questId: QuestId }
  | { type: "ABANDON_QUEST"; characterId: number; questId: QuestId }
  | { type: "SELL_ITEM"; characterId: number; itemInstanceId: number }
  | { type: "CRAFT_ITEM"; characterId: number; recipeId: string; quantity: number }
  | { type: "BUY_AUCTION"; auctionId: number }
  | { type: "LIST_AUCTION"; itemInstanceId: number; buyout: number }
  | { type: "UPGRADE_GUILD_HALL"; upgradeId: string }
  | { type: "SET_SPEED"; multiplier: number };  // Decision 17 — combat speed

// ============================================================
// Command Results (Promise-based responses)
// ============================================================

export interface CreateCharacterResult {
  success: boolean;
  characterId?: number;
  error?: string;
}

export interface EquipResult {
  success: boolean;
  error?: string;  // "Wrong class", "Level too low", etc.
}

export interface DungeonStartResult {
  success: boolean;
  encounterId?: string;
  error?: string;  // "On lockout", "Level too low", "Gear check failed"
}

// ============================================================
// Query API (read-only queries, Decision 3 — missing query APIs)
// ============================================================

export type EngineQuery =
  | { type: "CAN_START_DUNGEON"; characterId: number; dungeonId: DungeonId }
  | { type: "CAN_START_RAID"; characterId: number; raidId: RaidId }
  | { type: "GET_PARTY_PREVIEW"; characterId: number; contentId: string }
  | { type: "GET_TIME_ESTIMATES"; characterId: number }
  | { type: "VALIDATE_NAME"; name: string }
  | { type: "GET_BAG_SPACE"; characterId: number };

export interface CanStartContentResult {
  canStart: boolean;
  reasons: string[];               // Why not, if canStart is false
  gearCheckPassed: boolean;
  averageILvl: number;
  requiredILvl: number;
  companionQuality: string;
}

export interface TimeEstimates {
  xpPerHour: number;
  timeToNextLevel: number;         // Seconds, 0 if max level
  estimatedDungeonClearTime: number;
}

// ============================================================
// Full API surface exposed via preload (typed contract)
// ============================================================

export interface GameAPI {
  // Save management
  save: {
    create(name: string): Promise<{ saveId: number }>;
    list(): Promise<SaveSlotInfo[]>;
    open(saveId: number): Promise<FullGameState>;
    save(): Promise<void>;
    delete(saveId: number): Promise<void>;
  };

  // Character operations
  character: {
    create(name: string, race: string, className: string): Promise<CreateCharacterResult>;
    list(): Promise<CharacterSummaryInfo[]>;
    setActivity(characterId: number, activity: ActivityType, targetId?: string): Promise<void>;
    equipItem(characterId: number, itemInstanceId: number, slot: GearSlot): Promise<EquipResult>;
    setTalents(characterId: number, specId: string, points: Record<string, number>): Promise<void>;
    respec(characterId: number): Promise<void>;
  };

  // Content
  dungeon: {
    start(characterId: number, dungeonId: string): Promise<DungeonStartResult>;
    canStart(characterId: number, dungeonId: string): Promise<CanStartContentResult>;
  };

  raid: {
    start(characterId: number, raidId: string): Promise<DungeonStartResult>;
    canStart(characterId: number, raidId: string): Promise<CanStartContentResult>;
  };

  quest: {
    accept(characterId: number, questId: string): Promise<{ success: boolean }>;
    turnIn(characterId: number, questId: string): Promise<{ success: boolean; rewards?: any }>;
    abandon(characterId: number, questId: string): Promise<void>;
  };

  // Queries
  query: {
    timeEstimates(characterId: number): Promise<TimeEstimates>;
    validateName(name: string): Promise<{ valid: boolean; reason?: string }>;
    bagSpace(characterId: number): Promise<{ used: number; total: number }>;
    partyPreview(characterId: number, contentId: string): Promise<any>;
  };

  // Speed control (Decision 17)
  setSpeed(multiplier: number): Promise<void>;

  // Subscriptions (renderer subscribes to engine pushes)
  onStateDelta(callback: (delta: GameStateDelta) => void): () => void;
  onCombatEvents(callback: (events: CombatEvent[]) => void): () => void;
  onNotification(callback: (notification: GameNotification) => void): () => void;
  onWelcomeBack(callback: (summary: WelcomeBackSummary) => void): () => void;
}

// ============================================================
// Supporting types for API
// ============================================================

export interface SaveSlotInfo {
  id: number;
  name: string;
  characterCount: number;
  totalPlaytime: number;
  lastPlayed: number;
  version: string;
}

export interface CharacterSummaryInfo {
  id: number;
  name: string;
  race: string;
  className: string;
  level: number;
  activity: ActivityType;
  currentZone: string;
  averageILvl: number;
}

export interface FullGameState {
  characters: CharacterState[];
  account: AccountData;
  offlineSummary?: WelcomeBackSummary;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/ipc-api.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/ipc-api.ts tests/shared/ipc-api.test.ts
git commit -m "feat: add IPC API types (GameStateDelta, EngineCommand, GameAPI contract)"
```

---

### Task 7: Event Definitions (`src/shared/events.ts`)

**Files:**
- Create: `src/shared/events.ts`
- Create: `tests/shared/events.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/events.test.ts
import { describe, it, expect } from "vitest";
import type { GameEvent } from "@shared/events";

describe("GameEvent discriminated union", () => {
  it("CHARACTER_LEVELED event has required fields", () => {
    const event: GameEvent = {
      type: "CHARACTER_LEVELED",
      characterId: 1,
      newLevel: 10,
      timestamp: Date.now(),
    };
    expect(event.type).toBe("CHARACTER_LEVELED");
  });

  it("ITEM_ACQUIRED event has itemId as string", () => {
    const event: GameEvent = {
      type: "ITEM_ACQUIRED",
      characterId: 1,
      itemId: "bjornskars_icebreaker" as any,
      quality: "epic",
      timestamp: Date.now(),
    };
    expect(typeof event.itemId).toBe("string");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/events.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/events.ts
import type { ItemId, QuestId, DungeonId, RaidId, AchievementId, BossId, ZoneId } from "./types";
import type { QualityTier, CompanionQuality } from "./enums";

/**
 * Typed event definitions for the engine EventBus.
 * These events flow within the main process between engine subsystems.
 * The UI does NOT subscribe to these directly — it receives GameStateDelta and GameNotification via IPC.
 */
export type GameEvent =
  | { type: "CHARACTER_LEVELED"; characterId: number; newLevel: number; timestamp: number }
  | { type: "CHARACTER_DIED"; characterId: number; zone: ZoneId; cause: string; timestamp: number }
  | { type: "ITEM_ACQUIRED"; characterId: number; itemId: ItemId; quality: QualityTier; timestamp: number }
  | { type: "ITEM_EQUIPPED"; characterId: number; itemId: ItemId; slot: string; timestamp: number }
  | { type: "QUEST_ACCEPTED"; characterId: number; questId: QuestId; timestamp: number }
  | { type: "QUEST_COMPLETED"; characterId: number; questId: QuestId; timestamp: number }
  | { type: "QUEST_OBJECTIVE_PROGRESS"; characterId: number; questId: QuestId; objectiveId: string; progress: number; timestamp: number }
  | { type: "BOSS_KILLED"; characterId: number; bossId: BossId; contentId: string; timestamp: number }
  | { type: "DUNGEON_CLEARED"; characterId: number; dungeonId: DungeonId; timestamp: number }
  | { type: "RAID_BOSS_KILLED"; characterId: number; raidId: RaidId; bossId: BossId; timestamp: number }
  | { type: "ACHIEVEMENT_EARNED"; achievementId: AchievementId; title: string; points: number; timestamp: number }
  | { type: "COMPANION_UPGRADED"; characterId: number; contentId: string; newQuality: CompanionQuality; timestamp: number }
  | { type: "PROFESSION_SKILLUP"; characterId: number; profession: string; newSkill: number; timestamp: number }
  | { type: "GOLD_CHANGED"; characterId: number; amount: number; reason: string; timestamp: number }
  | { type: "DAILY_RESET"; timestamp: number }
  | { type: "WEEKLY_RESET"; timestamp: number }
  | { type: "LOCKOUT_EXPIRED"; contentType: "dungeon" | "raid"; contentId: string; timestamp: number }
  | { type: "COOLDOWN_READY"; characterId: number; cooldownType: string; timestamp: number };

/** Extract the event type for a specific event kind */
export type GameEventOfType<T extends GameEvent["type"]> = Extract<GameEvent, { type: T }>;
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/events.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/events.ts tests/shared/events.test.ts
git commit -m "feat: add typed event definitions for engine EventBus"
```

---

### Task 8: Utility Functions (`src/shared/utils.ts`)

**Files:**
- Create: `src/shared/utils.ts`
- Create: `tests/shared/utils.test.ts`

**Step 1: Write the test**

```typescript
// tests/shared/utils.test.ts
import { describe, it, expect } from "vitest";
import { clamp, lerp, formatGold, formatDuration, formatNumber } from "@shared/utils";

describe("clamp", () => {
  it("clamps below min", () => { expect(clamp(-5, 0, 100)).toBe(0); });
  it("clamps above max", () => { expect(clamp(150, 0, 100)).toBe(100); });
  it("returns value when in range", () => { expect(clamp(50, 0, 100)).toBe(50); });
});

describe("lerp", () => {
  it("returns a at t=0", () => { expect(lerp(10, 20, 0)).toBe(10); });
  it("returns b at t=1", () => { expect(lerp(10, 20, 1)).toBe(20); });
  it("returns midpoint at t=0.5", () => { expect(lerp(10, 20, 0.5)).toBe(15); });
});

describe("formatGold", () => {
  it("formats copper only", () => { expect(formatGold(42)).toBe("42c"); });
  it("formats silver and copper", () => { expect(formatGold(1234)).toBe("12s 34c"); });
  it("formats gold, silver, copper", () => { expect(formatGold(123456)).toBe("12g 34s 56c"); });
  it("formats zero", () => { expect(formatGold(0)).toBe("0c"); });
});

describe("formatDuration", () => {
  it("formats seconds", () => { expect(formatDuration(45)).toBe("45 seconds"); });
  it("formats minutes", () => { expect(formatDuration(125)).toBe("2 minutes, 5 seconds"); });
  it("formats hours", () => { expect(formatDuration(3723)).toBe("1 hour, 2 minutes"); });
  it("formats days", () => { expect(formatDuration(90061)).toBe("1 day, 1 hour"); });
});

describe("formatNumber", () => {
  it("formats small numbers", () => { expect(formatNumber(999)).toBe("999"); });
  it("formats thousands", () => { expect(formatNumber(1234)).toBe("1,234"); });
  it("formats millions", () => { expect(formatNumber(1234567)).toBe("1,234,567"); });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/shared/utils.test.ts
```

Expected: FAIL.

**Step 3: Write the implementation**

```typescript
// src/shared/utils.ts

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Format a copper amount as gold/silver/copper.
 * 1 gold = 100 silver = 10,000 copper.
 */
export function formatGold(copper: number): string {
  if (copper === 0) return "0c";

  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const remaining = copper % 100;

  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold}g`);
  if (silver > 0) parts.push(`${silver}s`);
  if (remaining > 0 || parts.length === 0) parts.push(`${remaining}c`);

  return parts.join(" ");
}

/**
 * Format seconds into a human-readable duration.
 * Shows the two most significant units.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    if (hours > 0) return `${days} day${days !== 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""}`;
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  if (secs > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}, ${secs} second${secs !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

/** Format a number with comma separators (e.g., 1,234,567). */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/shared/utils.test.ts
```

Expected: PASS.

**Step 5: Commit**

```bash
git add src/shared/utils.ts tests/shared/utils.test.ts
git commit -m "feat: add shared utility functions (clamp, lerp, formatGold, formatDuration)"
```

---

### Task 9: Verify Full Type Compilation

**Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: 0 errors. All shared types compile and cross-reference correctly.

**Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

**Step 3: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve any type compilation issues in shared foundation"
```

---

## Part 3: What Comes Next

After this plan is implemented, the following must happen:

1. **Produce v2 domain plans** — Each domain expert (realm-engine, realm-combat, realm-data, realm-ui) produces a revised implementation plan that:
   - References the shared types from `src/shared/` (never redefines them)
   - Incorporates all critique feedback from Round 1
   - Addresses the "Deferred" items from Decision 18
   - Has no cross-domain conflicts (all conflicts were resolved in Part 1)

2. **Begin implementation** in dependency order:
   - **Data Phase 1** (character foundation data: races.json, classes.json, etc.)
   - **Engine Phase 1** (Electron skeleton, SQLite, tick loop, IPC bridge)
   - **Combat Phase 1** (foundational math: stat calc, damage formulas, attack table)
   - **UI Phase 0** (Canvas renderer, Zustand stores, Tailwind shell)

3. **Phase 0 circular dependency** is broken by this plan — shared types exist before any domain starts work.
