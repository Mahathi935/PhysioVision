/**
 * poseAnalysis.js
 * Extracts named landmarks from MediaPipe PoseLandmarker results.
 * Auto-detects which side (left/right) has better overall confidence.
 * Supports both leg-raise and wrist-flexion exercise modes.
 */

import { LANDMARK_NAMES } from '../data/exerciseConfig';

// ─── Leg Raise Landmarks ────────────────────────────────────────────────────

/**
 * Extract left and right landmark pairs for leg-raise exercise.
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

// ─── Wrist Flexion Landmarks ────────────────────────────────────────────────

/**
 * Extract left and right landmark pairs for wrist-flexion exercise.
 * @param {Array} landmarks - Array of 33 MediaPipe landmarks
 * @returns {{ left, right }} — each with { elbow, wrist, index_finger }
 */
export function extractWristLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const left = {
    elbow: landmarks[LANDMARK_NAMES.LEFT_ELBOW],
    wrist: landmarks[LANDMARK_NAMES.LEFT_WRIST],
    index_finger: landmarks[LANDMARK_NAMES.LEFT_INDEX],
  };

  const right = {
    elbow: landmarks[LANDMARK_NAMES.RIGHT_ELBOW],
    wrist: landmarks[LANDMARK_NAMES.RIGHT_WRIST],
    index_finger: landmarks[LANDMARK_NAMES.RIGHT_INDEX],
  };

  return { left, right };
}

// ─── Shared Utilities ────────────────────────────────────────────────────────

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
 * Auto-detect the best side (left/right) given a landmark extractor.
 * @param {Array} landmarks - Raw MediaPipe landmark array
 * @param {Function} extractFn - extractSideLandmarks | extractWristLandmarks
 * @returns {{ side: 'left'|'right', landmarks: Object } | null}
 */
function detectBestSideWith(landmarks, extractFn) {
  const sides = extractFn(landmarks);
  if (!sides) return null;

  const leftScore = averageVisibility(sides.left);
  const rightScore = averageVisibility(sides.right);

  const side = leftScore >= rightScore ? 'left' : 'right';
  return { side, landmarks: sides[side] };
}

/**
 * Auto-detect the best side for leg-raise tracking.
 */
export function detectBestSide(landmarks) {
  return detectBestSideWith(landmarks, extractSideLandmarks);
}

/**
 * Auto-detect the best side for wrist-flexion tracking.
 */
export function detectBestWristSide(landmarks) {
  return detectBestSideWith(landmarks, extractWristLandmarks);
}

/**
 * Dispatch to the correct side-detector based on exercise ID.
 * @param {Array} landmarks
 * @param {string} exerciseId - e.g. 'lying_leg_raise' | 'wrist_flexion'
 */
export function detectBestSideForExercise(landmarks, exerciseId) {
  if (exerciseId === 'wrist_flexion') return detectBestWristSide(landmarks);
  return detectBestSide(landmarks);
}

/**
 * Check if a person is detected at all (any hip landmark with reasonable visibility).
 */
export function isPersonDetected(landmarks) {
  if (!landmarks || landmarks.length === 0) return false;
  const leftHip = landmarks[LANDMARK_NAMES.LEFT_HIP];
  const rightHip = landmarks[LANDMARK_NAMES.RIGHT_HIP];
  // For wrist exercises, also accept elbow visibility as proof of presence
  const leftElbow = landmarks[LANDMARK_NAMES.LEFT_ELBOW];
  const rightElbow = landmarks[LANDMARK_NAMES.RIGHT_ELBOW];
  return (
    (leftHip && leftHip.visibility > 0.3) ||
    (rightHip && rightHip.visibility > 0.3) ||
    (leftElbow && leftElbow.visibility > 0.5) ||
    (rightElbow && rightElbow.visibility > 0.5)
  );
}
