# Engine Expert Critique — Round 1

## Reviewer: Engine Domain Expert (realm-engine)
## Date: 2026-02-15

---

## 1. SELF-CRITIQUE OF THE ENGINE PLAN

### 1.1 The Tick Loop Drift Correction Has a Silent Bug

My own drift correction code on line 337-348 has a problem I did not address. When the catch-up cap of 10 ticks fires, I set `this.lastTickTime = now`, which means I **silently discard** all ticks beyond the 10 catch-up cap. If the app was backgrounded for 15 seconds, I process 10 ticks and lose 5. But the offline system (Phase 4) only kicks in on app close/reopen -- not on foreground recovery from a backgrounded state. There is a gap: backgrounded for >10 seconds but <app close threshold means lost ticks with no recovery path. I need to either:

1. Detect "mini-offline" periods (backgrounded >10s) and run the offline calculator for the gap, or
2. Not cap the catch-up and instead handle the performance impact differently (batch processing without IPC emission until caught up).

I mention "Background throttling: when window is minimized/hidden, tick rate can be reduced to 0.25 Hz" but never specify how to detect the transition or what happens to accumulated time when the window returns to foreground. This is underspecified.

### 1.2 GameState Change Tracking Is Hand-Waved

I state on line 206: "In-memory authoritative game state. Immutable-style updates with change tracking for IPC delta broadcasting." But I never specify HOW change tracking works. Do I use a Proxy? A diff function comparing old and new snapshots? An explicit dirty flag per field? Each has different performance characteristics and complexity. With 20+ characters each having dozens of fields, a naive diff every tick is expensive. An explicit dirty flag system requires discipline across every mutation site. This is a Phase 2 deliverable but the implementation approach is unspecified -- this is the kind of thing that becomes an architectural regret if not decided upfront.

### 1.3 The `Map<number, ...>` in WelcomeBackSummary Cannot Serialize Over IPC

Line 695: `restedXPAccumulated: Map<number, number>`. Electron's `structuredClone` does support Map, but if we ever fall back to JSON serialization for any reason, Maps do not serialize. More importantly, the rest of the `GameStateDelta` interface (line 651) uses `Map<number, ...>` throughout: `characterUpdates?: Map<number, Partial<CharacterState>>`. The UI plan mentions using `structuredClone` (line 633) but also mentions "JSON serialization" in the same breath. We need to pick one serialization strategy and enforce it everywhere. Using Maps in IPC payloads is a landmine.

### 1.4 Offline Grinding Formula Has a Flawed XP Calculation

Lines 416-429 show the level-up loop during offline grinding. The `xpPerMob` is calculated ONCE using `zone.levelRange.max` and the character's initial level. But if the character gains levels during the offline period, `calculateMobXP(zone.levelRange.max, currentLevel)` should change because the level delta modifier changes (if the character out-levels the zone, mobs give less XP). The loop recalculates `killsForLevel` but uses a constant `xpPerMob`. This means a character who goes from level 25 to level 35 offline will get the same XP-per-mob for all kills, even though mobs at level 30 are grey to a level 35 character. The fix is to recalculate `xpPerMob` inside the while loop, but I missed this.

### 1.5 No Specification of How Entity Factories Consume Data Templates

Line 56: "Entity factory functions consuming data-defined templates." I never define what this looks like. When the engine creates an item instance from a template ID, what exactly happens? Does it deep-copy the template and add instance-specific fields (durability, bag_slot, character_id)? Is the item in SQLite stored as `{template_id, instance_fields}` or as a fully denormalized copy? This matters for inventory management, equip/unequip, and the offline loot generation system. The SQLite schema from the design doc (line 188-199 of the architecture doc) stores `item_template_id INTEGER` -- so the items table is a sparse instance table referencing templates. But my plan never explicitly states this pattern or how runtime item objects combine template data with instance data.

### 1.6 Missing: How Does the Engine Know What Character Is "Active" vs "Inactive"?

