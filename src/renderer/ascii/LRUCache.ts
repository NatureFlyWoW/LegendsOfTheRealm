/**
 * A generic Least-Recently-Used (LRU) cache.
 *
 * Uses Map insertion order for LRU tracking — delete-then-reinsert
 * promotes a key to most-recently-used position.
 */
export class LRUCache<K, V> {
  private readonly capacity: number;
  private readonly map: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = Math.max(1, capacity);
    this.map = new Map();
  }

  /** Returns the value for the key, or undefined if not present. Promotes key to MRU. */
  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined && !this.map.has(key)) {
      return undefined;
    }
    // Promote to MRU: delete and re-insert
    this.map.delete(key);
    this.map.set(key, value as V);
    return value;
  }

  /** Inserts or updates an entry. Evicts the LRU entry if at capacity. */
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      // Delete first so re-insert moves it to MRU position
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict the least-recently-used entry (first key in iteration order)
      const lruKey = this.map.keys().next().value as K;
      this.map.delete(lruKey);
    }
    this.map.set(key, value);
  }

  /** Current number of entries in the cache. */
  get size(): number {
    return this.map.size;
  }

  /** Removes all entries from the cache. */
  clear(): void {
    this.map.clear();
  }
}
