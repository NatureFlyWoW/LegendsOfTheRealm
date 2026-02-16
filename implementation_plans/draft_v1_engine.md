# Engine Implementation Plan -- Draft v1

# ENGINE DOMAIN -- COMPREHENSIVE IMPLEMENTATION PLAN

## Legends of the Shattered Realm: Core Engine Architecture

---

## 1. IMPLEMENTATION PHASES

### Phase 1: Skeleton & Foundation (Estimated: XL)

**Milestone:** An Electron app boots, opens a SQLite database, runs an empty tick loop, saves/loads metadata, and communicates via typed IPC to a blank React renderer.

**Rationale:** Everything depends on this. You cannot build combat, content, UI, or data loading without a running process, a database connection, an IPC bridge, and a tick heartbeat. This phase has zero dependencies on other domains -- it is pure engine scaffolding.

**Deliverables:**
1. Electron main process with context isolation, no `nodeIntegration`, preload script
2. Vite build configuration for main + renderer + preload
3. SQLite connection via better-sqlite3 with WAL mode, managed in main process
4. Kysely schema definitions for all tables from `01_core_engine_architecture.md`
5. Typed IPC bridge (channels, request/response types, preload API surface)
6. Empty `GameLoop` that dispatches ticks at 1 Hz via `setInterval` with drift correction
7. `SaveManager` that creates, opens, backs up, and validates `.db` save files
8. Seeded RNG module with separate streams and state serialization
9. Platform-specific save paths (Windows `%APPDATA%`, macOS `~/Library/...`, Linux `~/.config/...`)
10. Auto-save timer (60s interval) and save-on-close hook
11. Basic window state persistence (position, size, maximized)

**Key decisions resolved in this phase:**
- Tick loop runs in the **main process**, not renderer, to guarantee stability and avoid GC pauses from React rendering
- IPC is the only communication path -- renderer sends commands, main sends state deltas
- Save files are one SQLite `.db` per save slot with unlimited slots

---

### Phase 2: State Management & Entity Lifecycle (Estimated: L)

**Milestone:** Characters can be created, persisted to SQLite, loaded, and their state projected to the renderer via IPC. The `GameState` authoritative store exists and Zustand stores in the renderer are reactive projections.

**Rationale:** Before any game system can operate, we need the entity model in place. Characters, items, quests, and account data must flow through the persistence layer, and the renderer must receive state updates. This phase establishes the single-source-of-truth contract.

**Dependencies on other domains:**
- **Data domain** must provide: race data (`races.json`), class data (`classes.json`), base stat tables -- at minimum stub schemas
- **Shared types** in `src/shared/types.ts` must be agreed upon (Character, Item, QuestProgress, etc.)

**Deliverables:**
1. `GameState` in-memory authoritative state object (loaded from DB on save open)
2. Character CRUD operations (create, read, update, delete) through Kysely
3. Item creation from template IDs (referencing data files)
4. Account-wide data management (`account_data` table)
5. State delta serialization for IPC (engine emits minimal diffs, not full snapshots)
6. State hydration on save load (DB -> GameState -> broadcast to renderer)
7. Entity factory functions consuming data-defined templates

---

### Phase 3: Tick Dispatch & Activity System (Estimated: L)

**Milestone:** Characters assigned to activities (idle, grinding, questing, gathering, crafting) advance each tick. The system update order is enforced. Active play simulation runs at full fidelity, 1 tick per second.

**Rationale:** This is the heart of the engine. Every game system hooks into the tick dispatch pipeline. Without this, combat, loot, progression, and professions have no execution context.

**Dependencies on other domains:**
- **Combat domain** must provide: `simulateEncounter()` function signature (can be a stub that returns fixed results)
- **Data domain** must provide: zone definitions, mob stat tables, XP tables, loot tables (can be minimal stubs for one zone)

**Deliverables:**
1. `TickDispatcher` with ordered system pipeline: `combat -> loot -> progression -> professions -> quests -> meta`
2. `ActivityManager` -- assigns characters to activities, validates transitions
3. Zone grinding simulation (mob kills per tick, XP/gold/loot generation)
4. Questing progress advancement per tick
5. Gathering profession advancement per tick
6. Crafting queue processing per tick
7. Rested XP accumulation system
8. Character activity state machine (idle/grinding/questing/gathering/crafting/dungeon/raid)
9. Tick performance budget enforcement (warn if any tick exceeds 50ms)

**System update ordering (executed each tick):**
```
1. Combat resolution (active encounters)
2. Loot processing (pending loot from combat)
3. Progression (XP gain, level-up checks, stat recalculation)
4. Professions (gathering ticks, craft queue, cooldown decrements)
5. Quests (objective progress from kills/gathers/etc.)
6. Meta (achievement checks, daily/weekly timer decrements)
```

---

### Phase 4: Offline Progression Engine (Estimated: XL)

**Milestone:** Closing and reopening the app after N seconds (up to 7 days) produces correct, deterministic results for all activity types within 500ms. A "Welcome Back" summary is generated.

**Rationale:** This is the defining feature of an idle game and the single hardest engineering challenge in the engine. The design doc specifies efficiency penalties (grinding 80%, questing 75%, dungeons 70%, gathering 85%, crafting 95%, fishing 90%, raids 0%) and the calculation must complete within 500ms for up to 604,800 seconds (7 days). Naive tick-by-tick replay is not feasible.

**Dependencies on other domains:**
- **Combat domain** must provide: `estimateEncounterOutcome()` -- a fast-path statistical estimator for dungeon encounters (not tick-by-tick simulation)
- **Data domain** must provide: XP tables, loot tables with aggregate probability functions

