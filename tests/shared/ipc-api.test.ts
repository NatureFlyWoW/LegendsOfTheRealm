// tests/shared/ipc-api.test.ts
import { describe, it, expect } from "vitest";
import { IPC_CHANNELS } from "@shared/ipc-api";
import type {
  GameStateDelta, EngineCommand, GameAPI,
} from "@shared/ipc-api";

describe("IPC channel names", () => {
  it("has all required channels", () => {
    expect(IPC_CHANNELS.STATE_DELTA).toBe("engine:state-delta");
    expect(IPC_CHANNELS.COMBAT_EVENTS).toBe("engine:combat-events");
    expect(IPC_CHANNELS.NOTIFICATION).toBe("engine:notification");
    expect(IPC_CHANNELS.COMMAND).toBe("engine:command");
    expect(IPC_CHANNELS.WELCOME_BACK).toBe("engine:welcome-back");
  });
});

describe("GameStateDelta uses Record not Map", () => {
  it("characterUpdates is a Record", () => {
    const delta: GameStateDelta = {
      timestamp: Date.now(),
      characterUpdates: { 1: { level: 10 } },
    };
    const json = JSON.stringify(delta);
    const parsed = JSON.parse(json) as GameStateDelta;
    expect(parsed.characterUpdates?.[1]?.level).toBe(10);
  });
});

describe("EngineCommand uses characterId not charId", () => {
  it("EQUIP_ITEM uses characterId", () => {
    const cmd: EngineCommand = {
      type: "EQUIP_ITEM",
      characterId: 1,
      itemInstanceId: 42,
      slot: "main_hand" as any,
    };
    expect(cmd.characterId).toBe(1);
    expect((cmd as any).charId).toBeUndefined();
  });
});
