// Exercise configuration — physiotherapist-defined parameters
// These are DEMO defaults. In production, a licensed physiotherapist defines these.

export const EXERCISES = {
  lying_leg_raise: {
    id: 'leg_raise',
    name: 'Leg Raise',
    description: 'Strengthens hip flexors and lower abdominals while lying flat.',
    cameraInstructions:
      'Position the camera to your side so your shoulder, hip, knee, and ankle are all visible in profile.',
    requiredLandmarks: ['shoulder', 'hip', 'knee', 'ankle'],
    // Joint angle measured: Hip flexion angle (Shoulder → Hip → Knee)
    // This measures how much the leg is raised relative to the trunk
    jointDescription: 'Hip flexion angle (Shoulder → Hip → Knee)',
    defaults: {
      minTargetAngle: 45,  // degrees — minimum acceptable ROM
      maxTargetAngle: 75,  // degrees — maximum acceptable ROM
      repGoal: 10,
    },
    // State machine thresholds
    thresholds: {
      restAngle: 20,        // angle below which = REST (leg on ground)
      hysteresisFrames: 5,  // frames required to confirm state transition
      smoothingAlpha: 0.3,  // EMA smoothing factor
      minRepDurationMs: 1500, // minimum ms between rep completions
      minPeakHoldFrames: 3,  // frames must stay near peak to count
    },
  },
};

export const DEFAULT_EXERCISE_ID = 'lying_leg_raise';

export const VISIBILITY_THRESHOLDS = {
  high: 0.70,    // > 0.70 → HIGH confidence
  medium: 0.45,  // > 0.45 → MEDIUM confidence
  // < 0.45 → LOW confidence / invisible
};

export const LANDMARK_NAMES = {
  // MediaPipe PoseLandmarker indices
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
};