**Deliverables:**
1. `TimeManager.calculateOfflineProgress(characterId, elapsedSeconds, rng): OfflineResult`
2. Analytical (O(1)) calculation for grinding: `kills = floor(elapsed * killRate * penalty)`, then batch XP/gold/loot
3. Analytical calculation for questing: progress = `elapsed * progressRate * penalty`, clamped to objective max
4. Statistical dungeon farming: `attempts = floor(elapsed / clearTime)`, `successes = floor(attempts * successRate)`, batch loot rolls
5. Analytical gathering: `gathers = floor(elapsed * gatherRate * penalty)`, batch material/skillup rolls
6. Crafting queue drain: iterate queue items, consume time, produce results
7. Rested XP accumulation: `restedXP += elapsed * (0.05 * levelXP / 28800)`, capped at 150% of level XP
8. Death estimation during offline grinding (stochastic, using seeded RNG)
9. `WelcomeBackSummary` data structure with itemized gains per character
10. Edge case handling: mid-dungeon close, expired cooldowns, multiple level-ups, bag space overflow
11. Performance benchmark test: 7-day offline calc must complete in <500ms

**The critical performance insight:** We do NOT replay 604,800 ticks. We use analytical formulas for each activity type that compute the aggregate result in O(1) or O(levels_gained) time. Loot is batch-rolled using aggregate probability rather than individual mob rolls. The seeded RNG is advanced deterministically so that the same offline period always produces identical results regardless of when the player returns.

---

### Phase 5: Content State Machines (Estimated: L)

**Milestone:** Dungeon runs, raid attempts, quest chains, and zone activity transitions operate as state machines with proper lifecycle management, lockout tracking, and weekly resets.

**Rationale:** Content flow is where engine orchestration meets game design. The engine must manage dungeon run state (enter -> trash packs -> bosses -> loot -> complete/wipe), raid progression (boss sequence, wipe recovery, weekly lockout), and quest state transitions. This phase makes the game "playable" in the sense that content has structure.

**Dependencies on other domains:**
- **Combat domain** must provide: full `simulateEncounter()` for boss fights with mechanics
- **Data domain** must provide: dungeon definitions (boss sequence, trash pack config, loot tables), raid definitions, quest chain definitions

**Deliverables:**
1. `DungeonRunStateMachine` -- states: `PREPARING -> TRASH_PACK_N -> BOSS_N -> LOOTING -> COMPLETE | WIPED`
2. `RaidProgressionStateMachine` -- states: `SETUP -> ENCOUNTER_N -> WIPE_RECOVERY -> BOSS_LOOT -> NEXT_BOSS -> COMPLETE`
3. `QuestStateMachine` -- states: `AVAILABLE -> ACCEPTED -> IN_PROGRESS -> OBJECTIVES_COMPLETE -> TURNED_IN`
4. `ZoneActivityManager` -- manages what a character is doing in their current zone
5. Dungeon daily lockout tracking (resets at 3:00 AM local)
6. Raid weekly lockout tracking (resets Tuesday 3:00 AM local, per-boss kill tracking)
7. Profession cooldown tracking (daily transmutes, etc.)
8. Daily quest rotation system (5 random dailies per day)
9. Companion quality tracking (clear counts per dungeon/raid, tier thresholds)
10. Loot roll execution against data-defined loot tables using seeded RNG
11. Smart loot distribution (spec-awareness, upgrade prioritization)

---

### Phase 6: Save Versioning & Migration (Estimated: M)

**Milestone:** Save files carry a version string. Opening a save from an older version triggers automatic forward-only migration. Migration chain is tested from every historical version to current.

**Rationale:** This must be in place before any public release. Once players have save files, we can never break backward compatibility. Forward-only migrations using Kysely's migration system.

**Deliverables:**
1. Version string in `save_metadata` table, format: `"major.minor.patch"`
2. Migration registry: ordered list of `{fromVersion, toVersion, migrate(db)}`
3. Automatic migration on load (chain from save version to current)
4. Future version detection and graceful error
5. Migration test harness: creates save at version N, migrates to N+1, validates schema
6. Pre-migration backup (copy `.db` to `.db.premigration.bak`)

---

### Phase 7: Electron Production Hardening (Estimated: M)

**Milestone:** The app behaves like a polished desktop application: tray minimize, graceful shutdown, crash recovery, proper logging, and cross-platform packaging.

**Rationale:** This is the final polish phase before the engine can support real playtesting. All the game logic exists; now we make the container robust.

**Deliverables:**
1. System tray minimize (continue running in background)
2. Graceful shutdown sequence (save -> close DB -> exit)
3. Crash recovery: detect incomplete save on next boot, restore from backup
4. Structured logging (engine events, errors, performance metrics)
5. Window state persistence (position, size, maximized state saved to user preferences)
6. Electron Builder configuration for Windows/macOS/Linux packaging
7. Context Security Policy (CSP) headers
8. Auto-updater hooks (no-op for v1, but wired for future)
9. Performance monitoring: tick duration histogram, memory usage tracking

---

## 2. MODULE BREAKDOWN

All paths relative to `src/`. These are the files the engine domain owns or creates.

### `src/main/` -- Electron Main Process

| File | Responsibility |
|------|---------------|
| `main.ts` | Electron app entry point. Creates `BrowserWindow`, registers IPC handlers, initializes `GameEngine`, manages lifecycle (ready, activate, before-quit, will-quit) |
| `preload.ts` | Context bridge exposing typed IPC API to renderer (`window.api`). No Node.js globals leak. |
| `ipc/channels.ts` | Exhaustive enum of IPC channel names as string constants. Single source of truth for channel naming. |
| `ipc/handlers.ts` | All `ipcMain.handle()` registrations. Maps channel names to engine method calls. Validates payloads. |
| `ipc/types.ts` | TypeScript types for every IPC request and response payload. Shared with renderer via `src/shared/`. |
| `database/connection.ts` | Opens/closes SQLite database via better-sqlite3. Configures WAL mode, busy timeout, PRAGMA settings. |
| `database/schema.ts` | Kysely `Database` type interface mapping all tables and their column types. |
| `database/migrations/` | Directory of versioned migration files. Each exports `up(db)` function. No `down()` -- forward-only. |
| `window.ts` | Window creation, state persistence (bounds, maximized), devtools in dev mode. |
| `tray.ts` | System tray icon, context menu (Show, Save, Quit). Minimize-to-tray behavior. |
| `auto-save.ts` | 60-second interval timer. Calls `SaveManager.save()`. Also triggers on significant events via engine hooks. |
| `logger.ts` | Structured logging (info, warn, error, perf) to file and console. Rotation policy. |

