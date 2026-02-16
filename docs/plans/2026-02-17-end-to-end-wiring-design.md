# End-to-End Wiring Design — First Playable Prototype

**Date:** 2026-02-17
**Goal:** Wire all Phase 2 systems together so the game boots, runs, and is playable as a complete idle loop with save/load and equip.

## Context

Phase 2 "First Blood" built all individual systems in isolation:
- Combat engine (EncounterRunner, AbilitySystem, CombatFactory, attack tables, damage formulas)
- Activity management (zone grinding loop with mob selection, encounter delegation, XP/loot/quest rewards)
- Game services (CharacterService, InventoryService, ProgressionService, LootService, QuestTracker)
- Game orchestration (GameManager, GameLoop, GameBridge, EventBus, OfflineCalculator)
- Data layer (10 JSON content files with Zod schemas — zones, mobs, abilities, items, quests, loot tables, classes, races, XP curves, stats)
- UI components (AppShell, CharacterCreate, CharacterSheet, CombatLog, ZoneView)
- IPC infrastructure (preload, handlers, gamebridge)
- Database (SQLite + Kysely, migrations, SaveManager)

All tested in isolation (908 tests). But `main.ts` is a bare Electron shell — no engine boots, no IPC connects, the renderer never receives game state.

## Approach: Bottom-Up Wiring

Wire from deepest layer outward. Each layer is solid before the next depends on it.

## Section 1: IPC Contract Reconciliation

**Problem:** Two incompatible `EngineCommand` types exist — uppercase in `ipc-api.ts`, lowercase in `GameManager.ts`. The aspirational `GameAPI` interface in `ipc-api.ts` defines 19 commands and dungeon/raid/auction/crafting APIs that don't exist.

**Solution:**
- Strip `ipc-api.ts` to only what Phase 2 implements (7 commands, 3 queries)
- Adopt lowercase convention from `GameManager.ts` as canonical (already used by preload + handlers)
- Remove aspirational `GameAPI` interface — preload exports its own `GameAPI` via `typeof api`
- Keep useful types: `IPC_CHANNELS`, `GameStateDelta`, `InventoryDelta`, `QuestProgressDelta`, `SaveSlotInfo`
- Remove: `CanStartContentResult`, `TimeEstimates`, `DungeonStartResult`, aspirational `EngineQuery` types

## Section 2: Character Stats Computation on Load

**Problem:** `CharacterService.rowToState()` returns placeholder zeros for all stats. Characters loaded from DB can't fight.

**Solution:**
- In `rowToState()`, call `InventoryService.recalculateStats()` with class definition and equipped items
- `recalculateStats()` already does the full calc: base stats + per-level gains + gear bonuses → derived stats
- For Phase 2, equipped items may be empty on load → stats = base + level gains (correct)
- `createCharacter()` already computes base stats correctly — this only affects DB reload

## Section 3: Equip/Unequip Implementation

**Problem:** `equip_item` in GameManager is a stub. No inventory storage exists between loot rolls and character state.

**Solution — Engine side:**
- Add `bags: ItemInstance[]` to `CharacterState` (in-memory inventory)
- When `ActivityManager` returns loot, GameManager adds `ItemInstance` entries to character's bags
- `equip_item` command: look up item from bags, get `ItemDefinition`, call `InventoryService.equipItem()`, then `recalculateStats()`
- `unequip_item` command: already calls `InventoryService.unequipItem()` — add stat recalc after
- Persist bags to existing `items` DB table on save, load on character load

**Solution — Renderer side:**
- `equipItem(bagSlot)`: send command, engine determines gear slot from item definition
- `unequipItem(gearSlot)`: wire to preload's existing method
- CharacterSheet: display real item names/quality from inventory data
- After equip/unequip, reload character for updated stats

## Section 4: Wire `main.ts`

**Problem:** Electron main process creates a window and nothing else. All infrastructure exists but isn't called.

**Solution — Boot sequence:**
```
app.whenReady()
  → createWindow()
  → SaveManager.init()
  → auto-create "Autosave" if no saves exist
  → new GameBridge(db, window)
  → gameBridge.initialize()
  → registerIpcHandlers(saveManager, gameBridge)
  → gameBridge.getGameLoop().start()
```

**Decisions:**
- Auto-save on first launch (no save-slot UI for prototype)
- Graceful shutdown: `gameBridge.shutdown()` on quit
- Error handling: try/catch init, show dialog on failure
- Remove dead `state:get` reference from preload

## Section 5: Renderer Event Subscriptions

**Problem:** gameStore never subscribes to `onTick()` or `onGameEvent()`. UI never updates.

**Solution:**
- AppShell `useEffect`: subscribe to `window.api.onTick()` → re-fetch active character via `engine:query` → update store
- Subscribe to `window.api.onGameEvent()` → pipe combat events into `addCombatEvents()`
- Clean up subscriptions on unmount

**Combat events flow:**
GameManager.onTick() → ActivityManager returns events → GameManager emits via EventBus → GameBridge forwards to renderer → AppShell listener → gameStore.addCombatEvents() → CombatLog renders

**Gap to fix:** GameManager.onTick() doesn't emit combat events to EventBus — need to add that.

**ZoneView:** HP bars stay at 100% between encounters (fights are instant in idle game). Combat log shows what happened.

## Section 6: Build Validation & Trial Run

**Checklist:**
- `npm run typecheck` — no errors
- `npm run test` — all 908+ tests pass
- `npm run dev` — Electron boots without crash

**Trial run scenario:**
1. App launches → auto-creates save → CharacterCreate screen
2. Create character → CharacterSheet with real stats
3. Start grinding → ZoneView panel, game loop starts
4. Combat log fills with real-time events
5. XP bar advances, gold accumulates, quests tick
6. Loot appears in inventory with real names
7. Equip item → stats update
8. Level up visible
9. Close/reopen → character persists
10. Grinding can resume

**Success criteria:** Steps 1-9 all function without errors.
