// src/game/combat/rng.ts
import type { ISeededRng, RngState } from "@shared/combat-interfaces";

/**
 * Xoshiro128++ deterministic PRNG implementation.
 * Provides reproducible random number generation for combat simulations.
 */
export class SeededRng implements ISeededRng {
  private state: RngState;

  constructor(seed: number) {
    this.state = this.initializeState(seed);
  }

  /**
   * Initialize state from a seed using SplitMix32.
   */
  private initializeState(seed: number): RngState {
    let s = seed;
    const next = () => {
      s = (s + 0x9e3779b9) | 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 16), 0x21f0aaad);
      t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
      return (t ^ (t >>> 15)) >>> 0;
    };

    return {
      s0: next(),
      s1: next(),
      s2: next(),
      s3: next(),
    };
  }

  /**
   * Generate next random number (Xoshiro128++ algorithm).
   * Returns a 32-bit unsigned integer.
   */
  next(): number {
    const result = ((this.state.s0 + this.state.s3) | 0) >>> 0;
    const t = (this.state.s1 << 9) >>> 0;

    this.state.s2 ^= this.state.s0;
    this.state.s3 ^= this.state.s1;
    this.state.s1 ^= this.state.s2;
    this.state.s0 ^= this.state.s3;

    this.state.s2 ^= t;
    this.state.s3 = ((this.state.s3 << 11) | (this.state.s3 >>> 21)) >>> 0;

    return result;
  }

  /**
   * Generate random integer in range [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    const range = max - min + 1;
    return min + (this.next() % range);
  }

  /**
   * Generate random float in range [min, max).
   */
  nextFloat(min: number, max: number): number {
    const normalized = this.next() / 0x100000000;
    return min + normalized * (max - min);
  }

  /**
   * Generate boolean with given probability (0-1).
   */
  nextBool(probability: number): boolean {
    return this.nextFloat(0, 1) < probability;
  }

  /**
   * Get current RNG state.
   */
  getState(): RngState {
    return { ...this.state };
  }

  /**
   * Set RNG state (for save/load).
   */
  setState(state: RngState): void {
    this.state = { ...state };
  }
}
