import { create } from "zustand";
import type { CharacterState } from "@shared/types";
import type { CombatEvent } from "@shared/combat-interfaces";
import type { ClassName, RaceName, GearSlot } from "@shared/enums";
import type { ZoneId } from "@shared/types";
import { ActivityType } from "@shared/enums";

// ============================================================
// Store State Types
// ============================================================

export interface QuestState {
  questId: string;
  objectives: Record<string, number>;
  status: "active" | "complete";
}

export interface WelcomeBackSummary {
  xpGained: number;
  goldGained: number;
  levelsGained: number;
  mobsKilled: number;
  elapsedMinutes: number;
}

export interface ZoneState {
  grinding: boolean;
  zoneId: string | null;
  currentMob: string | null;
}

export interface GameStoreState {
  characters: CharacterState[];
  activeCharacterId: number | null;
  combatEvents: CombatEvent[];
  zoneState: ZoneState | null;
  questProgress: QuestState[];
  welcomeBack: WelcomeBackSummary | null;
  isLoading: boolean;

  // Actions
  loadRoster(): Promise<void>;
  createCharacter(name: string, race: RaceName, className: ClassName): Promise<void>;
  selectCharacter(id: number): void;
  startGrinding(zoneId: ZoneId): Promise<void>;
  stopGrinding(): Promise<void>;
  equipItem(bagSlot: number): Promise<void>;
  unequipItem(gearSlot: GearSlot): Promise<void>;
  addCombatEvents(events: CombatEvent[]): void;
  dismissWelcomeBack(): void;
}

// ============================================================
// Constants
// ============================================================

const COMBAT_LOG_MAX_LINES = 500;

// ============================================================
// Store Implementation
// ============================================================

export const useGameStore = create<GameStoreState>((set, get) => ({
  characters: [],
  activeCharacterId: null,
  combatEvents: [],
  zoneState: null,
  questProgress: [],
  welcomeBack: null,
  isLoading: false,

  loadRoster: async () => {
    set({ isLoading: true });
    try {
      // IPC call to fetch all characters
      const characters = await window.api.character.list();
      set({
        characters: characters as CharacterState[],
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to load roster:", error);
      set({ isLoading: false });
    }
  },

  createCharacter: async (name: string, race: RaceName, className: ClassName) => {
    set({ isLoading: true });
    try {
      const result = await window.api.character.create(name, race, className);
      if (result.success && result.characterId) {
        // Reload roster to include new character
        await get().loadRoster();
        // Auto-select the new character
        window.api.sendCommand({ type: "select_character", characterId: result.characterId });
        set({ activeCharacterId: result.characterId });
      } else {
        // Creation failed but no exception thrown
        set({ isLoading: false });
      }
    } catch (error) {
      console.error("Failed to create character:", error);
      set({ isLoading: false });
    }
  },

  selectCharacter: (id: number) => {
    window.api.sendCommand({ type: "select_character", characterId: id });
    set({ activeCharacterId: id });
  },

  startGrinding: async (zoneId: ZoneId) => {
    const { activeCharacterId } = get();
    if (activeCharacterId === null) return;

    set({ isLoading: true });
    try {
      await window.api.character.setActivity(activeCharacterId, ActivityType.Grinding, zoneId);
      set({
        zoneState: {
          grinding: true,
          zoneId,
          currentMob: null,
        },
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to start grinding:", error);
      set({ isLoading: false });
    }
  },

  stopGrinding: async () => {
    const { activeCharacterId } = get();
    if (activeCharacterId === null) return;

    set({ isLoading: true });
    try {
      await window.api.character.setActivity(activeCharacterId, "idle");
      set({
        zoneState: null,
        isLoading: false,
      });
    } catch (error) {
      console.error("Failed to stop grinding:", error);
      set({ isLoading: false });
    }
  },

  equipItem: async (bagSlot: number) => {
    const { activeCharacterId } = get();
    if (activeCharacterId === null) return;

    try {
      // Engine determines correct gear slot from item definition
      const result = await window.api.character.equipItem(activeCharacterId, bagSlot, "" as GearSlot);
      if (result.success) {
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

  addCombatEvents: (events: CombatEvent[]) => {
    const { combatEvents } = get();
    const newEvents = [...combatEvents, ...events];

    // Ring buffer behavior: cap at max lines
    const trimmedEvents = newEvents.slice(-COMBAT_LOG_MAX_LINES);

    set({ combatEvents: trimmedEvents });
  },

  dismissWelcomeBack: () => {
    set({ welcomeBack: null });
  },
}));
