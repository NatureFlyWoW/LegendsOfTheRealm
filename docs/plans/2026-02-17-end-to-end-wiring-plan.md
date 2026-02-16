# End-to-End Wiring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire all Phase 2 systems together so the Electron app boots, runs the idle loop, and delivers a playable level 1-5 prototype with save/load and equip.

**Architecture:** Bottom-up wiring — fix shared contracts and data layers first, then engine orchestration, then Electron boot, then renderer subscriptions. Each layer is validated before the next depends on it.

**Tech Stack:** TypeScript, Electron (electron-vite), React, Zustand, SQLite (better-sqlite3 + Kysely), Vitest

---

## Task 1: Trim IPC Contract to Match Reality

**Files:**
- Modify: `src/shared/ipc-api.ts`

**Step 1: Replace ipc-api.ts contents**

Strip to only what Phase 2 implements. Keep useful types, remove aspirational API.

```typescript
// src/shared/ipc-api.ts
import type {
  CharacterState, ItemInstance, QuestProgressState,
} from "./types";
import type { GearSlot } from "./enums";
import type { CombatEvent } from "./combat-interfaces";

// ============================================================
// IPC Channel Names (single source of truth)
// ============================================================

export const IPC_CHANNELS = {
  COMMAND: "engine:command",
  QUERY: "engine:query",
  GAME_EVENT: "game:event",
  GAME_TICK: "game:tick",
} as const;

// ============================================================
// State Delta (for future incremental sync)
// ============================================================

export interface GameStateDelta {
  timestamp: number;
  characterUpdates?: Record<number, Partial<CharacterState>>;
  inventoryUpdates?: Record<number, InventoryDelta>;
}

export interface InventoryDelta {
  added?: ItemInstance[];
  removed?: number[];
  updated?: ItemInstance[];
}

// ============================================================
// Save Slot Info
// ============================================================

export interface SaveSlotInfo {
  path: string;
  name: string;
}
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: Errors from files that import removed types — these get fixed in subsequent tasks. Note them.

**Step 3: Commit**

```bash
git add src/shared/ipc-api.ts
git commit -m "refactor: trim ipc-api.ts to Phase 2 reality"
```

---

## Task 2: Fix CharacterService Stats Computation

**Files:**
- Modify: `src/game/engine/CharacterService.ts`
- Test: existing tests + manual verification

**Step 1: Update rowToState to compute real stats**

Replace the `rowToState` method's placeholder stats with real computation using class data and `InventoryService.recalculateStats`:

```typescript
private rowToState(row: any): CharacterState {
  const className = row.class_name as ClassName;
  const classDef = getClass(className);
  const equipment = JSON.parse(row.equipment);

  // Compute stats from class definition + level (no gear on load for now)
  let stats: EffectiveStats;
  if (classDef) {
    const inventoryService = new InventoryService();
    stats = inventoryService.recalculateStats(
      { level: row.level, equipment } as CharacterState,
      classDef,
      [] // No equipped item definitions loaded yet
    );
  } else {
    // Fallback if class definition somehow missing
    stats = {
      strength: 0, agility: 0, intellect: 0, stamina: 0, spirit: 0,
      maxHp: 100, maxMana: 100, attackPower: 0, spellPower: 0, armor: 0,
      critChance: 0, hitChance: 1.0, hastePercent: 0,
      dodgeChance: 0, parryChance: 0, blockChance: 0, blockValue: 0,
      defenseSkill: row.level, resilience: 0, mp5: 0,
      weaponDamageMin: 1, weaponDamageMax: 2, weaponSpeed: 2.0,
    };
  }

  return {
    id: row.id,
    name: row.name,
    race: row.race as RaceName,
    className,
    level: row.level,
    xp: row.xp,
    restedXp: row.rested_xp,
    gold: row.gold,
    currentZone: row.current_zone as any,
    activity: row.activity as ActivityType,
    activeSpec: row.active_spec,
    talentPoints: JSON.parse(row.talent_points),
    equipment,
    stats,
    bags: [], // Will be loaded from items table separately
    companionClears: JSON.parse(row.companion_clears),
    createdAt: row.created_at,
    lastPlayedAt: row.last_played_at,
  };
}
```

Add imports at top:
```typescript
import { InventoryService } from "./InventoryService";
import type { EffectiveStats } from "@shared/types";
```

**Step 2: Run tests**

Run: `npx vitest run --reporter=verbose 2>&1 | tail -20`
Expected: PASS (existing CharacterService tests should still pass)

**Step 3: Commit**

```bash
git add src/game/engine/CharacterService.ts
git commit -m "fix: compute real stats in CharacterService.rowToState"
```

---

## Task 3: Add `bags` Field to CharacterState

**Files:**
- Modify: `src/shared/types.ts` — add `bags: ItemInstance[]` to `CharacterState`
- Modify: `src/game/engine/CharacterService.ts` — persist bags to/from `items` table
- Modify: `src/game/engine/GameManager.ts` — pipe loot into character bags

**Step 1: Add bags to CharacterState**

In `src/shared/types.ts`, add to `CharacterState` interface:

```typescript
export interface CharacterState {
  // ... existing fields ...
  bags: ItemInstance[]; // Items in inventory (not equipped)
  // ... rest of fields ...
}
```

**Step 2: Update CharacterService to load/save bags**

Add method to CharacterService:

```typescript
async loadBags(characterId: number): Promise<ItemInstance[]> {
  const rows = await this.kysely
    .selectFrom("items")
    .selectAll()
    .where("character_id", "=", characterId)
    .execute();

  return rows.map(row => ({
    id: row.id,
    templateId: row.template_id as any,
    characterId: row.character_id,
    bagSlot: row.bag_slot,
    equippedSlot: (row.equipped_slot as GearSlot | null),
    durability: row.durability,
    enchantId: row.enchant_id ?? undefined,
    gemIds: row.gem_ids ? JSON.parse(row.gem_ids) : undefined,
  }));
}

