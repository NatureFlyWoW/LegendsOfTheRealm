# Data Expert Critique — Round 1

## Reviewer: Data Domain Expert (realm-data)
## Date: 2026-02-15

---

## 1. SELF-CRITIQUE OF THE DATA PLAN (draft_v1_data.md)

### 1.1 The Stat Budget Formula -- Did I Even Read the Design Doc Correctly?

**PROBLEM: My quality multiplier table is fabricated.** In Section 4.1, I present this table:

```
| Quality    | Budget Multiplier |
| Common     | 1.00              |
| Uncommon   | 1.05              |
| Rare       | 1.10              |
| Epic       | 1.20              |
| Legendary  | 1.35              |
```

The design doc (`06_economy_and_professions.md`, lines 27-37) says something DIFFERENT:

```
Item Level = Content Level + Quality Modifier

Quality Modifiers:
Common: +0 | Uncommon: +5 | Rare: +10 | Epic: +20 | Legendary: +30

Total Stat Points = iLvl x 2
```

The design doc does NOT use a quality multiplier on the budget. It adds a flat iLvl offset BEFORE the `iLvl x 2` formula. A content-level-70 Epic has `iLvl = 70 + 20 = 90`, and stat budget = `90 * 2 = 180`. Under my fabricated formula, an iLvl-90 Epic would be `floor(90 * 2 * 1.20) = 216`. **That is a 20% inflation over the design doc's intended stat budget at every tier.** This error propagates to every item in the game. The balance test harness would validate against the WRONG formula, silently blessing over-budgeted items.

The design doc's examples confirm the plain formula: `iLvl 70: 140 stat points, iLvl 80: 160 stat points, iLvl 115: 230 stat points`. These are exactly `iLvl * 2` with NO quality multiplier. The quality is already baked into the iLvl via the flat offset.

**FIX REQUIRED:** Remove the quality multiplier table entirely. The stat budget formula is simply `Total Stat Points = iLvl * 2`, where the iLvl itself already includes the quality offset. This means my Section 4.4 iLvl progression table's "Budget Range (Epic)" column is wrong, my validation tests in Section 8.2 are wrong, and my `SET_BONUS_BUDGET_PENALTY` of 0.95 and `SOCKET_BUDGET_COST` of 8 are invented numbers with no design doc backing.

### 1.2 The ResourceType Enum Is Woefully Incomplete

In Section 2.1 (`enums.ts`), I define:

```typescript
export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
}
```

But the combat plan (`draft_v1_combat.md`, Phase 2 deliverables, line 30) explicitly lists EIGHT resource types:

> "Resource system (Rage, Mana, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom)"

And the design doc itself mentions "Arcane Charges" as a resource (Arcane Mage capstone: "costs 4 Arcane Charges", `02_character_and_combat.md` line 220). My enum has 3 of 8+ resource types. The combat domain cannot function with this enum. Ability definitions that reference `ResourceType` for their cost field would be unable to represent a Rogue spending Combo Points, a Necromancer consuming Soul Shards, or a Shaman building Maelstrom.

Now, to be fair, the design doc (`02_character_and_combat.md`) does NOT explicitly enumerate all resource types in a single table -- the combat plan's list of 8 appears to be extrapolated from class design. But regardless, my 3-entry enum is factually insufficient for the game's class diversity.

### 1.3 The GearSlot Enum Is Missing the Back Slot from the SQLite Schema

My `GearSlot` enum includes `Back = "back"`, which is good. But the engine's SQLite schema (`01_core_engine_architecture.md`, lines 126-155) does NOT include a `back_item_id` column in the characters table. It lists: head, shoulder, chest, wrist, hands, waist, legs, feet, neck, ring1, ring2, trinket1, trinket2, weapon, offhand. **No back/cloak slot.** Either I need to flag this as a missing column in the engine schema, or the back slot does not exist in this game. The design doc's dungeon loot includes "Cloak of Eternal Winter" (`draft_v1_data.md`, line 1624), so the slot clearly exists. This is a coordination gap between data and engine.

### 1.4 The Schema Is Over-Engineered in Places

My `AbilityDefinition` schema (Section 2.5) has 20+ fields including recursive `procEffect?: AbilityEffect` inside `AbilityEffect`. This recursive structure is a Zod validation nightmare. Zod does support `z.lazy()` for recursive schemas, but it incurs runtime overhead and makes error messages confusing. For a data file that will be hand-authored, this is fragile. I should consider flattening procs into a separate `procs.json` file or limiting recursion depth to 1 in the schema.