### `src/game/engine/` -- Core Engine Systems

| File | Responsibility |
|------|---------------|
| `GameEngine.ts` | Top-level orchestrator. Owns `GameState`, `GameLoop`, `SaveManager`, `TimeManager`, `ActivityManager`. Entry point for all game operations. |
| `GameLoop.ts` | `setInterval`-based tick dispatch at 1 Hz with drift correction. Calls `TickDispatcher.tick()` each iteration. Pause/resume. Background throttling when minimized. |
| `TickDispatcher.ts` | Ordered pipeline of system updates per tick. Manages registration of system handlers. Enforces tick budget (warn if >50ms). |
| `GameState.ts` | In-memory authoritative game state. All characters, items, quests, account data. Immutable-style updates with change tracking for IPC delta broadcasting. |
| `TimeManager.ts` | Offline time calculation. `calculateOfflineProgress()` with analytical formulas per activity type. `WelcomeBackSummary` generation. |
| `SaveManager.ts` | Create, open, save, backup, validate save files. Corruption detection via `PRAGMA integrity_check`. Manages save file paths per platform. |
| `ActivityManager.ts` | Character-to-activity assignment. Validates transitions (e.g., cannot enter dungeon while in raid). State machine per character. |
| `MigrationRunner.ts` | Loads migration registry, determines required migrations, applies in order. Pre-migration backup. |
| `EventBus.ts` | Typed publish/subscribe event system for decoupled communication between engine subsystems. Events like `CHARACTER_LEVELED`, `ITEM_ACQUIRED`, `BOSS_KILLED`, `QUEST_COMPLETED`. |

### `src/game/rng/` -- Seeded Random Number Generation

| File | Responsibility |
|------|---------------|
| `SeededRng.ts` | Core PRNG implementation (xoshiro256** or similar). `next()`, `nextFloat()`, `nextInt(min, max)`, `nextBool(probability)`. Seed state get/set for persistence. |
| `RngStreamManager.ts` | Creates and manages separate RNG streams per domain: `combat`, `loot`, `worldEvents`, `crafting`, `fishing`, `offline`. Each stream has independent state. Persisted in save file. |
| `RngTypes.ts` | Types for RNG state, stream identifiers, serialized format. |

### `src/game/systems/` -- Game System Tick Handlers

| File | Responsibility |
|------|---------------|
| `GrindingSystem.ts` | Per-tick grinding simulation. Mob kills, XP, gold, loot rolls against zone loot tables. Death chance. |
| `QuestSystem.ts` | Per-tick quest objective progress. Kill-based, gather-based, exploration-based objectives. Completion detection. |
| `LootSystem.ts` | Loot roll execution. Consumes loot table JSON from data domain. Quality tier determination. Item creation from templates. Inventory placement with bag space checks. Smart loot (spec awareness). |
| `ProgressionSystem.ts` | XP accumulation, level-up detection, stat recalculation on level. Rest XP consumption. XP modifier stacking (human racial, heirlooms, guild hall). |
| `ProfessionSystem.ts` | Gathering tick processing, crafting queue drain, skillup rolls, daily cooldown tracking. |
| `ResetSystem.ts` | Daily reset (3:00 AM local): dungeon lockouts, daily quests. Weekly reset (Tuesday 3:00 AM): raid lockouts, weekly quests. Profession cooldown resets. |
| `AchievementSystem.ts` | Listens to EventBus events. Checks achievement criteria. Awards titles, mounts, gold, points. Tracks progress counters. |
| `CompanionSystem.ts` | Tracks dungeon/raid clear counts per character per content. Determines companion quality tier (Recruit/Veteran/Elite/Champion). |
| `AuctionHouseSystem.ts` | Simulated AH: NPC listing generation, price fluctuation, bid/buyout resolution, listing expiry. |

### `src/game/state-machines/` -- Content State Machines

| File | Responsibility |
|------|---------------|
| `DungeonRunSM.ts` | Finite state machine for a dungeon run. States: Preparing, TrashPack(n), Boss(n), Looting, Complete, Wiped. Transitions driven by combat results. |
| `RaidProgressionSM.ts` | State machine for raid attempt. Boss sequence, wipe/reset, loot phase per boss, lockout application on kill. |
| `QuestChainSM.ts` | State machine for quest chain progression. Pre-reqs, accept, in-progress, turn-in, rewards. |
| `StateMachineBase.ts` | Generic FSM base class with state/transition/guard pattern. Serializable state for save persistence. |

### `src/shared/` -- Shared Types (Co-owned with all domains)

| File | Responsibility |
|------|---------------|
| `types.ts` | Core entity interfaces: `Character`, `Item`, `Quest`, `Zone`, `Dungeon`, `Raid`, `Ability`, `Companion`, `AccountData` |
| `constants.ts` | Game-wide constants: tick rate, max level, bag slot count, quality tier names, gear slot enum, etc. |
| `utils.ts` | Pure utility functions: clamp, lerp, formatGold, formatDuration |
| `events.ts` | Typed event definitions for `EventBus`. Discriminated union of all game events. |
| `ipc-api.ts` | The typed IPC API surface exposed via preload. Shared between main and renderer for type safety. |

---

## 3. KEY TECHNICAL DECISIONS

### 3.1 SQLite Schema

The schema from `01_core_engine_architecture.md` is the starting point, with these refinements:

**Additional tables needed:**

