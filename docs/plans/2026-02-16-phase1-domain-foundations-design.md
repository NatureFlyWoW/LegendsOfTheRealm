# Phase 1 Design: Domain Foundations

**Date:** 2026-02-16
**Status:** Proposed
**Builds on:** Phase 0 Cross-Domain Resolution (2026-02-15)

---

## 1. What We Have (Phase 0 Deliverables)

Phase 0 established the shared foundation in `src/shared/`:

| File | Contents |
|------|----------|
| `enums.ts` | 9 resource types, 16 gear slots, 8 classes, 6 races, quality tiers, damage types, companion quality, activity types, 34 ability effect types, 17 talent effect types |
| `types.ts` | 12 branded ID types with factories, LootTable (3-layer), CharacterState, EffectiveStats (25 fields), ItemInstance, QuestProgressState, AccountData, GameNotification (10 variants), WelcomeBackSummary |
| `combat-interfaces.ts` | ISeededRng, CombatEntity (numeric id), ResourceState, EncounterParams, EncounterResult (4 outcomes), TickResult, EntitySnapshot, CombatEvent (14 event types), ContentDifficulty |
| `ipc-api.ts` | IPC_CHANNELS, GameStateDelta (Record not Map), EngineCommand (18 types), EngineQuery (6 types), GameAPI interface |
| `events.ts` | GameEvent discriminated union (17 event types) |
| `utils.ts` | clamp, lerp, formatGold, formatDuration, formatNumber |
| `constants.ts` | XP formula, stat budgets, rating conversions, companion thresholds, offline efficiency, combat constants |

**68 tests passing. 0 TypeScript errors.**

---

## 2. Phase 1 Goal

**Each domain builds its foundational layer independently.** No cross-domain integration yet. Where one domain would normally consume another's output, it uses stubs or mock data.

Phase 1 ends when:
- **Engine:** Electron app boots, SQLite database opens with schema, tick loop runs at 1 Hz, SeededRng is deterministic, IPC bridge is typed and functional, saves can be created/opened/backed up
- **Combat:** All core math formulas (stats, attack table, damage, healing, threat, resources) pass hand-calculated unit tests from the design doc
- **Data:** Zod schemas for races/classes/stats exist and validate, initial JSON files (races.json, classes.json, stats.json) are complete, data loader skeleton works
- **UI:** Canvas renders a character grid at 60 FPS with bitmap font, box-drawing borders work, Tailwind AppShell renders with panel layout, Zustand store skeleton subscribes to mock IPC

---

## 3. Prerequisite Tasks (Before Parallel Work)

These must be completed first because all 4 tracks depend on them.

### 3.1 Add Missing Enums

The shared enums are missing types that all domains need:

```typescript
// Missing from enums.ts — needed by data schemas, combat, and UI
export enum WeaponType {
  Sword1H, Sword2H, Mace1H, Mace2H, Axe1H, Axe2H,
  Dagger, Staff, Polearm, Wand, Bow, Shield, OffhandFrill
}

export enum ArmorType {
  Cloth, Leather, Mail, Plate
}

export enum TalentSpec {
  // 3 per class = 24 specs total
  // Warrior: Protection, Arms, Fury
  // Mage: Fire, Frost, Arcane
  // etc.
}
```

### 3.2 Add *Definition Types

Phase 0 created runtime state types (CharacterState, ItemInstance). Phase 1 needs **data definition types** — the shapes of JSON content files that all domains consume:

- `RaceDefinition` — 6 races with stat bonuses, profession bonuses, ASCII icon
- `ClassDefinition` — 8 classes with base stats, resource types, armor proficiencies, specs
- `StatFormulas` — rating conversions, diminishing return curves, caps
- `AbilityDefinition` — ability templates consumed by combat and displayed by UI
- `TalentNode` / `TalentTree` — talent data consumed by combat and rendered by UI
- `ItemDefinition` — item templates referenced by loot tables, tooltips, crafting
- `ZoneDefinition` — zone data for engine activity management and UI rendering
- `MobDefinition` — enemy stat blocks for combat simulation
- `DungeonDefinition` / `RaidDefinition` — content structure for engine state machines
- `QuestDefinition` — quest data for engine quest system
- `ProfessionDefinition` / `RecipeDefinition` — profession content

