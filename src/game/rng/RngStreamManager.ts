// src/game/rng/RngStreamManager.ts
import type { ISeededRng, RngState } from "@shared/combat-interfaces";
import { SeededRng } from "./SeededRng";

/**
 * Valid RNG domain identifiers for stream isolation
 */
const DOMAINS = ["combat", "loot", "worldEvents", "crafting", "fishing", "offline"] as const;
export type RngDomain = (typeof DOMAINS)[number];

/**
 * Manages independent seeded RNG streams for different game systems.
 * Each domain gets its own RNG stream derived from a master seed,
 * ensuring that randomness in one system doesn't affect another.
 *
 * This is critical for:
 * - Deterministic combat simulation
 * - Reproducible offline progression
 * - Save/load consistency
 * - System independence (loot doesn't affect combat, etc.)
 */
export class RngStreamManager {
  private streams: Map<string, SeededRng> = new Map();

  /**
   * Initialize all RNG streams from a master seed.
   * Each domain gets a unique derived seed for independence.
   */
  constructor(masterSeed: number) {
    const seedGen = new SeededRng(masterSeed);
    for (const domain of DOMAINS) {
      this.streams.set(domain, new SeededRng(seedGen.nextInt(0, 0x7fffffff)));
    }
  }

  /**
   * Get the RNG stream for a specific domain.
   * @throws Error if domain is unknown
   */
  get(domain: string): ISeededRng {
    const stream = this.streams.get(domain);
    if (!stream) {
      throw new Error(`Unknown RNG domain: ${domain}`);
    }
    return stream;
  }

  /**
   * Serialize all stream states for save persistence.
   * Returns a map of domain -> RngState for each stream.
   */
  serialize(): Record<string, RngState> {
    const result: Record<string, RngState> = {};
    for (const [domain, rng] of this.streams) {
      result[domain] = rng.getState();
    }
    return result;
  }

  /**
   * Restore all stream states from serialized data.
   * Used when loading a saved game to continue from exact RNG positions.
   */
  deserialize(data: Record<string, RngState>): void {
    for (const [domain, state] of Object.entries(data)) {
      const rng = this.streams.get(domain);
      if (rng) {
        rng.setState(state);
      }
    }
  }
}
