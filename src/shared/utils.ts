// src/shared/utils.ts

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Format a copper amount as gold/silver/copper.
 * 1 gold = 100 silver = 10,000 copper.
 */
export function formatGold(copper: number): string {
  if (copper === 0) return "0c";

  const gold = Math.floor(copper / 10000);
  const silver = Math.floor((copper % 10000) / 100);
  const remaining = copper % 100;

  const parts: string[] = [];
  if (gold > 0) parts.push(`${gold}g`);
  if (silver > 0) parts.push(`${silver}s`);
  if (remaining > 0 || parts.length === 0) parts.push(`${remaining}c`);

  return parts.join(" ");
}

/**
 * Format seconds into a human-readable duration.
 * Shows the two most significant units.
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds !== 1 ? "s" : ""}`;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    if (hours > 0) return `${days} day${days !== 1 ? "s" : ""}, ${hours} hour${hours !== 1 ? "s" : ""}`;
    return `${days} day${days !== 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    if (minutes > 0) return `${hours} hour${hours !== 1 ? "s" : ""}, ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    return `${hours} hour${hours !== 1 ? "s" : ""}`;
  }
  if (secs > 0) return `${minutes} minute${minutes !== 1 ? "s" : ""}, ${secs} second${secs !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

/** Format a number with comma separators (e.g., 1,234,567). */
export function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}