### 1.5 Missing Data the Engine and Combat Explicitly Need

**Heirloom definitions:** The engine plan references heirloom items (Section 3.4, line 108: "Heirlooms (+50%)"), and `01_core_engine_architecture.md` has `heirloom_unlocks` in the `account_data` table. I have ZERO schema for heirlooms. No `heirlooms.json`, no `HeirloomDefinition` interface. The XP modifier system cannot work without this.

**Guild hall upgrade definitions:** The engine plan has a `guild_hall` table with `barracks_level`, `bank_level`, and `upgrades`. I reference guild hall but provide no `guild_hall_upgrades.json` schema with costs, effects, and prerequisites.

**Mount and pet definitions:** I have `mounts.json` listed in my content directory but no `MountDefinition` schema in Section 2. Mounts appear in chase items, achievements, and vendor data but have no formal schema.

**Transmog definitions:** The account_data table stores `transmog_unlocks` as a JSON array, but I provide no schema for what a transmog entry looks like or how appearance IDs map to item IDs.

### 1.6 Data Loading Architecture -- Singleton Global State Is Dangerous

My `registry.ts` uses a module-level `let _data: GameData | null = null`. This is a singleton pattern that makes testing difficult (tests must manually call `setGameData()` and risk cross-contamination between test cases). It also raises the question: does this singleton live in the main process, the renderer process, or both? If the data needs to be available in BOTH processes (engine in main, UI components in renderer), we either load it twice or pass it via IPC. The plan does not address this.

---

## 2. CRITIQUE OF THE ENGINE PLAN (draft_v1_engine.md)

### 2.1 CRITICAL: The item_template_id INTEGER vs String ID Mismatch

I called this out in my own plan (Section 7.1), but the engine plan IGNORES it. The SQLite schema from `01_core_engine_architecture.md` (line 191) defines:

```sql
item_template_id INTEGER, -- References game data (items.json)
```

My data plan uses branded string IDs: `type ItemId = string & { readonly __brand: "ItemId" }`. The engine plan's Section 3.1 mentions "JSON columns (TEXT storing JSON) for flexible nested data" but does NOT address the `item_template_id INTEGER` conflict. Their Phase 2 deliverable #3 states: "Item creation from template IDs (referencing data files)."

If the engine implements `item_template_id` as INTEGER per the design doc schema, and my data files use string IDs like `"bjornskars_icebreaker"`, then every `INSERT INTO items` statement will fail with a type mismatch. This is not a theoretical risk -- it is a guaranteed bug.

The engine plan's Appendix ("For Data experts who will challenge this plan") even says:

> "I recommend string IDs... stored in SQLite as TEXT."

But the actual SQLite schema they inherit from the design doc says INTEGER. The plan acknowledges the preference but does not commit to changing the schema. This ambiguity WILL cause integration failures.

### 2.2 The quest_id Column Is Also INTEGER

Same problem in `quest_progress` table (`01_core_engine_architecture.md`, line 205):

```sql
quest_id INTEGER,
```

My `QuestId` is a branded string. And `raid_id TEXT` in the `raid_lockouts` table (line 229) uses TEXT. So within the same design doc schema, some foreign keys are INTEGER and some are TEXT. The engine plan inherits this inconsistency without resolving it.

### 2.3 The Engine's LootTable Interface Does Not Match My Schema

The engine plan (Section 4.3, lines 729-738) defines:

```typescript
interface LootTable {
    id: string;
    entries: {
        itemTemplateId: string;
        dropRate: number;           // 0.0 to 1.0
        minQuantity: number;
        maxQuantity: number;
        qualityOverride?: QualityTier;
    }[];
}
```

My loot table schema (Section 2.9) is structured COMPLETELY differently. Mine has three layers:

```typescript
interface LootTable {
    guaranteedDrops: LootTableEntry[];
    rolledDrops: LootTableEntry[];
    rolledDropCount: number;
    goldMin: number;
    goldMax: number;
    tierTokens?: { ... }[];
    bonusRolls?: LootTableEntry[];
}
```

The engine's flat `entries[]` array cannot represent my three-layer model (guaranteed / rolled / bonus). The field names differ: engine uses `dropRate`, I use `weight`. Engine uses `itemTemplateId`, I use `itemId`. Engine expects a single flat list; I expect structured layers with separate roll semantics.

