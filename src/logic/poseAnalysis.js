/**
 * poseAnalysis.js
 * Extracts named landmarks from MediaPipe PoseLandmarker results.
 * Auto-detects which side (left/right) has better overall confidence.
 */

import { LANDMARK_NAMES } from '../data/exerciseConfig';

/**
 * Extract left and right landmark pairs from MediaPipe result.
 * @param {Array} landmarks - Array of 33 MediaPipe landmarks
 * @returns {{ left, right }} — each with { shoulder, hip, knee, ankle }
 */
export function extractSideLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;

  const left = {
    shoulder: landmarks[LANDMARK_NAMES.LEFT_SHOULDER],
    hip: landmarks[LANDMARK_NAMES.LEFT_HIP],
    knee: landmarks[LANDMARK_NAMES.LEFT_KNEE],
    ankle: landmarks[LANDMARK_NAMES.LEFT_ANKLE],
  };

  const right = {
    shoulder: landmarks[LANDMARK_NAMES.RIGHT_SHOULDER],
    hip: landmarks[LANDMARK_NAMES.RIGHT_HIP],
    knee: landmarks[LANDMARK_NAMES.RIGHT_KNEE],
    ankle: landmarks[LANDMARK_NAMES.RIGHT_ANKLE],
  };

  return { left, right };
}

/**
 * Calculate average visibility for a set of landmarks.
 */
function averageVisibility(side) {
  const vals = Object.values(side)
    .filter((lm) => lm && lm.visibility !== undefined)
    .map((lm) => lm.visibility);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/**
 * Auto-detect the best side to track based on landmark confidence.
 * @returns {{ side: 'left'|'right', landmarks: { shoulder, hip, knee, ankle } }}
 */
export function detectBestSide(landmarks) {
  const sides = extractSideLandmarks(landmarks);
  if (!sides) return null;

  const leftScore = averageVisibility(sides.left);
  const rightScore = averageVisibility(sides.right);

  const side = leftScore >= rightScore ? 'left' : 'right';
  return { side, landmarks: sides[side] };
}

/**
 * Check if a person is detected at all (any landmark with reasonable visibility).
 */
export function isPersonDetected(landmarks) {
  if (!landmarks || landmarks.length === 0) return false;
  // Check if any hip landmark has decent visibility
  const leftHip = landmarks[LANDMARK_NAMES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_NAMES.RIGHT_HIP];
  return (
    (leftHip && leftHip.visibility > 0.3) ||
    (rightHip && rightHip.visibility > 0.3)
  );
}
