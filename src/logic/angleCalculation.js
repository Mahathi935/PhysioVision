/**
 * angleCalculation.js
 * Pure geometric utilities for computing joint angles from landmark coordinates.
 * Uses vector dot-product formula — no dependency on screen pixel positions.
 */

/**
 * Calculate the angle (in degrees) at vertex B, formed by points A-B-C.
 * Works with any coordinate space (normalized 0-1 or pixel).
 *
 * @param {Object} A - Point {x, y} — one end of the angle
 * @param {Object} B - Point {x, y} — the vertex (joint being measured)
 * @param {Object} C - Point {x, y} — other end of the angle
 * @returns {number} Angle in degrees [0, 180]
 */
export function calculateAngle(A, B, C) {
  const BA = { x: A.x - B.x, y: A.y - B.y };
  const BC = { x: C.x - B.x, y: C.y - B.y };

  const dot = BA.x * BC.x + BA.y * BC.y;
  const magBA = Math.sqrt(BA.x ** 2 + BA.y ** 2);
  const magBC = Math.sqrt(BC.x ** 2 + BC.y ** 2);

  if (magBA === 0 || magBC === 0) return 0;

  // Clamp to [-1, 1] to avoid floating point errors in acos
  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Exponential Moving Average smoothing.
 * @param {number} previous - Previous smoothed value
 * @param {number} current  - New raw measurement
 * @param {number} alpha    - Smoothing factor (0 = no smoothing, 1 = no memory)
 * @returns {number} Smoothed value
 */
export function ema(previous, current, alpha = 0.3) {
  if (previous === null || previous === undefined) return current;
  return alpha * current + (1 - alpha) * previous;
}

/**
 * Returns the direction of change between two angle values.
 * @returns {'increasing' | 'decreasing' | 'stable'}
 */
export function angleDirection(prev, current, deadband = 2) {
  const diff = current - prev;
  if (Math.abs(diff) < deadband) return 'stable';
  return diff > 0 ? 'increasing' : 'decreasing';
}
