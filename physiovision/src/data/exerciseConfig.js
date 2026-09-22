// Exercise configuration — physiotherapist-defined parameters
// These are DEMO defaults. In production, a licensed physiotherapist defines these.

export const EXERCISES = {
  lying_leg_raise: {
    id: 'lying_leg_raise',
    name: 'Leg Raise',
    description: 'Strengthens hip flexors and lower abdominals while lying flat.',
    cameraInstructions:
      'Position the camera to your side so your shoulder, hip, knee, and ankle are all visible in profile.',
    requiredLandmarks: ['shoulder', 'hip', 'knee', 'ankle'],
    // Joint angle measured: Hip flexion angle (Shoulder → Hip → Knee)
    jointDescription: 'Hip flexion angle (Shoulder → Hip → Knee)',
    defaults: {
      minTargetAngle: 45,  // degrees — minimum acceptable ROM
      maxTargetAngle: 75,  // degrees — maximum acceptable ROM
      repGoal: 10,
    },
    thresholds: {
      restAngle: 20,          // angle below which = REST (leg on ground)
      hysteresisFrames: 5,
      smoothingAlpha: 0.3,
      minRepDurationMs: 1500,
      minPeakHoldFrames: 3,
    },
    positioningSteps: [
      'Lie flat on your back on a firm, comfortable surface (mat or bed).',
      'Keep your non-exercising leg flat or bent at the knee — whichever is more comfortable.',
      'Place your arms relaxed at your sides, palms facing down.',
      'Position the camera directly to your side so your shoulder, hip, knee, and ankle are all visible.',
      'Ensure the room is well-lit and your full side profile is in frame.',
    ],
    movementSteps: [
      'Keep your exercising leg straight (knee locked).',
      'Slowly raise your leg upward until you reach the target angle (45°–75° from the floor).',
      'Pause briefly at the top — hold for 1–2 seconds.',
      'Slowly lower your leg back down to the starting position in a controlled manner.',
      'Rest for a moment, then repeat for the prescribed number of repetitions.',
    ],
  },

  wrist_flexion: {
    id: 'wrist_flexion',
    name: 'Wrist Flexion',
    description: 'Rehabilitates wrist flexor muscles. Forearm rests on a table, hand curls upward.',
    cameraInstructions:
      'Rest your forearm flat on a table. Position the camera at table level to your side so your elbow, wrist, and fingers are all visible in profile.',
    requiredLandmarks: ['elbow', 'wrist', 'index_finger'],
    // Joint angle: Elbow → Wrist → Index Finger Tip
    // REST ≈ 170° (hand flat), PEAK ≈ 110–150° (hand curled upward)
    jointDescription: 'Wrist flexion angle (Elbow → Wrist → Index Finger Tip)',
    defaults: {
      minTargetAngle: 110,
      maxTargetAngle: 150,
      repGoal: 10,
    },
    thresholds: {
      restAngle: 160,         // angle above which = REST (hand flat)
      hysteresisFrames: 4,
      smoothingAlpha: 0.3,
      minRepDurationMs: 1200,
      minPeakHoldFrames: 3,
    },
    positioningSteps: [
      'Sit upright at a table on a firm chair with back support.',
      'Rest your forearm flat on the table surface, palm facing upward.',
      'Let your hand hang slightly over the edge of the table so it can move freely.',
      'Position the camera at table level directly to your side so your elbow, wrist, and fingers are all visible.',
      'Keep your forearm still throughout — only your hand and wrist should move.',
    ],
    movementSteps: [
      'Start with your hand in the resting flat position (palm facing up, hand relaxed).',
      'Slowly curl your hand upward (toward the ceiling) by flexing your wrist.',
      'Aim to reach the target flexion angle (110°–150°) — pause briefly at the top.',
      'Hold for 1–2 seconds at the top of the movement.',
      'Slowly lower your hand back to the flat resting position in a controlled manner.',
      'Rest briefly, then repeat for the prescribed number of repetitions.',
    ],
  },
};

export const DEFAULT_EXERCISE_ID = 'lying_leg_raise';

export const VISIBILITY_THRESHOLDS = {
  high: 0.70,    // > 0.70 → HIGH confidence
  medium: 0.45,  // > 0.45 → MEDIUM confidence
  // < 0.45 → LOW confidence / invisible
};

export const LANDMARK_NAMES = {
  // MediaPipe PoseLandmarker indices — lower body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  // Arms & wrist
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_INDEX: 19,   // Index finger tip
  RIGHT_INDEX: 20,
};