async saveBags(characterId: number, items: ItemInstance[]): Promise<void> {
  // Delete existing items for this character
  await this.kysely
    .deleteFrom("items")
    .where("character_id", "=", characterId)
    .execute();

  // Insert current items
  for (const item of items) {
    await this.kysely
      .insertInto("items")
      .values({
        template_id: item.templateId as string,
        character_id: characterId,
        bag_slot: item.bagSlot,
        equipped_slot: item.equippedSlot,
        durability: item.durability,
        enchant_id: item.enchantId ?? null,
        gem_ids: item.gemIds ? JSON.stringify(item.gemIds) : null,
      })
      .execute();
  }
}
```

Update `loadAllCharacters` to also load bags:

```typescript
async loadAllCharacters(): Promise<CharacterState[]> {
  const rows = await this.kysely
    .selectFrom("characters")
    .selectAll()
    .execute();

  const characters = rows.map(row => this.rowToState(row));
  // Load bags for each character
  for (const char of characters) {
    char.bags = await this.loadBags(char.id);
  }
  return characters;
}
```

Update `saveCharacter` to also save bags:

```typescript
async saveCharacter(state: CharacterState): Promise<void> {
  // ... existing update query ...
  await this.saveBags(state.id, state.bags);
}
```

Also update `createCharacter` to include `bags: []` in the returned CharacterState.

**Step 3: Update GameManager to pipe loot into bags**

In `GameManager.onTick`, after getting `result` from `activityManager.onTick`:

```typescript
// Add loot items to character's bags
if (result.loot && result.loot.items.length > 0) {
  for (const item of result.loot.items) {
    // Assign bag slot
    const nextSlot = this.findNextBagSlot(character);
    if (nextSlot !== -1) {
      item.bagSlot = nextSlot;
      character.bags.push(item);
    }
    // If no slots, loot is lost (bag full)
  }
}
```

Add helper:

```typescript
private findNextBagSlot(character: CharacterState): number {
  const usedSlots = new Set(character.bags.map(i => i.bagSlot));
  for (let i = 0; i < 16; i++) {
    if (!usedSlots.has(i)) return i;
  }
  return -1;
}
```

**Step 4: Run tests and fix compilation**

Run: `npx vitest run 2>&1 | tail -20`
Fix any tests that construct `CharacterState` without `bags` field.

**Step 5: Commit**

```bash
git add src/shared/types.ts src/game/engine/CharacterService.ts src/game/engine/GameManager.ts
git commit -m "feat: add bags field to CharacterState with DB persistence"
```

---

## Task 4: Implement Real Equip/Unequip in GameManager

**Files:**
- Modify: `src/game/engine/GameManager.ts`
- Modify: `src/renderer/stores/gameStore.ts`

**Step 1: Wire equip_item in GameManager**

Replace the stub `equip_item` case:

```typescript
case "equip_item": {
  const character = this.characterRoster.find(
    (c) => c.id === cmd.characterId
  );
  if (!character) {
    throw new Error(`Character not found: ${cmd.characterId}`);
  }

  // Find item in bags by bagSlot
  const itemIndex = character.bags.findIndex(i => i.bagSlot === cmd.bagSlot);
  if (itemIndex === -1) {
    return { success: false, error: "No item in that bag slot" };
  }
  const item = character.bags[itemIndex];

  // Look up item definition
  const itemDef = getItem(item.templateId);
  if (!itemDef) {
    return { success: false, error: "Item definition not found" };
  }

  // Equip via InventoryService
  const updatedCharacter = this.inventoryService.equipItem(
    character, cmd.bagSlot, item, itemDef
  );

  // Move item from bags to equipped
  item.equippedSlot = itemDef.slot as GearSlot;
  item.bagSlot = null;

  // If there was an item in that slot, unequip it to bags
  const oldBagSlot = character.equipment[itemDef.slot as GearSlot];
  if (oldBagSlot !== null) {
    const oldItem = character.bags.find(i => i.equippedSlot === itemDef.slot as GearSlot && i !== item);
    if (oldItem) {
      oldItem.equippedSlot = null;
      oldItem.bagSlot = cmd.bagSlot; // Swap into the freed slot
    }
  }

  // Apply equipment update
  Object.assign(character, updatedCharacter);

  // Recalculate stats
  const classDef = getClass(character.className);
  if (classDef) {
    const equippedItemDefs = character.bags
      .filter(i => i.equippedSlot !== null)
      .map(i => getItem(i.templateId))
      .filter((d): d is ItemDefinition => d !== undefined);
    character.stats = this.inventoryService.recalculateStats(character, classDef, equippedItemDefs);
  }

  this.dirtyCharacters.add(character.id);
  return { success: true, character };
}
```

Add imports to GameManager:

```typescript
import { getItem, getClass as getClassDef } from "@game/data";
import type { ItemDefinition } from "@shared/definitions";
```

(Note: `getClass` is already imported but as `getClass` from enums; rename or use different alias)

**Step 2: Fix unequip to recalculate stats**

After the existing unequip logic, add stat recalculation:

```typescript
case "unequip_item": {
  // ... existing code ...
  Object.assign(character, updatedCharacter);

  // Find the unequipped item and move it to bag
  const unequippedItem = character.bags.find(i => i.equippedSlot === cmd.gearSlot);
  if (unequippedItem) {
    unequippedItem.equippedSlot = null;
    const nextSlot = this.findNextBagSlot(character);
    unequippedItem.bagSlot = nextSlot;
  }

  // Recalculate stats
  const classDef = getClassDef(character.className);
  if (classDef) {
    const equippedItemDefs = character.bags
      .filter(i => i.equippedSlot !== null)
      .map(i => getItem(i.templateId))
      .filter((d): d is ItemDefinition => d !== undefined);
    character.stats = this.inventoryService.recalculateStats(character, classDef, equippedItemDefs);
  }

  this.dirtyCharacters.add(character.id);
  return { success: true, character };
}
```

**Step 3: Update gameStore equipItem/unequipItem**

In `src/renderer/stores/gameStore.ts`:

```typescript
equipItem: async (bagSlot: number) => {
  const { activeCharacterId } = get();
  if (activeCharacterId === null) return;

  try {
    const result = await window.api.character.equipItem(activeCharacterId, bagSlot, "" as GearSlot);
    if (result.success) {
      // Refresh character data
      await get().loadRoster();
    }
  } catch (error) {
    console.error("Failed to equip item:", error);
  }
},