These go in `src/shared/types.ts` (or a new `src/shared/definitions.ts` to keep the file manageable).

### 3.3 Set Up electron-vite

Replace the current bare Vite setup with electron-vite for proper Electron multi-process builds:

- Install: `electron`, `electron-vite`, `better-sqlite3`, `@electron/rebuild`, `react`, `react-dom`, `zustand`, `tailwindcss`, `zod`
- Split tsconfig into:
  - `tsconfig.json` — base config with shared options
  - `tsconfig.main.json` — extends base, `src/main/**`
  - `tsconfig.preload.json` — extends base, `src/main/preload.ts`
  - `tsconfig.renderer.json` — extends base, `src/renderer/**`, includes DOM lib
  - `tsconfig.test.json` — extends base, includes test files
- Create `electron.vite.config.ts` with main/preload/renderer entries
- Create directory structure:
  ```
  src/main/          # Electron main process
  src/main/preload.ts
  src/renderer/      # React renderer
  src/renderer/index.html
  src/renderer/main.tsx
  src/game/          # Game logic (shared between processes via imports)
  src/shared/        # Already exists
  ```

### 3.4 Install All Dependencies

```
# Core
electron electron-vite @electron/rebuild

# Main process
better-sqlite3 kysely
@types/better-sqlite3

# Renderer
react react-dom zustand tailwindcss @tailwindcss/vite
@types/react @types/react-dom

# Data validation
zod

# Testing
@testing-library/react jsdom
```

---

## 4. Track A: Engine Foundation

**Owner:** realm-engine
**Dependencies:** Prerequisite tasks only
**Produces:** A booting Electron app with SQLite, tick loop, and typed IPC

### Deliverables

| # | File | What It Does |
|---|------|-------------|
| A1 | `src/game/rng/SeededRng.ts` | xoshiro256** PRNG implementing `ISeededRng`. `next()`, `nextInt()`, `nextFloat()`, `nextBool()`, `getState()`/`setState()` for persistence. |
| A2 | `src/game/rng/RngStreamManager.ts` | Creates 6 separate RNG streams (combat, loot, worldEvents, crafting, fishing, offline) from a master seed. Serialize/deserialize all streams. |
| A3 | `src/main/database/connection.ts` | Opens better-sqlite3 with WAL mode, busy timeout, foreign keys. Configures PRAGMA settings. |
| A4 | `src/main/database/schema.ts` | Kysely `Database` type interface for all tables: `save_metadata`, `characters`, `items`, `quest_progress`, `account_data`, `rng_state`, `active_state_machines`, `reset_tracking`, `guild_hall`, `profession_cooldowns`. |
| A5 | `src/main/database/migrations/001_initial.ts` | First migration: creates all tables per the design doc schema. Forward-only (no `down()`). |
| A6 | `src/game/engine/SaveManager.ts` | Create new save (init DB + run migrations), open existing save, backup before write (`.db.bak`), validate with `PRAGMA integrity_check`, platform-specific save paths. |
| A7 | `src/game/engine/GameLoop.ts` | `setInterval`-based 1 Hz tick with drift correction. Cap catch-up at 10 ticks. Pause/resume. Background throttle detection. |
| A8 | `src/main/main.ts` | Electron entry point. `BrowserWindow` with context isolation, no `nodeIntegration`. Register IPC handlers. Initialize GameLoop. Window state persistence. |
| A9 | `src/main/preload.ts` | Context bridge exposing `GameAPI` to renderer via `window.api`. |
| A10 | `src/main/ipc/handlers.ts` | All `ipcMain.handle()` registrations mapping channels to engine methods. Payload validation. |

### Testing

- RNG determinism: same seed produces identical sequences across runs
- RNG streams: independent streams don't affect each other
- SQLite: WAL mode active, integrity check passes, save file at correct platform path
- SaveManager: create → backup → validate round-trip
- GameLoop: ticks fire at 1 Hz (±50ms tolerance), drift correction works
- IPC: main↔renderer typed round-trip
- Migration: fresh DB has all tables with correct schemas