Line 856: "Only active character's full state in memory; inactive characters stored as summary." But the game allows **all characters to be simultaneously doing activities** (one is grinding, another is crafting, a third is dungeon farming). The tick dispatcher must process ALL characters with active activities, not just the "selected" character. So what does "active" mean here? If it means "all characters with non-idle activity," then potentially all 20 characters are "active" and need full state. The memory optimization I proposed does not work as described.

### 1.7 EventBus Typing Is Promised But Not Defined

Line 211: `EventBus.ts` -- Typed publish/subscribe event system. I mention events like `CHARACTER_LEVELED`, `ITEM_ACQUIRED`, `BOSS_KILLED`, `QUEST_COMPLETED` and point to `src/shared/events.ts` for definitions. But I never define the event payload shapes. The AchievementSystem, CompanionSystem, QuestSystem, and potentially the UI notification system all depend on these events. Without a concrete event schema, every consumer will make assumptions that may not align.

---

## 2. CRITIQUE OF THE COMBAT PLAN

### 2.1 CRITICAL: Entity ID Type Mismatch (string vs number)

The combat plan defines `CombatEntity.id` as `string` (line 418). My engine plan defines it as `number` (lines 598, 619). This is not a minor inconsistency -- it is a type error that will fail at compile time. Specifically:

- Engine `CombatEntity.id: number` (line 598)
- Combat `CombatEntity.id: string` (line 418)
- Engine `MemberResult.entityId: number` (line 619)
- Combat `EntityPerformance` is keyed by `Map<string, EntityPerformance>` (line 435)

If combat returns a `Map<string, EntityPerformance>` and the engine expects to look up results by numeric character ID, every lookup fails. One of us must change. Since character IDs come from SQLite `AUTOINCREMENT` (integers), the engine's `number` type is correct. Combat must use `number`.

### 2.2 EncounterResult `outcome` Enum Mismatch

My engine plan defines the outcome as `'victory' | 'wipe' | 'enrage_wipe'` (line 612). Combat defines it as `'victory' | 'wipe' | 'enrage' | 'timeout'` (line 432). These do not match:
- Engine has `enrage_wipe` -- Combat has `enrage` and `timeout` (two separate values where engine has one).
- Engine lacks `timeout`.

The engine's state machine needs to handle each outcome differently (e.g., `enrage` might allow retry, `timeout` might not). These must be identical.

### 2.3 Combat Claims "Pure Functions, No Classes" But Has Mutable Combat State

Line 97: "Every module exports only pure functions -- no classes with mutable state, no singletons, no global variables." But `processTick` (line 186) takes `CombatState` and returns `CombatState` -- this implies a new state object per tick. For a 300-tick encounter, that is 300 allocations of a complex state object containing threat tables, buff lists, HP values for 5-20 entities, and combat event arrays. This is either:

1. Very expensive (creating deep copies every tick), or
2. Not actually pure (mutating the input and returning it).

The performance test on line 834 says "Single encounter (5 entities, 300 ticks): <50ms." If each tick deep-copies a `CombatState` containing 5 entities with full buff/debuff/threat data, 300 deep copies in 50ms is tight. The combat plan needs to address this: will it use structural sharing (immer-style), mutable state with explicit clone points, or something else? "Pure functions" is aspirational but may be impractical for the hot loop.

### 2.4 Missing `simulateEncounterTick()` API

My engine plan on line 631 specifies three calling patterns:
```
combatSystem.simulateEncounterTick(encounter: ActiveEncounter, rng: SeededRng): TickResult;
combatSystem.simulateEncounter(request: EncounterRequest): EncounterResult;
combatSystem.estimateEncounterOutcome(party, content): {...};
```

The combat plan only defines `simulateEncounter()` and `processTick()`. There is no `simulateEncounterTick()` with the signature I expect. The `processTick()` function takes a `CombatState` -- but who creates and manages the `CombatState` between ticks during active play? If the engine calls `processTick()` every tick during an active dungeon encounter, the engine must hold the `CombatState` between ticks and pass it back in. But the combat plan does not define how to INITIALIZE the `CombatState` from an `EncounterParams`. There is an implicit factory function missing.