```sql
-- RNG state persistence
CREATE TABLE rng_state (
    stream_name TEXT PRIMARY KEY,  -- 'combat', 'loot', 'worldEvents', etc.
    state_s0 INTEGER NOT NULL,     -- xoshiro256** state words
    state_s1 INTEGER NOT NULL,
    state_s2 INTEGER NOT NULL,
    state_s3 INTEGER NOT NULL
);

-- Active content state machines (serialized)
CREATE TABLE active_state_machines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    machine_type TEXT NOT NULL,     -- 'dungeon_run', 'raid_attempt', 'quest_chain'
    machine_id TEXT NOT NULL,       -- content ID (dungeon/raid/quest ID)
    current_state TEXT NOT NULL,    -- serialized FSM state
    context_data TEXT NOT NULL,     -- JSON: intermediate results, encounter history
    started_at INTEGER NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);

-- Daily/weekly reset tracking
CREATE TABLE reset_tracking (
    id INTEGER PRIMARY KEY,
    last_daily_reset INTEGER,      -- Unix timestamp
    last_weekly_reset INTEGER,
    daily_quest_seed INTEGER       -- RNG seed for today's daily quest selection
);

-- Guild hall state
CREATE TABLE guild_hall (
    id INTEGER PRIMARY KEY,
    level INTEGER DEFAULT 1,
    barracks_level INTEGER DEFAULT 0,
    bank_level INTEGER DEFAULT 0,
    upgrades TEXT,                  -- JSON: completed upgrades
    upgrade_in_progress TEXT,      -- JSON: {upgradeId, startedAt, completesAt}
    total_gold_invested INTEGER DEFAULT 0
);

-- Profession cooldowns
CREATE TABLE profession_cooldowns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER NOT NULL,
    cooldown_type TEXT NOT NULL,    -- 'arcanite_transmute', 'mooncloth', etc.
    expires_at INTEGER NOT NULL,
    FOREIGN KEY (character_id) REFERENCES characters(id)
);
```

**Schema design choices:**
- JSON columns (`TEXT` storing JSON) for flexible nested data (talent points, companion clears, achievement progress) rather than over-normalized tables. This keeps the schema manageable and save file size small.
- Foreign keys enabled (`PRAGMA foreign_keys = ON`) for referential integrity.
- WAL mode for concurrent read during async operations.
- Integer timestamps (Unix epoch seconds) everywhere -- no Date strings.

### 3.2 Tick Loop Architecture

```typescript
// GameLoop.ts -- simplified core
class GameLoop {
    private intervalId: NodeJS.Timeout | null = null;
    private lastTickTime: number = 0;
    private readonly TICK_INTERVAL_MS = 1000;

    start(): void {
        this.lastTickTime = Date.now();
        this.intervalId = setInterval(() => {
            const now = Date.now();
            const elapsed = now - this.lastTickTime;

            // Drift correction: if we're significantly behind, catch up
            const ticksToProcess = Math.min(
                Math.floor(elapsed / this.TICK_INTERVAL_MS),
                10  // Cap catch-up to prevent freeze
            );

            for (let i = 0; i < ticksToProcess; i++) {
                this.dispatcher.tick(this.gameState, this.rngManager);
            }

            this.lastTickTime = now;
        }, this.TICK_INTERVAL_MS);
    }
}
```

**Key design points:**
- Runs in main process, not renderer. This prevents UI rendering (React reconciliation, canvas draw) from starving the tick loop.
- Drift correction caps at 10 ticks to prevent freeze frames. If the app was backgrounded for longer, the offline calculation system handles it.
- The tick dispatcher is synchronous within a single tick -- all systems process in order for the same game-time instant.
- Background throttling: when window is minimized/hidden, tick rate can be reduced to 0.25 Hz to save CPU (accumulating ticks for batch processing).

### 3.3 Save Versioning

```typescript
interface Migration {
    version: string;           // Target version after this migration
    description: string;       // Human-readable
    migrate: (db: Kysely<any>) => Promise<void>;
}

const MIGRATIONS: Migration[] = [
    {
        version: "0.1.0",
        description: "Initial schema",
        migrate: async (db) => { /* CREATE TABLE statements */ }
    },
    {
        version: "0.2.0",
        description: "Add profession cooldowns table",
        migrate: async (db) => {
            await db.schema.createTable("profession_cooldowns")
                .addColumn("id", "integer", (col) => col.primaryKey().autoIncrement())
                // ...
                .execute();
        }
    },
];
```

**Rules:**
- Migrations are forward-only. No `down()` functions.
- The save file version is compared to the app version. If save > app, show error ("This save was created with a newer version").
- Before any migration, the entire `.db` file is copied to `.db.premigration.bak`.
- After migration, `PRAGMA integrity_check` runs.
- Migration tests create a save at each historical version and verify the full chain to current.

### 3.4 Offline Calculation Strategy

The 500ms budget for 7 days of elapsed time demands analytical formulas, not tick replay.

**For grinding (the most common activity):**
```typescript
function calculateOfflineGrinding(
    char: Character, zone: ZoneData, elapsedSec: number, rng: SeededRng
): GrindResult {
    const IDLE_PENALTY = 0.80;
    const killRatePerSec = 1 / 30;  // 1 mob per 30s base
    const effectiveRate = killRatePerSec * IDLE_PENALTY;

    // Deaths reduce effective time
    const deathTimeLoss = estimateDeathTimeLoss(char, zone, elapsedSec, rng);
    const effectiveTime = elapsedSec - deathTimeLoss;

    const totalKills = Math.floor(effectiveTime * effectiveRate);

    // XP with level-up handling (iterative, O(levels_gained))
    let remainingKills = totalKills;
    let currentLevel = char.level;
    let currentXP = char.xp;
    const xpPerMob = calculateMobXP(zone.levelRange.max, currentLevel);

    while (remainingKills > 0 && currentLevel < MAX_LEVEL) {
        const xpNeeded = xpToNextLevel(currentLevel) - currentXP;
        const killsForLevel = Math.ceil(xpNeeded / (xpPerMob * getXPModifiers(char)));
        if (killsForLevel <= remainingKills) {
            currentLevel++;
            currentXP = 0;
            remainingKills -= killsForLevel;
        } else {
            currentXP += remainingKills * xpPerMob * getXPModifiers(char);
            remainingKills = 0;
        }
    }

    // Gold: batch calculation
    const goldPerMob = zone.levelRange.max * rng.nextFloat(0.4, 0.8);
    const totalGold = Math.floor(totalKills * goldPerMob);

    // Loot: aggregate probability, not per-mob rolls
    const items = batchRollLoot(totalKills, zone.lootTable, rng);

    return { kills: totalKills, xpGained, levelsGained, gold: totalGold, items, deaths };
}
```