The engine's `LootSystem.ts` (Section 2, line 227: "Consumes loot table JSON from data domain") will crash or produce wrong results if it tries to iterate `entries` on my data structure that has no `entries` field.

### 2.4 The MobTemplate Interface Duplicates Data I Own

The engine plan (Section 4.3, lines 745-755) defines its own `MobTemplate` with `xpReward`, `goldMin`, `goldMax`, `abilities`, `lootTableId`. My `MobDefinition` (Section 2.11) has the same fields with different names: `xpReward` (same), `meleeDamageMin`/`meleeDamageMax` (mine; engine has nothing for this), `lootTableId` (same). But the shapes do NOT align:

- Engine has `abilities: string[]` (ability ID list). I have `abilities: MobAbility[]` (full ability objects inline). The engine would need to destructure my nested objects to extract ID lists.
- Engine has `goldMin`/`goldMax`. My mob does not have gold fields -- gold is in the loot table's `goldMin`/`goldMax`. This is a data location disagreement.
- Engine has `lootTableId: string`. I have `lootTableId: LootTableId` (branded type). These are compatible at runtime but not at compile time without casting.

### 2.5 Missing Engine Table for Bad Luck Protection

My chase item data includes bad luck protection with `escalationKills` breakpoints. The engine needs to track per-character kill counts against specific sources (e.g., "how many times has this character killed Bjornskar"). The engine's SQLite schema has no table for this. The `companion_clears` JSON column in the `characters` table tracks dungeon/raid clear counts, but kill counts against specific BOSSES for bad luck protection purposes are different. If a chase item drops from a rare spawn, the engine needs to track rare spawn kills somewhere.

### 2.6 The Offline Calculation Uses Math.random() Implicitly

In the engine plan's offline grinding code (Section 3.4, line 437), the gold calculation reads:

```typescript
const goldPerMob = zone.levelRange.max * rng.nextFloat(0.4, 0.8);
```

This applies a SINGLE random gold value to ALL mobs killed during offline, rather than per-mob variance. Over 20,000 kills, every mob dropping the exact same gold amount is detectably wrong by the player. The design doc says mob gold should be a range per mob. The engine should either roll per-mob (expensive) or use expected value (deterministic, fast) for offline gold calculation. The current approach is neither correct nor fast -- it is wrong.

---

## 3. CRITIQUE OF THE COMBAT PLAN (draft_v1_combat.md)

### 3.1 The CombatEntity.id Type Mismatch

The combat plan (Section 4.1, line 419) defines:

```typescript
interface CombatEntity {
  id: string;
  ...
}
```

The engine plan (Section 4.1, line 599) defines:

```typescript
interface CombatEntity {
  id: number;
  ...
}
```

The engine uses `id: number` (line 599), combat uses `id: string` (line 419). The engine's `MemberResult` (line 619) uses `entityId: number`. The combat's `EntityPerformance` is keyed by `Map<string, EntityPerformance>` (line 435). When the engine passes a `CombatEntity` with `id: 42` and tries to look up results in `Map<string, EntityPerformance>`, the key `42` (number) will not match the stored key `"42"` (string). This is a classic JavaScript type coercion bug that will manifest as "combat returned results but engine cannot find them."

### 3.2 The EncounterResult.outcome Enum Differs Between Plans

Combat plan (line 432):
```typescript
outcome: 'victory' | 'wipe' | 'enrage' | 'timeout';
```

Engine plan (line 610):
```typescript
outcome: 'victory' | 'wipe' | 'enrage_wipe';
```

Combat has four outcomes; engine expects three. Combat distinguishes `enrage` from `timeout`; engine conflates them as `enrage_wipe`. The engine's dungeon state machine will need to handle all four, or combat will return a value the engine does not recognize. If the engine switches on `outcome === 'enrage_wipe'` and receives `'enrage'`, the dungeon state machine will fall through to an undefined state.

### 3.3 The 8 Resource Types Have No Data Schema

Combat Phase 2 lists eight resource types: Rage, Mana, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom. As noted in my self-critique, my `ResourceType` enum has only 3. But the deeper problem is: the design doc itself does NOT explicitly define these 8 resource types anywhere. The combat plan appears to have extrapolated them from WoW-like class design.

