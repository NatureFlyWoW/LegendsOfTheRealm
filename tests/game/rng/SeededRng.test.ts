// tests/game/rng/SeededRng.test.ts
import { describe, test, expect } from "vitest";
import { SeededRng } from "@game/rng/SeededRng";

describe("SeededRng", () => {
  test("implements ISeededRng interface", () => {
    const rng = new SeededRng(12345);
    expect(typeof rng.next).toBe("function");
    expect(typeof rng.nextInt).toBe("function");
    expect(typeof rng.nextFloat).toBe("function");
    expect(typeof rng.nextBool).toBe("function");
    expect(typeof rng.getState).toBe("function");
    expect(typeof rng.setState).toBe("function");
  });

  test("next() returns values in [0, 1)", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  test("nextInt(min, max) returns values in [min, max] inclusive", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextInt(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test("nextFloat(min, max) returns values in [min, max)", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng.nextFloat(0.95, 1.05);
      expect(v).toBeGreaterThanOrEqual(0.95);
      expect(v).toBeLessThan(1.05);
    }
  });

  test("nextBool(1.0) always returns true", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 100; i++) expect(rng.nextBool(1.0)).toBe(true);
  });

  test("nextBool(0.0) always returns false", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 100; i++) expect(rng.nextBool(0.0)).toBe(false);
  });

  test("determinism: same seed produces identical sequences", () => {
    const rng1 = new SeededRng(99999);
    const rng2 = new SeededRng(99999);
    for (let i = 0; i < 10000; i++) expect(rng1.next()).toBe(rng2.next());
  });

  test("different seeds produce different sequences", () => {
    const rng1 = new SeededRng(1);
    const rng2 = new SeededRng(2);
    const seq1 = Array.from({ length: 10 }, () => rng1.next());
    const seq2 = Array.from({ length: 10 }, () => rng2.next());
    expect(seq1).not.toEqual(seq2);
  });

  test("getState/setState preserves and restores RNG position", () => {
    const rng = new SeededRng(42);
    for (let i = 0; i < 50; i++) rng.next();
    const state = rng.getState();
    const seq1 = Array.from({ length: 20 }, () => rng.next());
    rng.setState(state);
    const seq2 = Array.from({ length: 20 }, () => rng.next());
    expect(seq1).toEqual(seq2);
  });

  test("distribution: nextInt is roughly uniform", () => {
    const rng = new SeededRng(42);
    const counts = [0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 60000; i++) counts[rng.nextInt(0, 5)]++;
    for (const count of counts) {
      expect(count).toBeGreaterThan(8500);
      expect(count).toBeLessThan(11500);
    }
  });
});
