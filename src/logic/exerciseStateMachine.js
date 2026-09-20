/**
 * exerciseStateMachine.js
 * Rule-based state machine for Lying Leg Raise exercise phase detection.
 *
 * States: REST → RAISING → PEAK → LOWERING → REST (→ REP_COMPLETE)
 *
 * Key design principles:
 * - Hysteresis buffers prevent jitter-induced false transitions
 * - Rep debounce prevents double-counting
 * - Requires full valid cycle (REST→PEAK→REST) to count rep
 */

export const ExercisePhase = {
  REST: 'REST',
  RAISING: 'RAISING',
  PEAK: 'PEAK',
  LOWERING: 'LOWERING',
  UNKNOWN: 'UNKNOWN',
};

const HYSTERESIS_FRAMES = 6;      // frames required to confirm REST transition
const MIN_REP_DURATION_MS = 1500; // minimum ms between rep completions
const MIN_PEAK_FRAMES = 4;        // frames at peak range before we call it "valid"

/**
 * Create a fresh state machine instance.
 */
export function createStateMachine(config) {
  const { restAngle, minTargetAngle, maxTargetAngle } = config;
  return {
    phase: ExercisePhase.REST,
    // Hysteresis buffer for REST transitions only (prevent premature REST)
    restPendingCount: 0,
    // Peak tracking
    peakFrames: 0,
    maxPeakAngle: 0,      // highest angle seen in this rep's peak phase
    lastRepTimestamp: 0,
    hasValidPeak: false,  // true once peak held long enough
    // Config
    restAngle,
    minTargetAngle,
    maxTargetAngle,
  };
}

/**
 * Update the state machine with a new smoothed angle reading.
 *
 * @param {Object} sm        - State machine (mutated in place)
 * @param {number} angle     - Current smoothed hip-flexion angle (degrees)
 * @param {number} timestamp - Current timestamp (ms)
 * @returns {{ repCompleted: boolean, formGood: boolean|null, repPeakAngle: number|null }}
 */
export function updateStateMachine(sm, angle, timestamp) {
  let repCompleted = false;
  let formGood = null;
  let repPeakAngle = null;

  const prev = sm.phase;

  switch (sm.phase) {
    case ExercisePhase.REST:
      sm.restPendingCount = 0; // clear when in rest
      if (angle > sm.restAngle) {
        // Start rising
        sm.phase = ExercisePhase.RAISING;
        sm.maxPeakAngle = 0;
        sm.peakFrames = 0;
        sm.hasValidPeak = false;
      }
      break;

    case ExercisePhase.RAISING:
      if (angle <= sm.restAngle) {
        // Dropped back to rest without reaching target — just reset
        sm.phase = ExercisePhase.REST;
      } else if (angle >= sm.minTargetAngle) {
        // Entered target range — transition to PEAK
        sm.phase = ExercisePhase.PEAK;
        sm.peakFrames = 0;
      }
      break;

    case ExercisePhase.PEAK:
      // Track the maximum angle seen during this peak
      if (angle > sm.maxPeakAngle) sm.maxPeakAngle = angle;
      sm.peakFrames++;

      // Validate after holding for enough frames
      if (sm.peakFrames >= MIN_PEAK_FRAMES) {
        sm.hasValidPeak = true;
      }

      // Transition to lowering when angle drops below a hysteresis threshold
      if (angle < sm.minTargetAngle * 0.85) {
        sm.phase = ExercisePhase.LOWERING;
      }
      break;

    case ExercisePhase.LOWERING:
      // Track if we somehow go back up (don't count as new rep)
      if (angle >= sm.minTargetAngle) {
        // Went back up — back to PEAK
        sm.phase = ExercisePhase.PEAK;
        break;
      }

      if (angle <= sm.restAngle) {
        // Hysteresis: require several frames at rest before confirming
        sm.restPendingCount++;
        if (sm.restPendingCount >= HYSTERESIS_FRAMES) {
          sm.phase = ExercisePhase.REST;
          sm.restPendingCount = 0;

          // Count rep if we had a valid peak and enough time has passed
          if (
            sm.hasValidPeak &&
            timestamp - sm.lastRepTimestamp >= MIN_REP_DURATION_MS
          ) {
            repCompleted = true;
            repPeakAngle = sm.maxPeakAngle;
            formGood =
              sm.maxPeakAngle >= sm.minTargetAngle &&
              sm.maxPeakAngle <= sm.maxTargetAngle + 10;
            sm.lastRepTimestamp = timestamp;
          }

          // Reset for next rep
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