Looking at the actual design doc content: Warriors use Rage, Mages use Mana, Rogues use Energy, Arcane Mages use "Arcane Charges." That is 4 types confirmed. "Combo Points" (Rogue), "Soul Shards" (Necromancer), "Focus" (Ranger?), "Divine Favor" (Cleric?), "Maelstrom" (Shaman?) are all inferences, not design doc specifications. The combat plan is designing resource systems that do not exist in the design doc, and my data plan does not define data for them.

If these 8 resources are real, every ability definition needs an appropriate `resourceType` field, and my 3-value enum breaks the entire ability schema. If they are NOT real, the combat plan is over-scoping. Either way, this mismatch is unresolved.

### 3.4 Spec-Specific Default Rotations -- Where Is the Data?

Combat Phase 3 deliverable: "Default rotation priorities for all 24 specs." The combat plan's `rotation.ts` has `getDefaultRotation(classId, specId): RotationPriority[]`. But WHERE is this data defined? Is it hardcoded in `rotation.ts`? That violates the data-driven design principle from `CLAUDE.md`:

> "Data-driven design: Game content (zones, items, skills, mobs) defined in data files, not hardcoded"

My data plan has NO `rotations.json` file. The combat plan does not mention a data file for rotations either. This means 24 rotation priority lists will be hardcoded in combat code. If balance tuning requires changing a rotation priority, that is a code change, not a data change. This contradicts the project's core architectural principle.

### 3.5 The aggregateCharacterStats Function Expects Types I Do Not Provide

Combat's stat aggregation API (Section 4.2, line 500-506):

```typescript
function aggregateCharacterStats(
  character: CharacterData,
  equippedGear: ItemData[],
  activeTalents: TalentNode[],
  activeBuffs: BuffData[],
  racialData: RaceData
): EffectiveStats;
```

- `CharacterData` -- not defined by anyone. Is this the engine's Character type? My ClassDefinition?
- `ItemData[]` -- I define `ItemDefinition`, not `ItemData`. Name mismatch.
- `TalentNode[]` -- I define this, but "active talents" implies a list of nodes the player has invested in, which is a RUNTIME concept (talent_points_spent JSON in the characters table), not a static data concept. Combat expects pre-filtered talent nodes; who does the filtering?
- `BuffData[]` -- I have ZERO definition for buffs. Buffs come from abilities (the `AbilityEffect` with `type: "buff"`), but there is no standalone `BuffData` type or `buffs.json`.
- `RaceData` -- I define `RaceDefinition`, not `RaceData`. Another name mismatch.

These are not just naming issues. They indicate that combat designed its API without consulting the actual data types, and now the integration layer will require adapter code that nobody owns.

### 3.6 The Spell Damage Formula Has an Ordering Problem

Combat's spell damage formula (Section 3.3):

```
ModifiedDamage = RawDamage * (1 + sumOf(DamageModifiers)) * CritMultiplier
```

The design doc (`02_character_and_combat.md`, lines 446-452) says:

```
Modified = Raw x (1 + Damage Mods) x (1 + Crit if crit)
Resisted = Modified x (1 - Target Resistance %)
Final = Resisted x Variance (0.95-1.05)
```

The design doc uses `(1 + Crit if crit)` which for a spell crit would be `(1 + 1.5) = 2.5`? No, that makes a 250% crit which is wrong. The design doc likely means the crit multiplier replaces the base 1.0 (so either `1.0` for non-crit or `1.5` for crit), but the phrasing is ambiguous. The combat plan interprets this as a separate `CritMultiplier` value (1.0 or 1.5 or 2.0). The physical damage formula in the combat plan (Section 3.1) correctly applies it as a final multiplier. But the exact ordering -- does crit apply before or after resistance? -- matters for balance. The combat plan applies variance AFTER armor/resistance for physical but the formula ordering for spells needs explicit specification of where resistance sits relative to crit.

---

## 4. CRITIQUE OF THE UI PLAN (draft_v1_ui.md)

### 4.1 The UI Loads Data Files Independently -- Duplication Risk

Section 5 of the UI plan states:

> "Static data files (classes, talents, abilities, items, zones, etc.) are loaded once at app startup into an in-memory read-only cache on the renderer process."

And:

> "This data is bundled with the app and loaded via `import` or a data loader module at `src/renderer/data/DataLoader.ts`."