Also, `estimateEncounterOutcome()` is my Phase 4 dependency for offline dungeon farming. The combat plan mentions `estimateClearProbability()` in `partyAnalysis.ts` (line 208) but this returns only a `number` (probability). My engine plan (line 637-641) expects it to also return `averageDuration` and `expectedDeaths`. The combat plan's API does not provide these.

### 2.5 RNG Interface Name Mismatch

I define the RNG as `SeededRng` (capital R, lowercase ng). The combat plan uses `SeededRNG` (all caps RNG) throughout (e.g., lines 185, 457, 565-573). This will cause import errors. One canonical name must be chosen.

### 2.6 Where Is `nextFloat(min, max)`?

The combat plan's `SeededRNG` interface (line 570) includes `nextFloat(min: number, max: number): number`. My `SeededRng` implementation (lines 536-546) does NOT define `nextFloat()`. It only has `next()` (returns [0,1)), `nextInt(min, max)`, and `nextBool(probability)`. Combat needs `nextFloat` for weapon damage variance (`random(0.95, 1.05)`, line 233) and gold amounts (`rng.nextFloat(0.4, 0.8)` -- wait, that is in MY plan, line 437). So I use `nextFloat` in my own offline calc but never define it in the class interface. Both plans reference a method that neither plan formally implements in the `SeededRng` class definition.

### 2.7 XP Formula Ownership Is Contradictory

Combat plan line 384: "XP values are specified in the design doc but XP awarding is realm-engine's responsibility. Combat owns the mob XP base calculation formula, engine owns the application with modifiers."

But my engine plan has `GrindingSystem.ts` (line 225) and `ProgressionSystem.ts` (line 228), and the offline calculation (lines 416-429) directly calculates `calculateMobXP(zone.levelRange.max, currentLevel)` and `xpToNextLevel(currentLevel)`. If combat owns the mob XP base formula, then engine needs to import it. But the combat plan puts XP formulas in section 3.11 as informational. Neither plan explicitly states: "the function `calculateMobXP()` lives in file X and is imported by file Y." This is a function that both domains claim proximity to but neither explicitly owns as an importable function.

---

## 3. CRITIQUE OF THE DATA PLAN

### 3.1 CRITICAL: The ID Format War Is Unresolved and Acknowledged But Not Resolved

The data plan acknowledges this on lines 1729-1734: "the engine's SQLite `items` table stores `item_template_id` as an integer FK. My `ItemId` branded strings must have a mapping to integer IDs, or the engine schema must use string IDs." They recommend TEXT IDs. I agree. But the original design doc schema (lines 188-199 of `01_core_engine_architecture.md`) uses `item_template_id INTEGER`. The `quest_progress` table uses `quest_id INTEGER`. The `auction_house` table uses `item_template_id INTEGER`.

This means either:
1. Every `INTEGER` foreign key to game data in the SQLite schema becomes `TEXT` -- requires schema redesign.
2. The data layer maintains a string-to-integer mapping -- adds complexity and fragility.
3. The data layer uses integer IDs internally -- contradicts the branded string types.

**This is a blocking coordination issue for Phase 0 of both plans.** Neither plan resolves it; both acknowledge it. Someone must make the call. I say: TEXT IDs throughout, change the schema. But this means the design doc's schema is wrong and must be explicitly superseded.

### 3.2 Branded Type IDs Are Strings But SQLite Does Not Enforce Branding

The data plan defines branded types like `type ItemId = string & { readonly __brand: "ItemId" }` (line 277). This is a compile-time-only guarantee. At runtime, a string is a string. When the engine reads `item_template_id TEXT` from SQLite, it gets a plain `string`, not a branded `ItemId`. The engine would need to cast every value read from the database: `row.item_template_id as ItemId`. This is noisy and error-prone. The data plan mentions `id-helpers.ts` for "Type-safe ID creation functions" (line 1338) but never defines them. What do they look like? Are they runtime validators or just type casts?