**For dungeon farming:**
```typescript
function calculateOfflineDungeons(
    char: Character, dungeon: DungeonData, elapsedSec: number, rng: SeededRng
): DungeonFarmResult {
    const IDLE_PENALTY = 0.70;
    const companionQuality = getCompanionQuality(char, dungeon.id);
    const successRate = estimateSuccessRate(char, companionQuality, dungeon);
    const clearTime = dungeon.averageClearTime / IDLE_PENALTY;

    const attempts = Math.floor(elapsedSec / clearTime);
    let successes = 0;
    for (let i = 0; i < attempts; i++) {
        if (rng.nextBool(successRate)) successes++;
    }

    const loot = [];
    for (let i = 0; i < successes; i++) {
        loot.push(...rollDungeonLoot(dungeon, rng));
    }

    return { attempts, successes, failures: attempts - successes, loot, xp, gold };
}
```

**Performance analysis:** For 7 days of grinding at 1 kill/30s = 20,160 kills. The batch loot rolling (the most expensive operation) can use probability aggregation: instead of rolling 20,160 times against a loot table, we calculate `expected_drops = kills * dropRate` for each item and then add variance using the RNG. For dungeons, max attempts in 7 days = 604,800 / 1800 (30 min clears) = 336 attempts -- trivially fast even with individual rolls.

### 3.5 Electron IPC Architecture

```typescript
// src/shared/ipc-api.ts
export interface GameAPI {
    // Save management
    save: {
        create(name: string): Promise<SaveMetadata>;
        list(): Promise<SaveMetadata[]>;
        open(saveId: number): Promise<GameStateSnapshot>;
        save(): Promise<void>;
        delete(saveId: number): Promise<void>;
    };

    // Character operations
    character: {
        create(params: CharacterCreateParams): Promise<Character>;
        get(id: number): Promise<Character>;
        list(): Promise<CharacterSummary[]>;
        setActivity(charId: number, activity: ActivityAssignment): Promise<void>;
        equipItem(charId: number, itemId: number, slot: GearSlot): Promise<EquipResult>;
        setTalents(charId: number, spec: TalentSpec, points: TalentPointMap): Promise<void>;
    };

    // Content
    dungeon: {
        start(charId: number, dungeonId: string): Promise<DungeonRunState>;
        getState(runId: number): Promise<DungeonRunState>;
    };

    raid: {
        start(charId: number, raidId: string): Promise<RaidAttemptState>;
        getState(attemptId: number): Promise<RaidAttemptState>;
    };

    quest: {
        accept(charId: number, questId: string): Promise<QuestState>;
        turnIn(charId: number, questId: string): Promise<QuestRewards>;
    };

    // State subscriptions (renderer subscribes to engine state)
    onStateUpdate(callback: (delta: GameStateDelta) => void): () => void;
    onWelcomeBack(callback: (summary: WelcomeBackSummary) => void): () => void;
    onAchievement(callback: (achievement: AchievementUnlock) => void): () => void;
}
```

**Design principle:** The renderer NEVER directly mutates game state. It sends commands (`setActivity`, `equipItem`, `startDungeon`) and receives state deltas. Zustand stores in the renderer are projections that apply deltas to their local copy.

### 3.6 Seeded RNG System

```typescript
// Xoshiro256** implementation
class SeededRng {
    private state: [bigint, bigint, bigint, bigint];

    constructor(seed: bigint) {
        // Initialize state from seed using SplitMix64
        this.state = initializeFromSeed(seed);
    }

    next(): number {
        // Returns float in [0, 1)
        const result = rotl(this.state[1] * 5n, 7n) * 9n;
        // ... state advancement
        return Number(result & 0xFFFFFFFn) / 0x10000000;
    }

    nextInt(min: number, max: number): number {
        return min + Math.floor(this.next() * (max - min + 1));
    }

    nextBool(probability: number): boolean {
        return this.next() < probability;
    }

    getState(): RngState { return [...this.state]; }
    setState(s: RngState): void { this.state = [...s]; }
}

// Stream manager
class RngStreamManager {
    private streams: Map<string, SeededRng> = new Map();

    constructor(masterSeed: bigint) {
        const seedGen = new SeededRng(masterSeed);
        for (const domain of ['combat', 'loot', 'worldEvents', 'crafting', 'fishing', 'offline']) {
            this.streams.set(domain, new SeededRng(BigInt(seedGen.nextInt(0, Number.MAX_SAFE_INTEGER))));
        }
    }

    get(domain: string): SeededRng {
        const stream = this.streams.get(domain);
        if (!stream) throw new Error(`Unknown RNG domain: ${domain}`);
        return stream;
    }

    serialize(): Record<string, RngState> { /* ... */ }
    deserialize(data: Record<string, RngState>): void { /* ... */ }
}
```

**Why separate streams:** If combat consumed RNG values that affected loot rolls, then the number of combat events would change loot outcomes. Separate streams ensure that loot is deterministic given the loot stream state, regardless of what combat did.

---

## 4. CROSS-DOMAIN INTERFACES

### 4.1 Engine -> Combat Interface

The engine calls into combat for encounter resolution. Combat is a pure function library.

