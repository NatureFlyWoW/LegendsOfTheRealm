// src/game/rng/SeededRng.ts
import type { ISeededRng, RngState } from "@shared/combat-interfaces";

/**
 * Seeded pseudo-random number generator using xoshiro128** algorithm.
 * Provides deterministic, high-quality random sequences for game logic.
 * Uses SplitMix32 for seeding and includes 20 warmup rounds.
 */
export class SeededRng implements ISeededRng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  constructor(seed: number) {
    // Initialize state using SplitMix32 seeding
    let s = seed | 0;
    this.s0 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s1 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s2 = splitmix32(s); s = (s + 0x9e3779b9) | 0;
    this.s3 = splitmix32(s);

    // Warmup rounds to improve initial distribution
    for (let i = 0; i < 20; i++) this.nextRaw();
  }

  /**
   * Generate next raw 32-bit unsigned integer using xoshiro128**
   */
  private nextRaw(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5), 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;

    this.s2 ^= this.s0;
    this.s3 ^= this.s1;
    this.s1 ^= this.s2;
    this.s0 ^= this.s3;
    this.s2 ^= t;
    this.s3 = rotl(this.s3, 11);

    return result;
  }

  /**
   * Generate random float in [0, 1)
   */
  next(): number {
    return (this.nextRaw() >>> 0) / 0x100000000;
  }

  /**
   * Generate random integer in [min, max] inclusive
   */
  nextInt(min: number, max: number): number {
    const range = max - min + 1;
    return min + ((this.nextRaw() >>> 0) % range);
  }

  /**
   * Generate random float in [min, max)
   */
  nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Return true with given probability (0.0 = never, 1.0 = always)
   */
  nextBool(probability: number): boolean {
    return this.next() < probability;
  }

  /**
   * Get current RNG state for serialization
   */
  getState(): RngState {
    return {
      s0: this.s0,
      s1: this.s1,
      s2: this.s2,
      s3: this.s3,
    };
  }

  /**
   * Restore RNG state from serialized data
   */
  setState(state: RngState): void {
    this.s0 = state.s0;
    this.s1 = state.s1;
    this.s2 = state.s2;
    this.s3 = state.s3;
  }
}

/**
 * Rotate left helper for xoshiro128**
 */
function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

/**
 * SplitMix32 seeding function for state initialization
 */
function splitmix32(seed: number): number {
  let z = (seed + 0x9e3779b9) | 0;
  z = Math.imul(z ^ (z >>> 16), 0x85ebca6b);
  z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35);
  return (z ^ (z >>> 16)) >>> 0;
}