### 3.3 Zod at Startup: Performance and Error Handling

The data plan says "Every JSON file is validated at application startup" using Zod (line 1359). With 20+ JSON files containing potentially thousands of entries, Zod validation could take non-trivial time at startup. The plan estimates "<100ms" for loading (line 2033) but that is just JSON parsing -- Zod schema validation adds overhead per entry. With 2,000 items each validated against the `ItemDefinition` schema (which has 25+ fields, some with nested sub-schemas), this could be 200-500ms.

More critically: what happens when validation fails? The plan says "the game refuses to start" (line 1998). For a development workflow where data is being iterated on, refusing to start is hostile. The plan needs a graceful degradation mode for development (validate but warn, load what you can) versus production (refuse to start).

### 3.4 Data Loading Timing: Who Calls `loadGameData()` and When?

The data plan defines `loadGameData(): Promise<GameData>` (line 1390) and a singleton `getGameData()` (line 1406). My engine plan says data must be loaded before the first tick. But WHO calls `loadGameData()`? The engine? The data layer itself? The Electron main process startup sequence?

If data loads in the main process (where the engine runs), the renderer also needs access to this data for tooltips, talent trees, etc. The UI plan (line 453) says: "Static data files are loaded once at app startup into an in-memory read-only cache on the renderer process." This means data is loaded TWICE -- once in main, once in renderer. The data plan does not account for this dual-loading pattern. It defines a singleton (`_data`), but singletons do not cross process boundaries in Electron.

The data plan needs to define: is data loaded in main and sent to renderer via IPC, or is it independently loaded in both processes? If both, the Zod validation runs twice, doubling startup time.

### 3.5 The `ResourceType` Enum Is Incomplete

Line 216-218:
```typescript
export enum ResourceType {
  Mana = "mana",
  Rage = "rage",
  Energy = "energy",
}
```

But the combat plan lists EIGHT resource types (line 31): "Rage, Mana, Energy, Combo Points, Soul Shards, Focus, Divine Favor, Maelstrom." The data plan's enum only has three. Combo Points, Soul Shards, Focus, Divine Favor, and Maelstrom are missing. This means abilities that cost Soul Shards or generate Combo Points cannot reference their resource type in the `AbilityDefinition.resourceType` field. Either the combat plan is wrong about needing 8 resource types, or the data plan's enum is fatally incomplete.

### 3.6 Loot Table `weight` Semantics Are Ambiguous

The loot table schema (line 625-629) has `rolledDrops` with `weight` fields, and the validation test (line 1821) asserts `totalWeight <= 1.0`. But the Bjornskar example (lines 1621-1625) has 5 entries each with weight 0.20, totaling 0.90. There are also `bonusRolls` with weight 0.012.

