import { describe, it, expect } from "vitest";
import { LRUCache } from "@renderer/ascii/LRUCache";

describe("LRUCache", () => {
  it("stores and retrieves values", () => {
    const cache = new LRUCache<string, number>(10);
    cache.set("a", 1);
    cache.set("b", 2);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBe(2);
  });

  it("returns undefined for missing keys", () => {
    const cache = new LRUCache<string, number>(10);
    expect(cache.get("missing")).toBeUndefined();
    cache.set("a", 1);
    expect(cache.get("b")).toBeUndefined();
  });

  it("evicts LRU entry when at capacity", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // Cache is full: [a, b, c]. Insert d => evict a (LRU).
    cache.set("d", 4);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
    expect(cache.size).toBe(3);
  });

  it("accessing a key promotes it to MRU (prevents eviction)", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // Access "a" to promote it — now LRU order is [b, c, a]
    cache.get("a");
    // Insert d => evict b (now the LRU)
    cache.set("d", 4);
    expect(cache.get("a")).toBe(1);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("reports correct size", () => {
    const cache = new LRUCache<string, number>(5);
    expect(cache.size).toBe(0);
    cache.set("a", 1);
    expect(cache.size).toBe(1);
    cache.set("b", 2);
    expect(cache.size).toBe(2);
    // Update existing key — size should not change
    cache.set("a", 10);
    expect(cache.size).toBe(2);
  });

  it("clear empties the cache", () => {
    const cache = new LRUCache<string, number>(5);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.size).toBe(3);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBeUndefined();
  });

  it("capacity of 1 works correctly", () => {
    const cache = new LRUCache<string, number>(1);
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.size).toBe(1);
    // Adding another key evicts the only entry
    cache.set("b", 2);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
    expect(cache.size).toBe(1);
  });

  it("set updates value for existing key", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("a", 100);
    expect(cache.get("a")).toBe(100);
    expect(cache.size).toBe(1);
  });

  it("set promotes existing key to MRU", () => {
    const cache = new LRUCache<string, number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    // Update "a" — promotes it to MRU. LRU order: [b, c, a]
    cache.set("a", 10);
    // Insert d => evict b (LRU)
    cache.set("d", 4);
    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
    expect(cache.get("d")).toBe(4);
  });

  it("enforces minimum capacity of 1", () => {
    const cache0 = new LRUCache<string, number>(0);
    cache0.set("a", 1);
    expect(cache0.get("a")).toBe(1);
    expect(cache0.size).toBe(1);

    const cacheNeg = new LRUCache<string, number>(-5);
    cacheNeg.set("x", 42);
    expect(cacheNeg.get("x")).toBe(42);
    expect(cacheNeg.size).toBe(1);
  });
});
