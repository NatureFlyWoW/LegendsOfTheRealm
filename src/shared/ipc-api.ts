// src/shared/ipc-api.ts
// IPC contract — trimmed to what Phase 2 actually implements.
// Engine commands/queries are defined in GameManager.ts (canonical source).

import type { CharacterState, ItemInstance } from "./types";

// ============================================================
// IPC Channel Names (single source of truth)
// ============================================================

export const IPC_CHANNELS = {
  COMMAND: "engine:command",
  QUERY: "engine:query",
  GAME_EVENT: "game:event",
  GAME_TICK: "game:tick",
  COMBAT_EVENTS: "game:combat-events",
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