---

## 5. Track B: Combat Math

**Owner:** realm-combat
**Dependencies:** Shared types/constants only (already in `src/shared/`)
**Produces:** ~25 pure functions that pass hand-calculated tests from the design doc

### Deliverables

| # | File | Functions |
|---|------|-----------|
| B1 | `src/game/combat/stats.ts` | `calculatePrimaryStats`, `ratingToPercentage` (with diminishing returns), `calculateMaxHP` (Stamina×10 + classBase), `calculateMaxMana` (Int×15 + classBase), `calculateAttackPower`, `calculateSpellPower`, `calculateArmorMitigation` (armor/(armor+400+85×level)), `aggregateCharacterStats` |
| B2 | `src/game/combat/attackTable.ts` | `buildAttackTable` (bands sum to 100%), `resolvePhysicalAttack` (Miss→Dodge→Parry→Block→Crit→Hit), `resolveSpellAttack` (Miss→Crit→Hit), `calculateMissChance`, `calculateDodgeChance`, `calculateParryChance`, `calculateCritChance`. Handle push-off correctly. |
| B3 | `src/game/combat/damage.ts` | `calculatePhysicalDamage` (weapon + AP×coeff × mods × armor × crit × variance), `calculateSpellDamage`, `calculateDotTick`, `calculateAoeDamage` (3 models: uncapped sqrt, capped flat, chain bounce), `calculateAutoAttackDamage`, `applyVariance` (0.95-1.05) |
| B4 | `src/game/combat/healing.ts` | `calculateDirectHeal`, `calculateHotTick`, `calculateAbsorbShield`, `applyHealing` (returns actual + overheal), `getCritHealMultiplier` (1.5 base, talent-modifiable) |
| B5 | `src/game/combat/threat.ts` | `calculateDamageThreat` (damage × stance × talent × ability), `calculateHealingThreat` (heal × 0.5 / enemyCount), `updateThreatTable`, `getHighestThreatTarget`, `checkAggroTransfer` (melee 110%, ranged 130%) |
| B6 | `src/game/combat/resources.ts` | `generateRage`, `regenerateMana`, `regenerateEnergy`, `generateComboPoints`, `generateSoulShards`, `regenerateFocus`, `accumulateDivineFavor`, `generateMaelstrom`, `generateArcaneCharges`, `spendResource`, `addResource`, `calculateGCD` (max(1.0, 1.5/(1+haste/100))) |

### Testing

Every formula gets a test with hand-calculated values from `02_character_and_combat.md`:

- Armor mitigation: 0→0%, 2750→33.3%, 5500→50%, 11000→66.7% at level 60
- HP: Stamina 100 + base 100 → 1100 HP
- Mana: Int 100 + base 100 → 1600 Mana
- Attack table bands always sum to exactly 100%
- Physical damage with known weapon/AP/coefficient → exact expected value
- Spell coefficients: 1.5s cast→0.428, 2.5s→0.714, 3.5s→1.000
- Crit heal multiplier: 1.5× base
- Miss chance reduces by 1% per 12.5 hit rating
- Dual-wield: +19% miss penalty
- Boss crit suppression: -4.8%
- Distribution test: 10,000 rolls verify actual matches expected ±2%
- All 9 resource types generate/spend correctly
- GCD: 1.5s base, reduced by haste, floored at 1.0s

---

## 6. Track C: Data Schemas + Initial Content

**Owner:** realm-data
**Dependencies:** Shared types/enums + Zod
**Produces:** Validated JSON data files for races, classes, and stat formulas

### Deliverables