But my data plan's `loader.ts` lives at `src/game/data/loader.ts` and produces a `GameData` singleton in the main process. If the UI has its OWN `DataLoader.ts` in `src/renderer/data/`, we now have TWO separate data loading systems. If one uses Zod validation and the other does not, data integrity guarantees differ. If one caches and the other does not, memory usage doubles. If a data file is updated, both loaders must be invalidated.

The engine plan explicitly states that the renderer sends commands and receives state deltas. The data files are STATIC and the same for all players. The clean solution is: engine loads data once, and either (a) data files are statically imported by both processes (since they are bundled JSON), or (b) a single `GameData` object is serialized from main to renderer on startup. The UI plan does not address this coordination.

### 4.2 The Icon Format Is Used But Never Formally Contracted

The UI plan says items display "colored ASCII characters" and references `icon` fields. My data plan defines `icon: { char: string; fg: number; bg: number }` on `ItemDefinition`, `MobDefinition`, `AbilityDefinition`, and `RaceDefinition`. The UI plan's `Tileset.ts` file maps "game concepts to visual representation" and provides functions like `getCharForMob(mobType)`.

**Conflict:** If `Tileset.ts` has its OWN mapping of mob types to characters, it will conflict with the `icon` field in my `MobDefinition`. Which is authoritative? If both exist, they will diverge. If only my `icon` field is used, then `Tileset.ts` is unnecessary for entities that already have icons. If `Tileset.ts` is the authority, my `icon` field is dead data.

The UI plan's Section 3 character mapping table lists symbols like `&` for Boss mob (Bright Red), `r, s, w` for common mobs. But my `MobDefinition` has an `icon` field that could say `{ char: "B", fg: 9, bg: 0 }` for a boss. Who wins?

### 4.3 The Legendary Color Problem is Real

The UI plan (Section 3, Color System) acknowledges that ANSI 16-color lacks true orange and recommends extending to a 32-color palette. But my data schemas define `fg: number` with the comment "ANSI color index 0-15". If the UI extends to 32 colors, my data files can use indices 0-31, but any validation that checks `fg <= 15` will reject orange legendary items. The icon schema needs to explicitly state the valid range, and the UI plan's 32-color extension needs to be a cross-domain decision, not a UI-internal one.

### 4.4 The UI Action Types Do Not Align With Engine Commands

The UI plan's action types (Section 4, lines 383-406) and the engine plan's `EngineCommand` type (Section 4.2, lines 661-675) are DIFFERENT discriminated unions:

**UI plan:**
```typescript
{ type: 'EQUIP_ITEM'; characterId: number; itemId: number; slot: GearSlot }
```

**Engine plan:**
```typescript
{ type: 'EQUIP_ITEM'; charId: number; itemId: number; slot: GearSlot }
```

`characterId` vs `charId`. Same field, different name. This will cause a runtime key-mismatch error where the engine looks for `charId` and the renderer sends `characterId`.

**UI plan:**
```typescript
{ type: 'ACCEPT_QUEST'; characterId: number; questId: number }
```

**Engine plan:**
```typescript
{ type: 'ACCEPT_QUEST'; charId: number; questId: string }
```

`questId: number` vs `questId: string`. The quest ID type disagrees. My data plan uses `QuestId = string`. The UI sends `number`, the engine expects `string`, and the data stores `string`. A quest action from the UI will fail validation on the engine side.

### 4.5 IPC Update Rate Discrepancy

The UI plan (Section 4, line 368) says:

> "The engine sends state updates at most 10 times per second (every 100ms)."

The engine plan (Section 3.2, line 337) runs the tick loop at 1 Hz and sends state deltas once per tick. The UI plan expects 10 Hz; the engine provides 1 Hz. The combat log during active encounters, which the UI plan says arrives at 100ms intervals, will actually arrive at 1000ms intervals. If the UI interpolates between updates expecting 100ms gaps but receives 1000ms gaps, combat log entries will appear in jarring bursts.

The engine plan does mention (Appendix, line 943) that combat log IPC frequency could increase to 4 Hz during encounters, but that is a speculative optimization, not a committed interface contract.

### 4.6 Missing Data Fields for Tooltip Rendering

The UI's `ItemTooltip.tsx` mock (Section 7) shows:

```
| Durability: 92/100                  |   <- Yellow if < 20%
```

