// tests/game/rng/RngStreamManager.test.ts
import { describe, test, expect } from "vitest";
import { RngStreamManager } from "@game/rng/RngStreamManager";

describe("RngStreamManager", () => {
  test("creates 6 independent streams from master seed", () => {
    const mgr = new RngStreamManager(42);
    const domains = ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"];
    for (const domain of domains) {
      const rng = mgr.get(domain);
      expect(rng).toBeDefined();
      expect(typeof rng.next()).toBe("number");
    }
  });

  test("throws on unknown domain", () => {
    const mgr = new RngStreamManager(42);
    expect(() => mgr.get("invalid")).toThrow("Unknown RNG domain");
  });

  test("streams are independent — consuming one does not affect another", () => {
    const mgr1 = new RngStreamManager(42);
    const mgr2 = new RngStreamManager(42);
    for (let i = 0; i < 100; i++) mgr1.get("combat").next();
    const loot1 = Array.from({ length: 10 }, () => mgr1.get("loot").next());
    const loot2 = Array.from({ length: 10 }, () => mgr2.get("loot").next());
    expect(loot1).toEqual(loot2);
  });

  test("serialize/deserialize preserves all stream states", () => {
    const mgr = new RngStreamManager(42);
    for (let i = 0; i < 50; i++) mgr.get("combat").next();
    for (let i = 0; i < 30; i++) mgr.get("loot").next();
    const serialized = mgr.serialize();
    const mgr2 = new RngStreamManager(1);
    mgr2.deserialize(serialized);
    const seq1 = Array.from({ length: 20 }, () => mgr.get("combat").next());
    const seq2 = Array.from({ length: 20 }, () => mgr2.get("combat").next());
    expect(seq1).toEqual(seq2);
    const l1 = Array.from({ length: 20 }, () => mgr.get("loot").next());
    const l2 = Array.from({ length: 20 }, () => mgr2.get("loot").next());
    expect(l1).toEqual(l2);
  });

  test("same master seed produces identical managers", () => {
    const mgr1 = new RngStreamManager(12345);
    const mgr2 = new RngStreamManager(12345);
    for (const domain of ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"]) {
      const seq1 = Array.from({ length: 10 }, () => mgr1.get(domain).next());
      const seq2 = Array.from({ length: 10 }, () => mgr2.get(domain).next());
      expect(seq1).toEqual(seq2);
    }
  });
});