unequipItem: async (gearSlot: GearSlot) => {
  const { activeCharacterId } = get();
  if (activeCharacterId === null) return;

  try {
    await window.api.character.unequipItem(activeCharacterId, gearSlot);
    await get().loadRoster();
  } catch (error) {
    console.error("Failed to unequip item:", error);
  }
},
```

**Step 4: Run tests**

Run: `npx vitest run 2>&1 | tail -20`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/engine/GameManager.ts src/renderer/stores/gameStore.ts
git commit -m "feat: implement real equip/unequip with stat recalculation"
```

---

## Task 5: Forward Combat Events Through EventBus

**Files:**
- Modify: `src/game/engine/GameManager.ts`

**Step 1: Emit combat events from onTick**

In `GameManager.onTick`, after processing `result`, emit combat events:

```typescript
// Forward combat events through EventBus for renderer
if (result.events.length > 0) {
  // Send as a batch event that GameBridge can forward
  for (const event of result.events) {
    this.eventBus.emit({
      type: "COMBAT_EVENTS" as any,
      events: [event],
      timestamp: Date.now(),
    } as any);
  }
}
```

**Alternative (cleaner):** Add a new event type to `events.ts`:

Actually, GameBridge already uses `eventBus.onAny()` and forwards ALL events to the renderer. The problem is GameManager never emits anything about combat. The simplest fix: store the tick result and expose it so GameBridge can send it.