| # | File | What It Does |
|---|------|-------------|
| C1 | `src/game/data/schemas/race.schema.ts` | Zod schema validating `RaceDefinition`. Validates stat bonuses, profession bonuses, ASCII icon fields. |
| C2 | `src/game/data/schemas/class.schema.ts` | Zod schema validating `ClassDefinition`. Validates base stats, resource types, armor proficiencies, exactly 3 specs per class. |
| C3 | `src/game/data/schemas/stats.schema.ts` | Zod schema validating `StatFormulas`. Rating conversions, caps, diminishing return thresholds. |
| C4 | `src/game/data/content/races.json` | All 6 races fully populated per design doc: Human (+5% XP), Orc (+5% melee), Elf (+2% crit), Dwarf (+5% armor), Troll (+5% regen), Undead (+5% shadow resist). |
| C5 | `src/game/data/content/classes.json` | All 8 classes fully populated: base stats at level 1, per-level gains, resource types, armor/weapon proficiencies, 3 specs each. |
| C6 | `src/game/data/content/stats.json` | Complete stat formula data: all rating conversions (crit 22:1%, hit 12.5:1%, haste 15:1%, etc.), caps, diminishing return curves. |
| C7 | `src/game/data/loader.ts` | Data loading skeleton: loads JSON files, validates against Zod schemas, returns typed `GameData` partial (races + classes + stats for Phase 1). |
| C8 | `src/game/data/index.ts` | Public API: `loadGameData()`, `getRace()`, `getClass()`, `getStatFormulas()`. |

### Testing

- All JSON files validate against their Zod schemas
- Exactly 6 races with valid stat bonuses
- Exactly 8 classes with exactly 3 specs each
- Class base stats are positive numbers matching design doc
- Rating conversions match design doc exactly (crit=22, hit=12.5, haste=15, etc.)
- Stat caps match: hit 9% vs bosses, spell hit 16%, defense 350 for raids
- Cross-reference: class resource types are valid ResourceType enum values
- Cross-reference: class specs are valid TalentSpec enum values

---

## 7. Track D: UI Renderer Foundation

**Owner:** realm-ui
**Dependencies:** React, Tailwind, Zustand (installed in prerequisites)
**Produces:** A Canvas that renders ASCII at 60 FPS and a Tailwind app shell

### Deliverables

| # | File | What It Does |
|---|------|-------------|
| D1 | `src/renderer/ascii/Palette.ts` | 16-color ANSI palette (8 normal + 8 bright). Maps enum to `[r,g,b]`. Quality tier color mapping (Common→white, Uncommon→green, Rare→blue, Epic→magenta, Legendary→bright yellow). |
| D2 | `src/renderer/ascii/FontLoader.ts` | Loads bitmap font PNG sprite sheet (16×16 grid = 256 glyphs). Extracts `ImageBitmap[]` indexed by CP437 codepoint. Fallback to Canvas `fillText` with monospace font if PNG fails. |
| D3 | `src/renderer/ascii/CharacterGrid.ts` | Grid data structure: `{ char, fg, bg, dirty }` per cell. Methods: `setCell()`, `fill()`, `clear()`, `drawText()`, `getCell()`, `isDirty()`, `clearDirty()`. |
| D4 | `src/renderer/ascii/BoxDrawing.ts` | `drawBorder(grid, x, y, w, h, style)` using Unicode box-drawing chars. Supports single-line, double-line, and heavy styles. Corner/T-junction/crossing resolution. |
| D5 | `src/renderer/ascii/Renderer.ts` | Core 60 FPS render loop via `requestAnimationFrame`. Dirty-cell optimization (skip unchanged cells). Pre-tinted glyph cache keyed by `(glyph, fg)` with LRU eviction at 4096 entries. Resize handling. |
| D6 | `src/renderer/stores/uiStore.ts` | UI-only state: active tab, selected character, open modals, panel sizes, tooltip state. |
| D7 | `src/renderer/stores/settingsStore.ts` | Persisted to localStorage: audio volumes, display preferences, keybindings, panel layout. |
| D8 | `src/renderer/components/AppShell.tsx` | Root layout with Tailwind: frameless title bar (min/max/close), menu bar, panel grid (CSS Grid), dark theme. |
| D9 | `src/renderer/main.tsx` | React entry point. Mounts `<AppShell>`. Wraps with `<TooltipProvider>`. |
| D10 | `src/renderer/index.html` | HTML entry with Canvas element and React mount point. |

### Testing