```typescript
// What engine provides to combat
interface EncounterRequest {
    party: PartyComposition;          // Player char + companions
    enemies: EnemyGroup;              // Mob pack or boss encounter
    encounterDef: EncounterDefinition; // Boss mechanics, enrage, phases
    rng: SeededRng;                    // Combat RNG stream
    maxTicks: number;                  // Enrage timer / time limit
}

interface PartyComposition {
    members: CombatEntity[];          // Stats, abilities, gear, talent effects
    composition: { tanks: number; healers: number; dps: number };
}

interface CombatEntity {
    id: number;
    name: string;
    role: 'tank' | 'healer' | 'dps';
    isPlayer: boolean;
    isCompanion: boolean;
    companionQuality: CompanionTier;
    effectiveStats: EffectiveStats;    // All stats after gear+talents+buffs
    abilities: AbilityLoadout;         // Priority-ordered ability list
    resources: ResourceState;          // HP, mana/rage/energy, etc.
}

// What combat returns to engine
interface EncounterResult {
    outcome: 'victory' | 'wipe' | 'enrage_wipe';
    durationTicks: number;
    memberResults: MemberResult[];     // Per-member damage/healing/deaths
    lootEligible: boolean;
    combatLog: CombatLogEntry[];       // For UI display
}

interface MemberResult {
    entityId: number;
    damageDealt: number;
    healingDone: number;
    threatGenerated: number;
    damageTaken: number;
    deaths: number;
    survived: boolean;
}
```

**Engine calls:**
```typescript
// Active play: tick-by-tick
combatSystem.simulateEncounterTick(encounter: ActiveEncounter, rng: SeededRng): TickResult;

// Idle/offline: full encounter at once
combatSystem.simulateEncounter(request: EncounterRequest): EncounterResult;

// Offline fast-path: statistical estimate (no tick simulation)
combatSystem.estimateEncounterOutcome(party: PartyComposition, content: ContentDifficulty): {
    successRate: number;
    averageDuration: number;
    expectedDeaths: number;
};
```

### 4.2 Engine -> UI Interface (via IPC)

The engine exposes state and accepts commands. The renderer never mutates state directly.

```typescript
// State delta pushed to renderer each tick (or batched)
interface GameStateDelta {
    timestamp: number;
    characterUpdates?: Map<number, Partial<CharacterState>>;
    inventoryUpdates?: Map<number, InventoryDelta>;
    questUpdates?: Map<number, QuestProgressDelta>;
    accountUpdates?: Partial<AccountData>;
    combatLogEntries?: CombatLogEntry[];
    notifications?: GameNotification[];  // Level up, achievement, rare drop, etc.
}

// Commands renderer sends to engine
type EngineCommand =
    | { type: 'CREATE_CHARACTER'; params: CharacterCreateParams }
    | { type: 'SET_ACTIVITY'; charId: number; activity: ActivityAssignment }
    | { type: 'EQUIP_ITEM'; charId: number; itemId: number; slot: GearSlot }
    | { type: 'UNEQUIP_ITEM'; charId: number; slot: GearSlot }
    | { type: 'SET_TALENTS'; charId: number; spec: string; points: Record<string, number> }
    | { type: 'START_DUNGEON'; charId: number; dungeonId: string }
    | { type: 'START_RAID'; charId: number; raidId: string }
    | { type: 'ACCEPT_QUEST'; charId: number; questId: string }
    | { type: 'TURN_IN_QUEST'; charId: number; questId: string }
    | { type: 'SELL_ITEM'; charId: number; itemId: number }
    | { type: 'CRAFT_ITEM'; charId: number; recipeId: string; quantity: number }
    | { type: 'BUY_AUCTION'; auctionId: number }
    | { type: 'LIST_AUCTION'; itemId: number; buyout: number }
    | { type: 'UPGRADE_GUILD_HALL'; upgradeId: string };

// Welcome back summary (shown on app open after idle time)
interface WelcomeBackSummary {
    offlineSeconds: number;
    formattedDuration: string;  // "8 hours, 23 minutes"
    perCharacter: {
        characterId: number;
        characterName: string;
        activity: string;
        xpGained: number;
        levelsGained: number;
        goldEarned: number;
        itemsAcquired: ItemSummary[];
        killCount?: number;
        questsCompleted?: string[];
        dungeonClears?: number;
        professionSkillups?: { profession: string; gained: number }[];
        deaths?: number;
    }[];
    restedXPAccumulated: Map<number, number>;  // charId -> rested XP gained
    expiredLockouts: string[];                  // "Molten Sanctum weekly lockout expired"
    cooldownsReady: string[];                   // "Arcanite Transmute ready"
}
```

### 4.3 Engine -> Data Interface

The engine consumes data files defined by the Data domain. These are the schemas the engine expects.

```typescript
// Engine expects these data files to exist and conform to these shapes:
interface ZoneData {
    id: string;
    name: string;
    levelRange: { min: number; max: number };
    mobTypes: MobTemplate[];
    lootTable: LootTableRef;
    gatheringNodes?: GatheringNodeDef[];
    quests: string[];  // Quest IDs
}

interface DungeonData {
    id: string;
    name: string;
    levelRange: { min: number; max: number };
    scaledLevel: number;
    trashPacks: TrashPackDef[];
    bosses: BossEncounterDef[];
    averageClearTime: number;  // seconds
    dailyLockout: boolean;
    companionThresholds: { veteran: 1; elite: 10; champion: 25 };
}

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

interface XPTable {
    xpRequired: number[];  // Index = level, value = XP to reach level+1
}

interface MobTemplate {
    id: string;
    name: string;
    level: number;
    hp: number;
    stats: MobStats;
    abilities: string[];
    lootTableId: string;
    xpReward: number;
    goldMin: number;
    goldMax: number;
}
```

---

## 5. DEPENDENCIES ON OTHER DOMAINS

### Phase 1 (Skeleton): **No dependencies.** Pure engine scaffolding.

### Phase 2 (State Management):
- **Data domain:** Stub JSON files for races, classes, base stat tables. Minimum: `races.json` with 6 entries, `classes.json` with 8 entries and base stats.
- **All domains:** Agreement on shared types in `src/shared/types.ts`. This is the first cross-domain synchronization point.

### Phase 3 (Tick Dispatch):
- **Combat domain:** `simulateEncounterTick()` function signature. Can return hardcoded results initially.
- **Data domain:** One complete zone definition (Greenhollow Vale) with mob templates, loot table, XP table. Quest chain data for that zone.