Is `weight` a probability (each item independently rolled, like the engine plan's `dropRate`)? Or is it a normalized weight for weighted random selection from the pool? These produce very different loot outcomes:
- If probability: 5 items at 0.20 each means on average 1.0 items per kill. But `rolledDropCount: 3` says award 3 items. Contradiction.
- If normalized weight: 5 items totaling 0.90 weight means 10% chance of "nothing" per pick. Then `rolledDropCount: 3` means pick 3 from the pool using weighted selection.

The engine's loot rolling code needs to know which interpretation is correct. My engine plan calls it `dropRate` (line 733), implying probability. The data plan calls it `weight`, implying weighted selection. These are different algorithms.

### 3.7 No `averageClearTime` in Dungeon Schema

My engine plan's `DungeonData` interface (line 723) requires `averageClearTime: number` (in seconds) for the offline dungeon farming formula. The data plan's `DungeonDefinition` (line 824) has `estimatedClearTimeMinutes: { min: number; max: number }` -- a range in minutes, not a single value in seconds. My offline formula (line 450) uses `dungeon.averageClearTime` as a single number. I would need to convert: `averageClearTime = ((min + max) / 2) * 60`. This is not hard, but it is an example of schema mismatch between what the engine expects and what the data provides. The data plan does not provide the field in the format the engine needs.

---

## 4. CRITIQUE OF THE UI PLAN

### 4.1 IPC Update Frequency Mismatch: 10 Hz vs 1 Hz

The UI plan states on line 368: "The engine sends state updates at most 10 times per second (every 100ms)." My engine plan states the tick rate is 1 Hz (line 6, line 328) and that state deltas are sent once per tick (line 835: "Tick-based batching: accumulate changes, send one delta per tick (1 Hz)").

10 Hz vs 1 Hz is a 10x difference. If the UI expects 10 updates per second and the engine only sends 1, HP bar animations will be jerky, combat log updates will be bursty, and encounter HUD updates will feel laggy. If the engine sends 10 updates per second, it is doing 10x more IPC work than I planned.

The UI plan says "The UI interpolates between updates for smooth 60 FPS rendering where needed" but if updates only come at 1 Hz, interpolating HP values over a full second requires the engine to send target values (not just current values), which is not in my `GameStateDelta` design.

My appendix (line 943) mentions: "During active encounters, the engine can increase IPC frequency to 4 Hz for combat log entries specifically." This contradicts the UI's expectation of 10 Hz, and my own baseline of 1 Hz. We have three different numbers floating around.

### 4.2 `EngineStateUpdate` Format Does Not Match `GameStateDelta`

The UI plan defines its expected update format (line 351-361):
```typescript
interface EngineStateUpdate {
  type: 'full' | 'delta';
  timestamp: number;
  data: {
    characters?: CharacterState[];
    // ...
  };
}
```

My engine plan defines (lines 650-658):
```typescript
interface GameStateDelta {
  timestamp: number;
  characterUpdates?: Map<number, Partial<CharacterState>>;
  inventoryUpdates?: Map<number, InventoryDelta>;
  // ...
}
```

Key differences:
- UI expects a `type: 'full' | 'delta'` discriminator. Engine does not send one.
- UI expects `characters?: CharacterState[]` (array). Engine sends `characterUpdates?: Map<number, Partial<CharacterState>>` (map of partials).
- The UI has a flat `data` object. The engine has domain-specific fields at the top level.

These structures are incompatible. The Zustand stores in the renderer will be written against one shape; the engine will emit another. This will produce runtime errors at the IPC boundary.

### 4.3 Action Types Mismatch

The UI plan defines actions like (line 393-394):
```typescript
| { type: 'ACCEPT_QUEST'; characterId: number; questId: number }
| { type: 'TURN_IN_QUEST'; characterId: number; questId: number }
```

My engine plan defines (line 669-670):
```typescript
| { type: 'ACCEPT_QUEST'; charId: number; questId: string }
| { type: 'TURN_IN_QUEST'; charId: number; questId: string }
```

Two mismatches:
1. `characterId` vs `charId` -- different property names for the same concept.
2. `questId: number` vs `questId: string` -- the ID format issue again (integer vs string).

This pattern repeats across most action types. The UI uses `characterId`, the engine uses `charId`. Neither is wrong, but they must agree.

### 4.4 Data Loading in the Renderer Process Is Problematic

UI plan line 453: "Static data files are loaded once at app startup into an in-memory read-only cache on the renderer process. They do not change during gameplay. This data is bundled with the app and loaded via `import` or a data loader module at `src/renderer/data/DataLoader.ts`."

This means the renderer independently loads and parses game data JSON files. But with Electron's context isolation (which my engine plan enforces -- line 17), the renderer cannot use `fs` or `require('path')` to read files. Data would need to be:
1. Bundled via Vite's import system (static import of JSON), or
2. Sent from main to renderer via IPC, or
3. Loaded via fetch from a local server.

Option 1 (static import) bundles JSON into the renderer's JavaScript bundle, increasing bundle size by ~2 MB but making it available synchronously. Option 2 requires an IPC channel and async loading. Option 3 is overkill.

The UI plan does not reconcile this with Electron's security model. The plan says "loaded via `import` or a data loader module" -- the `import` path works if JSON files are in the renderer's bundle path, but the data plan puts them in `src/game/data/content/` which is the main process's domain. The Vite build config would need to be set up to make these files available to the renderer bundle. Nobody's plan addresses the Vite build configuration for data file bundling across processes.

### 4.5 The UI Creates Its Own Electron Window Configuration

UI plan Phase 0 deliverables (line 20): "Electron main process with frameless window, context isolation, typed IPC bridge." My engine plan Phase 1 deliverables (line 17-27) include the same things. Both plans claim to create the Electron main process, IPC bridge, and window configuration. This is a direct ownership collision. The engine plan says `main.ts` and `window.ts` are engine-owned files. The UI plan says its Phase 0 creates the Electron main process. Who actually writes `main.ts`?

This is a Phase 0 deadlock: the UI cannot start without a window, and the engine cannot start without a main process. If both plans independently create these files, they will conflict.

### 4.6 Panel Layout Uses localStorage But the Engine Uses SQLite

UI plan line 519: "Panel dimensions are persisted to localStorage so the player's layout preferences survive between sessions." But my engine plan persists window state in a platform-specific location (line 195: `window.ts -- Window creation, state persistence (bounds, maximized)`). The game also has save slots. If the player loads a different save, should the panel layout change? If panel layout is in localStorage, it is global to the Electron app, not per-save. If it is in SQLite, it is per-save.

More importantly, `localStorage` in Electron's renderer process is tied to the BrowserWindow's `partition`. If the save system creates new windows or sessions, localStorage could be wiped. This is fragile. UI preferences should either go into the engine's SQLite save (if per-save) or into an app-level preferences file (if global).

---

## 5. CROSS-CUTTING CONCERNS: GAPS AND CONFLICTS

### 5.1 The `src/shared/types.ts` Problem: Four Plans, Zero Definition

All four plans reference `src/shared/types.ts` as the canonical shared type file. None of them define its contents. Each plan defines its own version of core types:

- Engine defines `EncounterRequest`, `CombatEntity`, `EncounterResult`, `GameStateDelta`, `WelcomeBackSummary`, `EngineCommand`
- Combat defines its own `EncounterParams`, `CombatEntity`, `EncounterResult`, `EffectiveStats`
- Data defines `ItemDefinition`, `ZoneDefinition`, `DungeonDefinition`, `LootTable`, and 20+ other schemas
- UI defines `EngineStateUpdate`, `UIAction`, various store shapes

These are all supposed to live in shared types, but they are defined independently with DIFFERENT field names, different ID types, different shapes. Someone must create the canonical `types.ts` first, and everyone else must conform. The data plan's Phase 0 claims this (line 14-20), but the engine plan's Phase 1 also assumes shared types exist (line 42-45), and the engine plan expects to define IPC types.

### 5.2 Nobody Owns `calculateEffectiveStats()` at the Integration Point

My engine plan (appendix, line 931): "Combat owns `calculateEffectiveStats()`. Engine owns calling it at the right time and persisting the result."

The combat plan defines `aggregateCharacterStats()` in `stats.ts` (line 110). But its signature takes `(character: CharacterData, equippedGear: ItemData[], activeTalents: TalentNode[], activeBuffs: BuffData[], racialData: RaceData)`. The engine must construct ALL of these inputs from its own data model before calling combat. This means the engine must:

1. Look up the character from GameState
2. Resolve all equipped item IDs to `ItemData` objects from the data layer
3. Resolve talent point allocations to `TalentNode` objects from the data layer
4. Determine active buffs (from where? What system manages buffs outside combat?)
5. Look up racial data from the data layer

The engine plan never defines this assembly step. It is a non-trivial transformation from SQLite/GameState format to combat's expected input format. Neither plan owns this assembly code.

### 5.3 Companion Quality: Three Different Unlock Threshold Formats

- Engine plan line 137: `companionThresholds: { veteran: 1; elite: 10; champion: 25 }` (for dungeons)
- Data plan dungeon schema line 840-844: `companionThresholds: { veteran: number; elite: number; champion: number }`
- Combat plan line 618-624: table showing different thresholds for dungeons vs raids (Veteran: 1/1, Elite: 10/5, Champion: 25/15)

The engine hardcodes `{ veteran: 1; elite: 10; champion: 25 }` in the `DungeonData` interface definition. But the combat plan shows that raid thresholds are different (5/15). Who holds the authoritative thresholds? The data plan says the data files do. The engine plan embeds them in the type definition as literal values (`{ veteran: 1; elite: 10; champion: 25 }`), which contradicts data-driven design. The thresholds should be `number` fields in the data schema, read at runtime, not baked into type definitions.

### 5.4 Who Rolls Loot?

- Engine plan line 138: "Loot roll execution against data-defined loot tables using seeded RNG" (engine `LootSystem.ts`)
- Engine plan line 227: `LootSystem.ts` -- "Loot roll execution. Consumes loot table JSON from data domain."
- Data plan line 1560: "Every source of items in the game resolves through a LootTable. The engine calls `rollLoot(lootTableId, rng)` and receives a list of items."
- Data plan line 1560: "The data layer defines WHAT can drop; the engine defines HOW the roll happens."

This is consistent: engine rolls, data defines tables. Good. But then the data plan (line 1586-1592) defines `SmartLootConfig` with `classWeightBonus`, `specWeightBonus`, `upgradeWeightBonus`. The engine's `LootSystem` must implement this smart loot logic. But the engine plan never mentions smart loot at all -- it just says "Smart loot (spec awareness)" in a parenthetical (line 139). The engine plan's `LootTable` interface (line 729-738) does not include smart loot fields. These must be added, or the smart loot system has no consumer.

### 5.5 The Heirloom System Exists in No Plan

The design doc mentions heirlooms. My engine plan mentions `heirloom_unlocks TEXT` in the `account_data` table (from the design doc schema). The engine plan mentions "XP modifier stacking (human racial, heirlooms, guild hall)" on line 229. But NO plan defines what heirlooms are, how they work, their item definitions, their XP bonus mechanics, or how they are unlocked. The data plan does not list a `heirlooms.json` schema. The combat plan does not account for heirloom stat effects. The UI plan does not have an heirloom panel.

This is a feature referenced in multiple plans but defined in none.

### 5.6 Death and Repair Cost: Nobody Owns the Full Loop

My engine plan mentions "Death estimation during offline grinding" (line 109) and "Death chance" in `GrindingSystem.ts` (line 225). But what happens on death? The design doc presumably has a death penalty (repair costs, corpse run time loss). My plan never specifies:
- The death penalty formula
- How death interacts with the offline formula (lost time? lost XP? gold repair cost?)
- Where repair costs come from (the data plan mentions `gold_sinks.json` with repair costs, but the engine must apply them)
- Whether death has any effect during active play vs offline

### 5.7 Where Do Buffs Come From Outside Combat?

Combat's `aggregateCharacterStats()` takes `activeBuffs: BuffData[]`. But outside of combat, where do buffs come from? Guild hall bonuses? Consumables (food/elixirs/flasks)? World buffs? No plan defines a buff management system outside combat. The engine plan has no `BuffSystem.ts`. If a character eats food before entering a dungeon for +30 Stamina, where is that tracked? Who applies it? Who removes it when it expires?

---

## 6. IMPOSSIBLE TIMELINE CONFLICTS AND PHASE DEADLOCKS

### 6.1 The Phase 0 Circular Dependency

- Data Phase 0 (shared types) claims to be the root with no dependencies.
- Engine Phase 1 (skeleton) claims to have no dependencies on other domains.
- UI Phase 0 (foundation) requires the IPC bridge from Engine Phase 1.

But Engine Phase 2 requires Data Phase 0 (shared types). And Data Phase 0 requires agreement from ALL domains on type shapes. This means Data Phase 0 cannot complete until Engine, Combat, and UI have reviewed and agreed on types. But Engine Phase 1 is supposed to have "zero dependencies on other domains" -- yet it must use the shared types from Data Phase 0 for IPC type definitions.

The actual dependency order is: Data Phase 0 -> (all domains review) -> Engine Phase 1 (using shared types for IPC) -> UI Phase 0 (using Engine IPC bridge). This means Data Phase 0 is the true root, but it requires cross-domain consensus before it can finalize, creating a soft deadlock where nobody can fully start until everyone partially starts.

### 6.2 Engine Phase 3 Needs Combat Stubs That Need Data Stubs

Engine Phase 3 (tick dispatch) needs:
- Combat: `simulateEncounterTick()` function signature (can be stub)
- Data: one complete zone definition (Greenhollow Vale) with mob templates, loot table, XP table

Combat Phase 1 (foundational math) needs:
- Data: `stats.json`, `abilities.json`, `classes.json`, `races.json`

Data Phase 1 (character foundation) needs:
- Nothing from engine or combat (good)

So the order should be: Data Phase 0 -> Data Phase 1 -> Combat Phase 1 (using data) + Engine Phase 3 (using data stubs + combat stubs). But Engine Phase 3 also needs the XP table, which the data plan puts in `src/shared/constants.ts` as part of Phase 0. The XP formula `round(1000 * (level ^ 2.4))` is a constant, but the mob XP base formula and level delta modifiers are in the combat plan (section 3.11). Engine Phase 3's `GrindingSystem` needs BOTH. If combat and data are not ready, engine Phase 3 is blocked.

### 6.3 The Balance Test Harness Cannot Start Until Both Combat and Data Are Done

Data Phase 7 (balance test harness) requires:
- All data (Phases 1-6 complete)
- Combat's `simulateEncounter()` API (Combat Phase 4)

Combat Phase 6 (balance and hardening) requires:
- The balance test harness from Data Phase 7

This is circular: Data Phase 7 needs Combat Phase 4, and Combat Phase 6 needs Data Phase 7. The workaround is that Combat Phase 6 and Data Phase 7 are the same activity from different perspectives, but neither plan acknowledges this or proposes a shared ownership model.

### 6.4 UI Phase 4 (Dungeons) Needs Engine Phase 5 + Combat Phase 4

UI Phase 4 (dungeon/raid interface) says it requires "realm-engine dungeon state machine and realm-combat encounter resolution to be functional for live testing" (line 768). Engine Phase 5 (content state machines) requires "full `simulateEncounter()` with boss mechanics" from Combat Phase 4. Combat Phase 4 requires "boss encounter definitions" from Data Phase 4.

The chain: Data Phase 4 -> Combat Phase 4 -> Engine Phase 5 -> UI Phase 4. This is a four-deep sequential dependency chain. If any one domain slips, UI Phase 4 (the core gameplay loop) is delayed. The UI plan acknowledges this can be worked around with mock data, but the engine plan does NOT mention mock combat results as an option for its Phase 5.

---

## Summary of Most Critical Issues (Ranked by Severity)

1. **Entity ID type mismatch (string vs number)** -- Affects all four plans. Blocks compilation. Must be resolved in Day 1 coordination.

2. **IPC state format mismatch (GameStateDelta vs EngineStateUpdate)** -- Engine and UI define incompatible structures for the most critical data flow in the system.

3. **Loot table `weight` vs `dropRate` semantics** -- Engine and data define different interpretations of the same field, producing different gameplay outcomes.

4. **IPC update frequency (1 Hz vs 10 Hz)** -- Engine and UI disagree on the fundamental update cadence.

5. **ResourceType enum missing 5 of 8 types** -- Data plan is incomplete; combat plan cannot express ability costs.

6. **Nobody owns the character-to-CombatEntity assembly** -- A non-trivial transformation that falls between engine and combat with no owner.

7. **Data loading across Electron process boundary** -- Both main and renderer need data; nobody defines how it gets to both.

8. **The offline grinding XP formula ignores level-dependent mob XP changes** -- Will produce incorrect offline results for characters who level up significantly.
