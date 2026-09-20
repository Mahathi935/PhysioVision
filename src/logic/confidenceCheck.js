/**
 * confidenceCheck.js
 * Checks landmark visibility/confidence and determines overall tracking quality.
 * SAFETY CRITICAL: Low confidence = no form evaluation.
 */

import { VISIBILITY_THRESHOLDS } from '../data/exerciseConfig';

/**
 * Visibility levels for a single landmark
 */
export const VisibilityLevel = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  ABSENT: 'ABSENT',
};

/**
 * Overall session confidence
 */
export const ConfidenceLevel = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Get visibility level for a single landmark.
 * @param {Object} lm - MediaPipe landmark with .visibility property
 * @returns {string} VisibilityLevel
 */
export function getLandmarkVisibility(lm) {
  if (!lm || lm.visibility === undefined) return VisibilityLevel.ABSENT;
  const v = lm.visibility;
  if (v >= VISIBILITY_THRESHOLDS.high) return VisibilityLevel.HIGH;
  if (v >= VISIBILITY_THRESHOLDS.medium) return VisibilityLevel.MEDIUM;
  return VisibilityLevel.LOW;
}

/**
 * Check all required landmarks for an exercise side.
 * Returns per-landmark status and overall confidence.
 *
 * @param {Object} landmarks - { shoulder, hip, knee, ankle } — each a MediaPipe landmark or null
 * @returns {{ statuses, overallConfidence, allVisible, message }}
 */
export function checkLandmarkConfidence(landmarks) {
  const { shoulder, hip, knee, ankle } = landmarks;

  const statuses = {
    shoulder: getLandmarkVisibility(shoulder),
    hip: getLandmarkVisibility(hip),
    knee: getLandmarkVisibility(knee),
    ankle: getLandmarkVisibility(ankle),
  };

  const levels = Object.values(statuses);

  const hasAbsent = levels.some((l) => l === VisibilityLevel.ABSENT);
  const hasLow = levels.some((l) => l === VisibilityLevel.LOW);
  const hasMedium = levels.some((l) => l === VisibilityLevel.MEDIUM);
  const allHigh = levels.every((l) => l === VisibilityLevel.HIGH);

  const allVisible = !hasAbsent && !hasLow;

  let overallConfidence;
  let message;

  if (allHigh) {
    overallConfidence = ConfidenceLevel.HIGH;
    message = 'Patient detected. All required landmarks visible.';
  } else if (!hasAbsent && !hasLow) {
    overallConfidence = ConfidenceLevel.HIGH;
    message = 'Patient detected. Required landmarks visible.';
  } else if (!hasAbsent && hasMedium) {
    overallConfidence = ConfidenceLevel.MEDIUM;
    message = 'Landmarks partially visible. Please ensure full body is in frame.';
  } else {
    overallConfidence = ConfidenceLevel.LOW;

    // Provide specific repositioning guidance
    const missing = Object.entries(statuses)
      .filter(([, v]) => v === VisibilityLevel.LOW || v === VisibilityLevel.ABSENT)
      .map(([k]) => k);

    if (missing.includes('ankle') || missing.includes('knee')) {
      message = 'Please move the camera so your knee and ankle are visible.';
    } else if (missing.includes('shoulder')) {
      message = 'Please move farther from the camera so your shoulder is visible.';
    } else {
      message = 'Required landmarks not visible. Please reposition.';
    }
  }

  return { statuses, overallConfidence, allVisible, message };
}

/**
 * Returns true if confidence is sufficient for form evaluation.
 */
export function canEvaluateForm(overallConfidence) {
  return overallConfidence === ConfidenceLevel.HIGH;
}
