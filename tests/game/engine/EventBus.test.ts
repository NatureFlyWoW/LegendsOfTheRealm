import { describe, it, expect, vi } from "vitest";
import { EventBus } from "@game/engine/EventBus";
import type { GameEvent } from "@shared/events";

describe("EventBus", () => {
  it("subscribes and receives events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    const event: GameEvent = { type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 };
    bus.emit(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("does not call handler for other event types", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    bus.emit({ type: "GOLD_CHANGED", characterId: 1, amount: 100, reason: "loot", timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple handlers for same event", () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on("CHARACTER_LEVELED", handler1);
    bus.on("CHARACTER_LEVELED", handler2);
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it("unsubscribes with returned cleanup function", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    const unsub = bus.on("CHARACTER_LEVELED", handler);
    unsub();
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("onAny receives all events", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.onAny(handler);
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    bus.emit({ type: "GOLD_CHANGED", characterId: 1, amount: 50, reason: "loot", timestamp: 1001 });
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it("clear removes all handlers", () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on("CHARACTER_LEVELED", handler);
    bus.clear();
    bus.emit({ type: "CHARACTER_LEVELED", characterId: 1, newLevel: 2, timestamp: 1000 });
    expect(handler).not.toHaveBeenCalled();
  });
});
