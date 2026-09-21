/**
 * exerciseStateMachine.js
 * Rule-based state machine for exercise phase detection.
 *
 * Supports two movement modes:
 *  - 'raise' (default): REST at low angle, PEAK at high angle (e.g. Leg Raise)
 *  - 'lower': REST at high angle, PEAK at low angle (e.g. Wrist Flexion — resting flat)
 *
 * States: REST → RAISING → PEAK → LOWERING → REST (→ REP_COMPLETE)
 */

export const ExercisePhase = {
  REST: 'REST',
  RAISING: 'RAISING',
  PEAK: 'PEAK',
  LOWERING: 'LOWERING',
  UNKNOWN: 'UNKNOWN',
};

const HYSTERESIS_FRAMES = 6;
const MIN_REP_DURATION_MS = 1500;
const MIN_PEAK_FRAMES = 4;

/**
 * Create a fresh state machine instance.
 * @param {Object} config
 * @param {number} config.restAngle - Angle that defines REST position
 * @param {number} config.minTargetAngle - Lower bound of target range
 * @param {number} config.maxTargetAngle - Upper bound of target range
 * @param {'raise'|'lower'} [config.mode='raise'] - Movement direction
 */
export function createStateMachine(config) {
  const { restAngle, minTargetAngle, maxTargetAngle, mode = 'raise' } = config;
  return {
    phase: ExercisePhase.REST,
    restPendingCount: 0,
    peakFrames: 0,
    maxPeakAngle: 0,
    minPeakAngle: 999,
    lastRepTimestamp: 0,
    hasValidPeak: false,
    restAngle,
    minTargetAngle,
    maxTargetAngle,
    mode,
  };
}

/**
 * Update the state machine with a new smoothed angle reading.
 * Handles both 'raise' (leg raise) and 'lower' (wrist flexion) modes.
 *
 * @param {Object} sm        - State machine (mutated in place)
 * @param {number} angle     - Current smoothed angle (degrees)
 * @param {number} timestamp - Current timestamp (ms)
 * @returns {{ repCompleted: boolean, formGood: boolean|null, repPeakAngle: number|null }}
 */
export function updateStateMachine(sm, angle, timestamp) {
  if (sm.mode === 'lower') {
    return _updateLower(sm, angle, timestamp);
  }
  return _updateRaise(sm, angle, timestamp);
}

// ─── 'raise' mode (Leg Raise) ────────────────────────────────────────────────
// REST at low angle, PEAK at high angle

function _updateRaise(sm, angle, timestamp) {
  let repCompleted = false;
  let formGood = null;
  let repPeakAngle = null;

  switch (sm.phase) {
    case ExercisePhase.REST:
      sm.restPendingCount = 0;
      if (angle > sm.restAngle) {
        sm.phase = ExercisePhase.RAISING;
        sm.maxPeakAngle = 0;
        sm.peakFrames = 0;
        sm.hasValidPeak = false;
      }
      break;

    case ExercisePhase.RAISING:
      if (angle <= sm.restAngle) {
        sm.phase = ExercisePhase.REST;
      } else if (angle >= sm.minTargetAngle) {
        sm.phase = ExercisePhase.PEAK;
        sm.peakFrames = 0;
      }
      break;

    case ExercisePhase.PEAK:
      if (angle > sm.maxPeakAngle) sm.maxPeakAngle = angle;
      sm.peakFrames++;
      if (sm.peakFrames >= MIN_PEAK_FRAMES) sm.hasValidPeak = true;
      if (angle < sm.minTargetAngle * 0.85) {
        sm.phase = ExercisePhase.LOWERING;
      }
      break;

    case ExercisePhase.LOWERING:
      if (angle >= sm.minTargetAngle) { sm.phase = ExercisePhase.PEAK; break; }
      if (angle <= sm.restAngle) {
        sm.restPendingCount++;
        if (sm.restPendingCount >= HYSTERESIS_FRAMES) {
          sm.phase = ExercisePhase.REST;
          sm.restPendingCount = 0;
          if (sm.hasValidPeak && timestamp - sm.lastRepTimestamp >= MIN_REP_DURATION_MS) {
            repCompleted = true;
            repPeakAngle = sm.maxPeakAngle;
            formGood = sm.maxPeakAngle >= sm.minTargetAngle && sm.maxPeakAngle <= sm.maxTargetAngle + 10;
            sm.lastRepTimestamp = timestamp;
          }
          sm.hasValidPeak = false;
          sm.maxPeakAngle = 0;
          sm.peakFrames = 0;
        }
      } else {
        sm.restPendingCount = 0;
      }
      break;

    default:
      sm.phase = ExercisePhase.REST;
  }

  return { repCompleted, formGood, repPeakAngle };
}

// ─── 'lower' mode (Wrist Flexion) ────────────────────────────────────────────
// REST at HIGH angle (hand flat ~170°), PEAK at LOW angle (hand curled ~110-150°)
// The motion is: REST (high) → LOWERING (going toward lower angles) → PEAK (low) → RAISING (returning) → REST

function _updateLower(sm, angle, timestamp) {
  let repCompleted = false;
  let formGood = null;
  let repPeakAngle = null;

  switch (sm.phase) {
    case ExercisePhase.REST:
      sm.restPendingCount = 0;
      if (angle < sm.restAngle) {
        // Starting to flex (angle decreasing from rest)
        sm.phase = ExercisePhase.RAISING; // "RAISING" = moving toward peak (even though angle decreases)
        sm.minPeakAngle = 999;
        sm.peakFrames = 0;
        sm.hasValidPeak = false;
      }
      break;

    case ExercisePhase.RAISING: // moving toward lower angle (curling)
      if (angle >= sm.restAngle) {
        sm.phase = ExercisePhase.REST;
      } else if (angle <= sm.maxTargetAngle) {
        sm.phase = ExercisePhase.PEAK;
        sm.peakFrames = 0;
      }
      break;

    case ExercisePhase.PEAK:
      if (angle < sm.minPeakAngle) sm.minPeakAngle = angle;
      sm.peakFrames++;
      if (sm.peakFrames >= MIN_PEAK_FRAMES) sm.hasValidPeak = true;
      // Transition to lowering when angle rises back above peak zone
      if (angle > sm.maxTargetAngle * 1.05) {
        sm.phase = ExercisePhase.LOWERING;
      }
      break;

    case ExercisePhase.LOWERING: // returning toward rest (angle increasing)
      if (angle <= sm.maxTargetAngle) { sm.phase = ExercisePhase.PEAK; break; }
      if (angle >= sm.restAngle) {
        sm.restPendingCount++;
        if (sm.restPendingCount >= HYSTERESIS_FRAMES) {
          sm.phase = ExercisePhase.REST;
          sm.restPendingCount = 0;
          if (sm.hasValidPeak && timestamp - sm.lastRepTimestamp >= MIN_REP_DURATION_MS) {
            repCompleted = true;
            repPeakAngle = sm.minPeakAngle;
            formGood = sm.minPeakAngle >= sm.minTargetAngle && sm.minPeakAngle <= sm.maxTargetAngle;
            sm.lastRepTimestamp = timestamp;
          }
          sm.hasValidPeak = false;
          sm.minPeakAngle = 999;
          sm.peakFrames = 0;
        }
      } else {
        sm.restPendingCount = 0;
      }
      break;

    default:
      sm.phase = ExercisePhase.REST;
  }

  return { repCompleted, formGood, repPeakAngle };
}