### Phase 4 (Offline Progression):
- **Combat domain:** `estimateEncounterOutcome()` for fast-path dungeon success rate estimation during offline calc.
- **Data domain:** All zone data, dungeon data, XP curve, loot tables needed for offline simulation testing.

### Phase 5 (Content State Machines):
- **Combat domain:** Full `simulateEncounter()` with boss mechanics for at least Deadhollow Crypt (first dungeon).
- **Data domain:** Complete dungeon definitions (boss sequences, loot tables), raid definitions (at least Tier 1), quest chain definitions for all 12 zones.

### Phase 6 (Save Versioning): **No external dependencies.** Internal engine concern.

### Phase 7 (Electron Hardening): 
- **UI domain:** Renderer process must exist and handle IPC messages. At minimum a React shell that displays received state.

---

## 6. RISK ASSESSMENT

### Risk 1: Offline Calculation Performance (HIGH)

**The problem:** 7 days of elapsed time must resolve in <500ms. The design calls for per-character simulation with multiple activity types, each generating items, XP, gold, and profession progress.

**What could go wrong:** Loot table batch-rolling might be slower than expected if tables are large. Multiple characters (the design supports 20+ characters) each needing offline calc could compound. Level-up cascades (a character gaining 10 levels offline) require stat recalculation per level.

**Mitigation:** 
- Batch loot rolling uses aggregate probability, not per-kill rolls
- Characters are processed independently and could be parallelized with Workers if needed
- Level-up cascade is O(levels_gained), which is at most 59 levels -- trivially fast
- Performance benchmark test gates this: if it ever exceeds 500ms, the build fails

### Risk 2: Seeded RNG Determinism Across Offline/Online (HIGH)

**The problem:** The same character doing the same activity for the same duration must produce identical results whether simulated offline (analytical) or played online (tick-by-tick). But the analytical path consumes different numbers of RNG values than tick-by-tick.

**What could go wrong:** If online play consumes N RNG values per mob kill and offline uses M values per batch, the RNG streams diverge, making saves non-deterministic.

**Mitigation:** 
- Offline simulation uses a **separate RNG stream** (`offline` stream) distinct from the `combat` and `loot` streams used during active play
- This means offline and online results are NOT expected to be identical -- they are deterministic *within their own mode*
- The contract is: same offline duration + same starting RNG state = identical offline results. Active play is independently deterministic.
- This is an explicit design decision that must be documented and agreed upon by all domains.

### Risk 3: SQLite Corruption on Crash (MEDIUM)

**The problem:** If the app crashes mid-save, the SQLite file could be corrupted.

**What could go wrong:** Power failure during `PRAGMA wal_checkpoint`, OS-level write failure, Electron crash during save.

