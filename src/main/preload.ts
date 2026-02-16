import { contextBridge, ipcRenderer } from "electron";
import type { EngineCommand, EngineQuery } from "@game/engine/GameManager";
import type { RaceName, ClassName, ActivityType, GearSlot } from "@shared/enums";
import type { ZoneId } from "@shared/types";
import type { GameEvent } from "@shared/events";
import type { CombatEvent } from "@shared/combat-interfaces";

const api = {
  // Save management
  createSave: (name: string) => ipcRenderer.invoke("save:create", name),
  openSave: (path: string) => ipcRenderer.invoke("save:open", path),
  listSaves: () => ipcRenderer.invoke("save:list"),
  backupSave: (path: string) => ipcRenderer.invoke("save:backup", path),

  // Game loop
  startGame: () => ipcRenderer.invoke("game:start"),
  stopGame: () => ipcRenderer.invoke("game:stop"),
  pauseGame: () => ipcRenderer.invoke("game:pause"),
  resumeGame: () => ipcRenderer.invoke("game:resume"),

  // Character management
  character: {
    list: async () => {
      const result = await ipcRenderer.invoke("engine:query", {
        type: "get_character_roster",
      } as EngineQuery);
      return result.success ? result.roster : [];
    },

    create: async (name: string, race: RaceName, className: ClassName) => {
      const result = await ipcRenderer.invoke("engine:command", {
        type: "create_character",
        name,
        race,
        className,
      } as EngineCommand);
      return {
        success: result.success,
        characterId: result.character?.id,
        error: result.error,
      };
    },

    setActivity: async (
      characterId: number,
      activity: ActivityType | "idle",
      zoneId?: ZoneId
    ) => {
      if (activity === "grinding" && zoneId) {
        return ipcRenderer.invoke("engine:command", {
          type: "start_grinding",
          characterId,
          zoneId,
        } as EngineCommand);
      } else if (activity === "idle") {
        return ipcRenderer.invoke("engine:command", {
          type: "stop_activity",
          characterId,
        } as EngineCommand);
      }
      return { success: false, error: "Invalid activity type" };
    },

    equipItem: async (characterId: number, bagSlot: number) => {
      return ipcRenderer.invoke("engine:command", {
        type: "equip_item",
        characterId,
        bagSlot,
      } as EngineCommand);
    },

    unequipItem: async (characterId: number, gearSlot: GearSlot) => {
      return ipcRenderer.invoke("engine:command", {
        type: "unequip_item",
        characterId,
        gearSlot,
      } as EngineCommand);
    },
  },

  // Generic engine command/query channels
  sendCommand: (cmd: EngineCommand) => ipcRenderer.invoke("engine:command", cmd),
  sendQuery: (query: EngineQuery) => ipcRenderer.invoke("engine:query", query),

  // Events from main
  onTick: (callback: (tick: number) => void) => {
    const handler = (_event: unknown, tick: number) => callback(tick);
    ipcRenderer.on("game:tick", handler);
    return () => ipcRenderer.removeListener("game:tick", handler);
  },

  onGameEvent: (callback: (event: GameEvent) => void) => {
    const handler = (_event: unknown, gameEvent: GameEvent) => callback(gameEvent);
    ipcRenderer.on("game:event", handler);
    return () => ipcRenderer.removeListener("game:event", handler);
  },

  onCombatEvents: (callback: (events: CombatEvent[]) => void) => {
    const handler = (_event: unknown, events: CombatEvent[]) => callback(events);
    ipcRenderer.on("game:combat-events", handler);
    return () => ipcRenderer.removeListener("game:combat-events", handler);
  },

  // App info
  ping: () => "pong",
};

contextBridge.exposeInMainWorld("api", api);

export type GameAPI = typeof api;
