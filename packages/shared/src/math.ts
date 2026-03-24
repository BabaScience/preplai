/**
 * @preplai/shared — Math Utilities
 *
 * Common math functions used across packages.
 * Avoids duplicated inline implementations of clamp, distance, etc.
 */

/** Clamp a value between min and max (inclusive). */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Euclidean distance between two 2D points. */
export function distance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Linear interpolation between two values. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Standard deviation of a numeric array. Returns 0 for arrays with fewer than 2 elements. */
export function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Mean (arithmetic average) of a numeric array. Returns 0 for empty arrays. */
export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}