**Mitigation:**
- WAL mode provides crash recovery natively (SQLite's strongest guarantee)
- Backup-before-write: copy `.db` to `.db.bak` before every save
- `PRAGMA integrity_check` on every load
- If integrity check fails, attempt recovery from `.bak`
- Auto-save every 60s limits maximum data loss to 60s of play

### Risk 4: IPC Bottleneck (MEDIUM)

**The problem:** Engine runs in main process, UI in renderer. Every tick's state delta crosses the IPC bridge.

**What could go wrong:** With 20+ characters each updating per tick, the state delta could be large. Serialization overhead could cause UI lag.

**Mitigation:**
- Delta-based updates, not full state snapshots (only changed fields are sent)
- Tick-based batching: accumulate changes, send one delta per tick (1 Hz)
- For combat log entries during active encounters: batch and send at most 10 entries per tick
- If IPC becomes a bottleneck, consider SharedArrayBuffer for numeric state (stats, HP, XP)

### Risk 5: State Machine Complexity (MEDIUM)

**The problem:** Dungeon runs, raid attempts, and quest chains each need robust FSMs with many states and transitions. Saving/loading mid-content is tricky.

**What could go wrong:** A character closes the app mid-dungeon. On reload, the dungeon state must be correctly restored or gracefully abandoned.

**Mitigation:**
- FSM state is fully serializable (saved to `active_state_machines` table)
- On app close during active content: save FSM state. On reload: offer to resume or abandon.
- For offline: if a character was mid-dungeon when going offline, the dungeon run is abandoned and the character returns to the zone. No partial dungeon credit.

### Risk 6: Memory Budget (LOW-MEDIUM)

**The problem:** 300MB limit with potentially 20+ characters, each with full inventory (80 item slots), quest log, profession data, plus all loaded data files.

**What could go wrong:** Caching too aggressively, keeping full combat logs in memory, loading all zone data at once.

**Mitigation:**
- Only active character's full state in memory; inactive characters stored as summary
- Combat log ring buffer (last 500 entries)
- Data files loaded on demand per zone, not all at once
- Memory usage tracked per tick; log warning at 250MB

---

## 7. TESTING STRATEGY

### Phase 1 Tests
- **Unit:** SQLite connection opens/closes, WAL mode enabled, save file creation at correct platform path, RNG produces deterministic sequences from same seed, IPC channel type validation
- **Integration:** Electron app boots, preload exposes API, main <-> renderer round-trip IPC
- **Benchmark:** App startup time <3s

### Phase 2 Tests
- **Unit:** Character creation populates all fields, Kysely queries return typed results, GameState delta tracking detects changes
- **Snapshot:** Create character -> save -> load -> verify all fields match
- **Integration:** Create character via IPC from renderer, verify state broadcast back

### Phase 3 Tests
- **Unit:** Each system handler (grinding, questing, gathering, crafting) processes one tick correctly with known inputs
- **Integration:** Full tick pipeline with all systems registered, verify ordering via side-effect tracking
- **Benchmark:** Single tick completes in <50ms with 20 characters
- **Determinism:** Same tick sequence with same RNG seed produces identical results

### Phase 4 Tests
- **Unit:** `calculateOfflineGrinding()` with known inputs -> hand-calculated outputs. Test edge cases: 0 seconds, 1 second, exactly 7 days, character at max level, empty inventory
- **Integration:** Full offline calc for 20 characters doing various activities, verify all results
- **Benchmark:** 7-day offline calc for 20 characters completes in <500ms
- **Determinism:** Same offline period, same RNG state -> identical results on repeated runs
- **Edge cases:** Mid-dungeon offline, level-up during offline, bag space overflow, multiple daily resets during offline period

### Phase 5 Tests
- **State machine:** Every state transition in `DungeonRunSM` tested. Invalid transitions rejected. Serialization/deserialization round-trip.
- **Integration:** Full dungeon run: enter -> trash -> bosses -> loot -> complete. Full raid: sequence of encounters.
- **Lockout:** Daily lockout prevents re-entry. Weekly lockout tracks per-boss kills. Reset clears lockouts.
- **Companion:** Clear count increments correctly. Tier thresholds trigger quality upgrades.

### Phase 6 Tests
- **Migration chain:** Create save at v0.1.0, migrate through every version to current, verify schema and data integrity at each step.
- **Future version:** Attempt to load save with version > current, verify graceful error.
- **Backup:** Verify `.premigration.bak` file exists after migration.

### Phase 7 Tests
- **Electron:** Tray minimize works, window state persists across restarts, graceful shutdown saves before exit
- **Crash recovery:** Kill process mid-save, reboot, verify backup restore
- **Cross-platform:** Build and basic smoke test on Windows, macOS, Linux

---

## 8. ESTIMATED COMPLEXITY

| Phase | Complexity | Estimated Effort | Justification |
|-------|-----------|------------------|---------------|
| Phase 1: Skeleton & Foundation | XL | 3-4 weeks | Electron+Vite+SQLite+Kysely+IPC+RNG -- many moving parts, first-time integration, build tooling |
| Phase 2: State Management | L | 2-3 weeks | Entity model, persistence layer, IPC state broadcasting, shared type negotiation |
| Phase 3: Tick Dispatch | L | 2-3 weeks | Activity system, system pipeline, per-system handlers, performance tuning |
| Phase 4: Offline Progression | XL | 3-4 weeks | Hardest algorithmic challenge. Analytical formulas, batch loot, edge cases, 500ms budget, determinism |
| Phase 5: Content State Machines | L | 2-3 weeks | Multiple FSMs, dungeon/raid/quest flows, lockout systems, companion tracking |
| Phase 6: Save Versioning | M | 1-2 weeks | Migration framework, test harness, relatively straightforward |
| Phase 7: Electron Hardening | M | 1-2 weeks | Polish, packaging, crash recovery, logging |

**Total engine domain estimate: 14-21 weeks**

---

## APPENDIX: Anticipated Cross-Domain Debate Points

**For Combat experts who will challenge this plan:**

1. "Where does encounter orchestration end and encounter resolution begin?" -- The engine owns the *flow* (which trash pack, which boss, what happens after wipe). Combat owns the *math* (tick-by-tick damage, healing, threat, ability execution). The boundary is the `simulateEncounter()` interface.

2. "The `estimateEncounterOutcome()` fast-path for offline is too imprecise." -- It must be imprecise by design. We cannot tick-simulate 336 dungeon runs in 500ms. The statistical estimate (success rate, average duration) is sufficient for offline because the design doc already applies a 30% efficiency penalty to idle dungeon farming.

3. "Who owns stat calculation?" -- Combat owns `calculateEffectiveStats()` (gear + talents + buffs -> final numbers). Engine owns calling it at the right time (on equip, on level, on buff change) and persisting the result.

**For Data experts who will challenge this plan:**

1. "JSON data files vs SQLite tables for game data?" -- Static game data (zones, mobs, items, abilities) lives in JSON files loaded at runtime. Dynamic player data (inventory, quest progress, stats) lives in SQLite. The boundary is: if it changes during play, it is in SQLite. If it is the same for every player, it is in JSON.

2. "Who validates data file schemas?" -- Data domain owns schema definitions and validation. Engine consumes data and will throw typed errors if data does not match expected interfaces. The engine should NOT silently handle malformed data.

3. "Loot table format?" -- Engine needs: `{itemTemplateId, dropRate, minQty, maxQty}[]`. Data domain defines the full item template. Engine only needs the template ID and creates item instances from it.

**For UI experts who will challenge this plan:**

1. "Delta-based IPC is too complex. Just send full state." -- Full state for 20 characters with inventories would be ~200KB per tick (1 Hz). That is 200KB/s of serialized JSON crossing IPC. Deltas keep it to <5KB per tick in typical operation.

2. "Zustand stores need to be able to dispatch actions." -- Zustand stores dispatch *commands* to the engine via IPC, not state mutations. The engine processes the command, updates authoritative state, and broadcasts the delta. The Zustand store applies the delta. This is non-negotiable for save integrity.

3. "Combat log display needs real-time entries, not tick-batched." -- During active encounters, the engine can increase IPC frequency to 4 Hz for combat log entries specifically. The rest of state still updates at 1 Hz. This is a renderer-side optimization, not an engine architecture change.

---

### Critical Files for Implementation
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/engine/GameEngine.ts` - Top-level orchestrator that owns GameState, tick loop, save management, and activity coordination. Everything flows through this file.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/engine/TimeManager.ts` - Offline progression calculation with analytical formulas. The single hardest algorithmic problem in the engine (500ms budget for 7 days).
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/game/rng/SeededRng.ts` - Deterministic PRNG with state serialization. Every game system depends on this for reproducible outcomes. Zero Math.random() calls.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/main/main.ts` - Electron main process entry point. Database connection, IPC handler registration, window management, auto-save scheduling, lifecycle management.
- `/mnt/c/Users/Caus/Desktop/LegendsOfTheRealm/src/shared/ipc-api.ts` - Typed IPC API surface shared between main and renderer. Defines the complete contract between engine and UI. Every command and state delta shape.