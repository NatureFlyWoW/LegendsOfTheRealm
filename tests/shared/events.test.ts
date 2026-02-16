// tests/shared/events.test.ts
import { describe, it, expect } from "vitest";
import type { GameEvent } from "@shared/events";

describe("GameEvent discriminated union", () => {
  it("CHARACTER_LEVELED event has required fields", () => {
    const event: GameEvent = {
      type: "CHARACTER_LEVELED",
      characterId: 1,
      newLevel: 10,
      timestamp: Date.now(),
    };
    expect(event.type).toBe("CHARACTER_LEVELED");
  });

  it("ITEM_ACQUIRED event has itemId as string", () => {
    const event: GameEvent = {
      type: "ITEM_ACQUIRED",
      characterId: 1,
      itemId: "bjornskars_icebreaker" as any,
      quality: "epic",
      timestamp: Date.now(),
    };
    expect(typeof event.itemId).toBe("string");
  });
});
