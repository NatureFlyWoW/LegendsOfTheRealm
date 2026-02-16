// tests/shared/ipc-api.test.ts
import { describe, it, expect } from "vitest";
import { IPC_CHANNELS } from "@shared/ipc-api";
import type { GameStateDelta, SaveSlotInfo } from "@shared/ipc-api";

describe("IPC channel names", () => {
  it("has all Phase 2 channels", () => {
    expect(IPC_CHANNELS.COMMAND).toBe("engine:command");
    expect(IPC_CHANNELS.QUERY).toBe("engine:query");
    expect(IPC_CHANNELS.GAME_EVENT).toBe("game:event");
    expect(IPC_CHANNELS.GAME_TICK).toBe("game:tick");
    expect(IPC_CHANNELS.COMBAT_EVENTS).toBe("game:combat-events");
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

describe("SaveSlotInfo", () => {
  it("has path and name fields", () => {
    const slot: SaveSlotInfo = { path: "/saves/test.db", name: "test" };
    expect(slot.path).toBe("/saves/test.db");
    expect(slot.name).toBe("test");
  });
});