Better approach — modify GameBridge's `onTick`:

In `src/main/ipc/gamebridge.ts`, change onTick to also send combat events:

```typescript
private onTick(tickNumber: number): void {
  this.gameManager.onTick(tickNumber);

  // Get last tick result and send combat events to renderer
  const lastResult = this.gameManager.getLastTickResult();
  if (lastResult && lastResult.events.length > 0) {
    this.window.webContents.send("game:combat-events", lastResult.events);
  }

  // Send tick number to renderer
  this.window.webContents.send("game:tick", tickNumber);
}
```

Add to GameManager:

```typescript
private lastTickResult: ActivityTickResult | null = null;

// In onTick, store the result:
// this.lastTickResult = result;

getLastTickResult(): ActivityTickResult | null {
  const result = this.lastTickResult;
  this.lastTickResult = null;
  return result;
}
```

**Step 2: Update preload to expose combat events listener**

In `src/main/preload.ts`, add:

```typescript
onCombatEvents: (callback: (events: CombatEvent[]) => void) => {
  const handler = (_event: unknown, events: CombatEvent[]) => callback(events);
  ipcRenderer.on("game:combat-events", handler);
  return () => ipcRenderer.removeListener("game:combat-events", handler);
},
```

Add import: `import type { CombatEvent } from "@shared/combat-interfaces";`

**Step 3: Run tests**

Run: `npx vitest run 2>&1 | tail -20`
Expected: PASS

**Step 4: Commit**

```bash
git add src/game/engine/GameManager.ts src/main/ipc/gamebridge.ts src/main/preload.ts
git commit -m "feat: forward combat events from engine to renderer via IPC"
```

---

## Task 6: Wire main.ts — Boot the Engine

**Files:**
- Modify: `src/main/main.ts`
- Modify: `src/main/preload.ts` — remove dead `state:get` reference

**Step 1: Rewrite main.ts to boot the full engine**

```typescript
import { app, BrowserWindow, dialog } from "electron";
import { join } from "path";
import { SaveManager } from "@game/engine/SaveManager";
import { GameBridge } from "./ipc/gamebridge";
import { registerIpcHandlers } from "./ipc/handlers";

let gameBridge: GameBridge | null = null;
let saveManager: SaveManager | null = null;

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      preload: join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));
  }

  return win;
}

async function bootstrap(): Promise<void> {
  const win = createWindow();

  try {
    // Initialize save system
    saveManager = new SaveManager();
    const saves = saveManager.listSaves();

    let db;
    if (saves.length > 0) {
      // Open the first (most recent) save
      db = saveManager.openSave(saves[0]);
    } else {
      // Auto-create default save on first launch
      db = saveManager.createSave("Autosave");
    }

    // Boot game engine
    gameBridge = new GameBridge(db, win);
    await gameBridge.initialize();

    // Register IPC handlers
    registerIpcHandlers(saveManager, gameBridge);

    // Start the game loop
    gameBridge.getGameLoop().start();
  } catch (error) {
    dialog.showErrorBox(
      "Failed to start game",
      `The game engine failed to initialize:\n${(error as Error).message}`
    );
    app.quit();
  }
}

app.whenReady().then(bootstrap);

app.on("window-all-closed", async () => {
  // Graceful shutdown
  if (gameBridge) {
    await gameBridge.shutdown();
  }
  if (saveManager) {
    saveManager.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});
```