Durability is a RUNTIME field (current durability of a specific item instance, stored in the engine's `items` SQLite table). It is NOT a field on my `ItemDefinition` (which only has `maxDurability`). The UI must consume durability from the engine state delta, not from data files. This means the tooltip needs TWO data sources: static `ItemDefinition` from data, and dynamic item instance state from the engine. The UI plan does not explicitly address this dual-source tooltip pattern.

Similarly, the stat comparison section ("Currently Equipped: +12 Stamina") requires knowing what item is currently equipped in the same slot. This comes from the engine state (characterStore), not from data. The tooltip architecture must compose data from at minimum three sources: data (item template), engine state (equipped items), and combat (effective stats for comparison). The UI plan gestures at this but does not specify the data flow.

---

## 5. CROSS-CUTTING CONCERNS

### 5.1 Who Owns src/shared/types.ts?

My plan (Section 2.1) defines exhaustive enums and branded types in `src/shared/enums.ts` and implies these are the canonical source. The engine plan (Section 2, line 248) lists `types.ts` in `src/shared/` with "Core entity interfaces: Character, Item, Quest, Zone, Dungeon, Raid, Ability, Companion, AccountData." The combat plan (Section 4.5, line 565) says the `SeededRNG` interface is defined in `src/shared/types.ts` by engine, consumed by combat.

Nobody actually owns `src/shared/types.ts`. Three plans reference it; nobody takes responsibility for creating it. Every plan assumes someone else will. This file is the SINGLE MOST IMPORTANT file in the codebase -- if it is wrong, every domain breaks. It needs an explicit owner and a Phase 0 creation step that ALL domains sign off on.

My plan has a Phase 0 that creates `enums.ts` and `constants.ts` but does NOT mention creating the entity interfaces (`Character`, `Item`, etc.) that the engine uses. The engine plan lists them in `src/shared/types.ts` but does not include creating them as a Phase 1 deliverable.

### 5.2 Data Loading Order -- Who Triggers the Load?

The engine's `GameEngine.ts` presumably calls `loadGameData()` during initialization, before the first tick. But:

1. My `loadGameData()` is async (returns `Promise<GameData>`). Does the engine `await` it before starting the tick loop?
2. If data validation fails (a Zod schema error), should the app refuse to start? Show an error dialog? The engine plan does not handle this case.
3. If data files are bundled as static assets, do they load via `import` (synchronous, bundled by Vite) or `fs.readFile` (async, loaded from disk)? The engine plan's Phase 1 uses Vite for bundling, which would make `import` the natural choice. But my plan's `loader.ts` implies runtime file loading.

### 5.3 Schema Versioning for Post-Launch Content

My plan mentions forward compatibility (Section 9.3) but does not address how data schema changes interact with save migrations. If version 1.1 adds a Monk class with new abilities, the `abilities.json` files grow, but the SQLite schema does not change (class names are TEXT). However, if version 1.1 adds gem sockets to items that previously had none, existing items in the save file need their `ItemDefinition` updated, but the save stores `item_template_id` references. The item TEMPLATE changes, but the item INSTANCE in the save does not. Does the engine re-derive item stats from the template on load? Or are stats stored in the save? The engine's `items` table has `durability` but no stat columns -- implying stats are derived from the template at runtime. This is correct but undocumented.

### 5.4 The Shared Types Naming Convention Disagrees Everywhere

| Concept | Data Plan | Engine Plan | Combat Plan | UI Plan |
|---------|-----------|-------------|-------------|---------|
| Character entity | (not defined) | `Character` | `CharacterData` / `CombatEntity` | `CharacterState` |
| Item definition | `ItemDefinition` | `Item` (implied) | `ItemData` | (uses data's) |
| Race definition | `RaceDefinition` | (not defined) | `RaceData` | (uses data's) |
| Companion quality | `CompanionQuality` (enum) | `CompanionTier` (line 603) | `CompanionQuality` (type alias) | (not mentioned) |
| Entity ID | `string` (branded) | `number` | `string` | `number` |

Every plan invents its own names for the same concepts. This guarantees adapter code at every boundary.

---

## 6. DATA INTEGRITY RISKS

### 6.1 Cross-Reference Vulnerability Map

The following cross-references exist in the data and are all potential break points:

```
LootTableEntry.itemId --> ItemDefinition.id
QuestDefinition.rewards.choiceItems[] --> ItemDefinition.id
QuestDefinition.rewards.guaranteedItems[] --> ItemDefinition.id
QuestDefinition.prerequisites[] --> QuestDefinition.id
QuestDefinition.objectives[].targetId --> MobId | ItemId | ZoneId (polymorphic!)
ZoneDefinition.mobIds[] --> MobDefinition.id
ZoneDefinition.questIds[] --> QuestDefinition.id
ZoneDefinition.dungeonUnlock --> DungeonDefinition.id
ZoneDefinition.worldDropTable --> LootTable.id
DungeonBoss.lootTableId --> LootTable.id
DungeonDefinition.bosses[].bossId --> BossId (but BossId is only defined in boss data, not in a separate table)
RecipeDefinition.materials[].itemId --> ItemDefinition.id
RecipeDefinition.resultItemId --> ItemDefinition.id
AchievementCondition.targetId --> string (UNTYPED -- could be BossId, DungeonId, anything)
ItemSetDefinition.pieces[] --> ItemDefinition.id
ItemDefinition.setId --> ItemSetDefinition.id
ItemDefinition.sources[].sourceId --> string (UNTYPED)
```

The `targetId` fields in `QuestObjective` and `AchievementCondition` are typed as `string` with no brand. A typo in a quest objective that references `"goblin_raider"` when the mob is actually `"goblin_raiders"` will silently pass Zod validation and break at runtime. The Zod schema cannot validate cross-references; that requires a custom validation pass that loads ALL data and checks every reference.

### 6.2 Adding a New Dungeon -- The Full Data Flow

To add a new dungeon requires touching AT MINIMUM:

1. `dungeons/new_dungeon.json` -- dungeon definition with boss sequence
2. `mobs/new_zone.json` -- all trash mobs and boss mobs for the dungeon
3. `loot_tables/dungeon_loot.json` -- loot tables for every boss
4. `items/dungeon_loot.json` -- all items that drop (must be budget-verified)
5. `zones.json` -- update the zone to reference the dungeon
6. `quests/` -- potentially an unlock quest
7. `achievements.json` -- dungeon clear achievement
8. `chase_items.json` -- if any ultra-rare drops exist

That is 8 files minimum. Forgetting ANY one creates an orphaned reference. The cross-reference validation test catches this, but only if the developer remembers to run it. There is no tooling to scaffold a new dungeon and generate all required file stubs.

### 6.3 The Branded Type System Does Not Protect JSON

Branded types like `ItemId = string & { __brand: "ItemId" }` only protect at compile time in TypeScript. In the actual JSON data files, IDs are plain strings. Nothing prevents a JSON author from putting a `ZoneId` value into an `ItemId` field. The Zod schema would accept it (both are `z.string()`). The only protection is the cross-reference validation pass, which must be run AFTER all data is loaded.

---

## Summary of Highest-Priority Issues

| Priority | Issue | Affected Plans | Impact |
|----------|-------|---------------|--------|
| **P0** | Stat budget formula is wrong (quality multiplier fabricated) | Data, Balance Tests | All items over-budgeted by 5-35% |
| **P0** | item_template_id INTEGER vs string ID mismatch | Engine, Data | Every item creation/lookup fails |
| **P0** | LootTable interface mismatch (flat vs 3-layer) | Engine, Data | Loot system completely broken |
| **P0** | CombatEntity.id type mismatch (number vs string) | Engine, Combat | Combat results unlookupable |
| **P0** | EncounterResult.outcome enum mismatch (3 vs 4 values) | Engine, Combat | Dungeon state machine undefined behavior |
| **P0** | src/shared/types.ts has no owner | ALL | No shared contract exists |
| **P1** | ResourceType enum has 3 of 8+ needed values | Data, Combat | Ability schema cannot represent most classes |
| **P1** | UI action parameter names differ from engine commands | Engine, UI | Runtime key-mismatch on every action |
| **P1** | Rotation priorities not in data files | Combat, Data | Violates data-driven architecture |
| **P1** | Missing heirloom, guild hall, mount schemas | Data, Engine | Multiple systems have no data source |
| **P2** | Data loading happens in two processes independently | Data, UI | Memory duplication, validation divergence |
| **P2** | Tileset.ts vs icon field authority conflict | Data, UI | Two sources of truth for entity visuals |
| **P2** | IPC rate disagreement (1 Hz engine vs 10 Hz UI expectation) | Engine, UI | Combat log UX degradation |
| **P2** | Back/cloak gear slot missing from SQLite schema | Engine, Data | Cloaks unequippable |
