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
  removed?: number[];
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
  | { type: "SET_SPEED"; multiplier: number };

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
  error?: string;
}

export interface DungeonStartResult {
  success: boolean;
  encounterId?: string;
  error?: string;
}

// ============================================================
// Query API (read-only queries)
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
  reasons: string[];
  gearCheckPassed: boolean;
  averageILvl: number;
  requiredILvl: number;
  companionQuality: string;
}

export interface TimeEstimates {
  xpPerHour: number;
  timeToNextLevel: number;
  estimatedDungeonClearTime: number;
}

// ============================================================
// Full API surface exposed via preload (typed contract)
// ============================================================

export interface GameAPI {
  save: {
    create(name: string): Promise<{ saveId: number }>;
    list(): Promise<SaveSlotInfo[]>;
    open(saveId: number): Promise<FullGameState>;
    save(): Promise<void>;
    delete(saveId: number): Promise<void>;
  };

  character: {
    create(name: string, race: string, className: string): Promise<CreateCharacterResult>;
    list(): Promise<CharacterSummaryInfo[]>;
    setActivity(characterId: number, activity: ActivityType, targetId?: string): Promise<void>;
    equipItem(characterId: number, itemInstanceId: number, slot: GearSlot): Promise<EquipResult>;
    setTalents(characterId: number, specId: string, points: Record<string, number>): Promise<void>;
    respec(characterId: number): Promise<void>;
  };

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

  query: {
    timeEstimates(characterId: number): Promise<TimeEstimates>;
    validateName(name: string): Promise<{ valid: boolean; reason?: string }>;
    bagSpace(characterId: number): Promise<{ used: number; total: number }>;
    partyPreview(characterId: number, contentId: string): Promise<any>;
  };

  setSpeed(multiplier: number): Promise<void>;

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