**Step 2: Remove dead `state:get` from preload**

In `src/main/preload.ts`, remove:

```typescript
// Remove this line:
getGameState: () => ipcRenderer.invoke("state:get"),
```

**Step 3: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: PASS (or known errors from earlier tasks)

**Step 4: Commit**

```bash
git add src/main/main.ts src/main/preload.ts
git commit -m "feat: wire main.ts to boot SaveManager, GameBridge, and GameLoop"
```

---

## Task 7: Wire Renderer Event Subscriptions

**Files:**
- Modify: `src/renderer/components/AppShell.tsx`
- Modify: `src/renderer/stores/gameStore.ts`

**Step 1: Add tick subscription to AppShell**

In `AppShell.tsx`, add a `useEffect` that subscribes to tick and combat events:

```typescript
// Subscribe to game events from main process
useEffect(() => {
  // On each tick, refresh the active character's state
  const unsubTick = window.api.onTick(async () => {
    const { activeCharacterId } = useGameStore.getState();
    if (activeCharacterId === null) return;

    try {
      const result = await window.api.sendQuery({ type: "get_character", characterId: activeCharacterId });
      if (result.success && result.character) {
        // Update this character in the store
        useGameStore.setState((state) => ({
          characters: state.characters.map((c) =>
            c.id === activeCharacterId ? result.character : c
          ),
        }));
      }
    } catch (e) {
      // Silently ignore tick fetch errors
    }
  });

  // On combat events, pipe into combat log
  const unsubCombat = window.api.onCombatEvents?.((events) => {
    useGameStore.getState().addCombatEvents(events);
  });

  // On game events (level up, quest complete, etc.)
  const unsubEvents = window.api.onGameEvent((event) => {
    // For now, log game events — future: toast notifications
    console.log("[GameEvent]", event);
  });

  return () => {
    unsubTick();
    unsubCombat?.();
    unsubEvents();
  };
}, []);
```

**Step 2: Add `onCombatEvents` to gameStore types/window.d.ts if needed**

The preload already exposes `onCombatEvents` (added in Task 5). Make sure `window.d.ts` picks it up via `typeof api`.

**Step 3: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/AppShell.tsx
git commit -m "feat: subscribe renderer to tick and combat events from engine"
```

---

## Task 8: Update CharacterSheet to Show Real Inventory

**Files:**
- Modify: `src/renderer/components/CharacterSheet.tsx`

**Step 1: Replace mock inventory with real bags data**

Replace the mock `inventoryItems` line with:

```typescript
// Get real inventory items from character bags
const inventoryItems = (character.bags || [])
  .filter(item => item.bagSlot !== null && item.equippedSlot === null)
  .map(item => {
    const def = getItem(item.templateId);
    return {
      ...item,
      name: def?.name ?? "Unknown Item",
      quality: def?.quality ?? QualityTier.Common,
      slot: def?.slot ?? "bag",
    };
  });