- Palette: all 16 colors map to correct hex values
- FontLoader: loads 256 glyphs, each 16×16, graceful fallback on load failure
- CharacterGrid: `setCell` marks dirty, fill works, grid dimensions correct
- BoxDrawing: single/double borders produce correct CP437 chars at corners/edges
- Renderer: dirty-cell optimization — unchanged grid produces zero draw calls
- Renderer: full-dirty render completes in <16ms for 120×67 grid
- AppShell: renders title bar, menu bar, content area
- Stores: default state, subscription, selector isolation

---

## 8. Architecture Decisions

### 8.1 electron-vite over bare Vite

electron-vite handles the main/preload/renderer build split natively. It understands Electron's process model and generates correct module formats for each target (CJS for main, ESM for renderer). Using bare Vite would require manual build orchestration.

### 8.2 better-sqlite3 (synchronous) over sql.js (WASM)

better-sqlite3 is synchronous, which matches the engine's 1 Hz tick model (no async gaps during tick processing). It runs natively in Node.js and supports WAL mode for crash recovery. sql.js would add WASM complexity and async overhead.

### 8.3 Split tsconfig per process

Electron main process needs Node.js types but NOT DOM types. Renderer needs DOM types but NOT Node.js `fs`/`path` (context isolation enforced at compile time). Shared code needs neither — it's pure TypeScript. Split configs enforce these boundaries.

### 8.4 Definition types in shared, Zod schemas in data

TypeScript interfaces (`*Definition`) go in `src/shared/` because all domains import them. Zod schemas go in `src/game/data/schemas/` because only the data loader validates against them. This keeps the shared module dependency-free (no Zod import in shared).

### 8.5 No cross-domain integration in Phase 1

Each domain develops against its own test fixtures. Engine doesn't load real JSON data — it uses hardcoded test data. Combat doesn't call engine RNG — tests create `SeededRng` directly. UI doesn't subscribe to real IPC — stores are populated with mock data. Integration is Phase 2.

### 8.6 Pre-tinted glyph cache with LRU, not full matrix

The critique identified that caching all `(glyph, fg, bg)` combinations would consume 256 MB. Solution: cache only `(glyph, fg)` pairs (background is drawn as a filled rect behind the glyph). Use LRU eviction at 4096 entries (~4 MB) instead of pre-computing all combinations.

---

## 9. What Phase 1 Does NOT Include

These are explicitly deferred to Phase 2+:

- Character creation flow (needs engine + UI integration)
- Tick dispatch pipeline with system ordering (needs combat + data integration)
- Offline progression calculation (needs all systems)
- Content state machines (dungeons, raids, quests)
- Ability/talent JSON data files (Phase 1 data covers only races/classes/stats)
- Combat encounter resolution (Phase 1 combat is formulas only, no encounter loop)
- Zustand engine subscription bridge (Phase 1 UI uses mock data)
- Audio (Howler.js integration)
- Particle effects
- Any game panel beyond the AppShell skeleton

---

## 10. Dependency Graph

```
Phase 0 (DONE)
  └─ Prerequisites (3.1-3.4)
       ├─ Track A: Engine Foundation ─────┐
       ├─ Track B: Combat Math ───────────┤
       ├─ Track C: Data Schemas + Content ┤── All independent
       └─ Track D: UI Renderer Foundation ┘
                                          │
                                    Phase 2: Integration
                                    (engine calls combat,
                                     engine loads data,
                                     UI subscribes to engine)
```

All 4 tracks can execute in parallel once prerequisites are done. The only shared surface is `src/shared/` types, which are frozen after the prerequisite tasks.

---

## 11. Verification Criteria

Phase 1 is complete when ALL of the following pass:

1. `npx tsc --noEmit` — 0 errors across all tsconfig files
2. `npx vitest run` — all tests pass (target: ~150+ tests)
3. `npx electron-vite build` — builds main, preload, and renderer without errors
4. Manual: `npx electron-vite dev` boots an Electron window showing the Tailwind AppShell with a Canvas rendering ASCII characters
5. SeededRng determinism: 2 runs with same seed produce bit-identical 10,000-value sequences
6. SaveManager: create save → write → backup → validate → open — round-trip succeeds
7. Combat: every formula test passes with exact expected values from design doc
8. Data: races.json + classes.json + stats.json all validate against Zod schemas
9. Renderer: 120×67 grid full-dirty render < 16ms (60 FPS capable)