```

Add import: `import { getItem } from "@game/data";`

Update equipment display to show real item names:

```typescript
{GEAR_SLOTS.map((slot) => {
  const equippedItem = (character.bags || []).find(i => i.equippedSlot === slot);
  const itemDef = equippedItem ? getItem(equippedItem.templateId) : null;
  const hasItem = equippedItem !== null && itemDef !== null;

  return (
    <div
      key={slot}
      className="bg-gray-900 border border-gray-700 rounded p-2 flex items-center gap-2 cursor-pointer"
      onClick={() => hasItem && equippedItem && unequipItem(slot)}
    >
      <span className="text-gray-500 w-20 shrink-0">{SLOT_LABELS[slot]}:</span>
      <span className={hasItem && itemDef ? QUALITY_COLORS[itemDef.quality] : "text-gray-600 italic"}>
        {hasItem && itemDef ? itemDef.name : "Empty"}
      </span>
    </div>
  );
})}
```

Add `unequipItem` to the store selectors at the top of the component:
```typescript
const unequipItem = useGameStore((s) => s.unequipItem);
```

**Step 2: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: PASS

**Step 3: Commit**

```bash
git add src/renderer/components/CharacterSheet.tsx
git commit -m "feat: display real inventory items and equipment names in CharacterSheet"
```

---

## Task 9: Fix ZoneView and Add Start-Grinding UX

**Files:**
- Modify: `src/renderer/components/ZoneView.tsx`
- Modify: `src/renderer/components/AppShell.tsx`

**Step 1: Make ZoneView always visible when a character is selected (not just when grinding)**

In `AppShell.tsx`, change the zone panel condition so it shows whether grinding or not — allows user to click "Start Grinding":

```typescript
{/* Zone View - persistent bottom panel when character is selected */}
{activeCharacterId !== null && (
  <div className="h-64 border-t border-gray-700">
    <ZoneView />
  </div>
)}
```

**Step 2: Add "also select character" in store**

In `gameStore.ts`, make `selectCharacter` also call the engine to set active:

```typescript
selectCharacter: (id: number) => {
  window.api.sendCommand({ type: "select_character", characterId: id });
  set({ activeCharacterId: id });
},
```

And on `createCharacter` success, also send select command.

**Step 3: Run typecheck**

Run: `npx tsc --noEmit 2>&1 | head -40`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/AppShell.tsx src/renderer/components/ZoneView.tsx src/renderer/stores/gameStore.ts
git commit -m "feat: show ZoneView when character selected, sync selection to engine"
```

---

## Task 10: Fix All Compilation Errors and Run Full Test Suite

**Files:**
- Any files with type errors from previous tasks

**Step 1: Run typecheck and fix all errors**

Run: `npx tsc --noEmit 2>&1`

Common expected fixes:
- Tests that construct `CharacterState` without `bags` field — add `bags: []`
- Import path fixes for moved/removed types from `ipc-api.ts`
- Any `any` casts that need tightening

**Step 2: Run full test suite**

Run: `npx vitest run 2>&1 | tail -30`
Expected: All 908+ tests pass

**Step 3: Commit**

```bash
git add -A
git commit -m "fix: resolve all compilation errors from end-to-end wiring"
```

---

## Task 11: Build Validation and Smoke Test

**Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 2: Run test suite**

Run: `npx vitest run`
Expected: All tests pass

**Step 3: Try Electron build**

Run: `npx electron-vite build 2>&1 | tail -20`
Expected: Build succeeds (may have warnings, no errors)

**Step 4: Try dev mode**

Run: `npx electron-vite dev`
Expected: Electron window opens. Check for:
- No crash on boot
- CharacterCreate screen appears (if first launch)
- Console has no red errors

**Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "chore: build validation — typecheck, tests, electron-vite build all pass"
```

---

## Summary of Tasks

| # | Task | Domain | Dependencies |
|---|------|--------|-------------|
| 1 | Trim IPC contract | shared | none |
| 2 | Fix CharacterService stats | engine | none |
| 3 | Add bags to CharacterState | shared + engine | 2 |
| 4 | Real equip/unequip | engine + renderer | 3 |
| 5 | Forward combat events | engine + IPC | none |
| 6 | Wire main.ts | main | 1, 5 |
| 7 | Renderer event subscriptions | renderer | 5, 6 |
| 8 | CharacterSheet real inventory | renderer | 3, 4 |
| 9 | ZoneView + start-grinding UX | renderer | 7 |
| 10 | Fix compilation errors | all | 1-9 |
| 11 | Build validation | all | 10 |

**Parallelizable groups:**
- Group A (independent): Tasks 1, 2, 5
- Group B (after 2): Task 3
- Group C (after 3): Tasks 4, 8
- Group D (after 1+5): Task 6
- Group E (after 5+6): Tasks 7, 9
- Group F (after all): Tasks 10, 11
