/**
 * feedbackEngine.js
 * Rule-based feedback message generator.
 *
 * IMPORTANT SAFETY RULES:
 * - Never give form feedback when confidence is LOW
 * - Never make medical diagnoses or injury claims
 * - Keep messages short, clear, and non-alarming
 */

import { ConfidenceLevel } from './confidenceCheck';
import { ExercisePhase } from './exerciseStateMachine';

/**
 * Generate a live feedback message based on current session state.
 *
 * @param {Object} params
 * @param {string} params.confidence - ConfidenceLevel
 * @param {string} params.phase - ExercisePhase
 * @param {number} params.angle - Current smoothed angle
 * @param {number} params.minTarget - Min target angle
 * @param {number} params.maxTarget - Max target angle
 * @param {number} params.repCount - Current rep count
 * @param {number} params.repGoal - Target rep count
 * @param {boolean} params.lastRepGood - Whether last rep was within target
 * @param {number} params.movementSpeed - Angle change per frame (degrees/frame)
 * @returns {{ message: string, type: 'info'|'success'|'warning'|'pause' }}
 */
export function generateFeedback({
  confidence,
  phase,
  angle,
  minTarget,
  maxTarget,
  repCount,
  repGoal,
  lastRepGood,
  movementSpeed = 0,
}) {
  // SAFETY: Low confidence always pauses evaluation
  if (confidence === ConfidenceLevel.LOW) {
    return {
      message: 'Movement evaluation paused. Please ensure all landmarks are visible.',
      type: 'pause',
    };
  }

  if (confidence === ConfidenceLevel.MEDIUM) {
    return {
      message: 'Tracking quality reduced. Try to stay within the camera frame.',
      type: 'warning',
    };
  }

  // Rep goal reached
  if (repCount >= repGoal) {
    return {
      message: `Exercise complete! ${repCount} repetitions finished. Well done.`,
      type: 'success',
    };
  }

  // Phase-specific feedback
  switch (phase) {
    case ExercisePhase.REST:
      if (repCount === 0) {
        return {
          message: 'Ready. Slowly raise your leg when ready.',
          type: 'info',
        };
      }
      return {
        message: `${repCount} rep${repCount > 1 ? 's' : ''} done. Rest briefly, then raise again.`,
        type: 'info',
      };

    case ExercisePhase.RAISING: {
      // Check movement speed — if too fast, warn
      if (movementSpeed > 8) {
        return {
          message: 'Slow down and control the movement as you raise.',
          type: 'warning',
        };
      }
      return {
        message: 'Good. Keep raising your leg steadily.',
        type: 'info',
      };
    }

    case ExercisePhase.PEAK: {
      if (angle < minTarget) {
        return {
          message: `Try raising your leg slightly further — target is ${minTarget}°–${maxTarget}°.`,
          type: 'warning',
        };
      }
      if (angle > maxTarget + 10) {
        return {
          message: 'Good height. No need to go higher — hold briefly.',
          type: 'info',
        };
      }
      return {
        message: `Good range at ${Math.round(angle)}°. Hold briefly then lower slowly.`,
        type: 'success',
      };
    }

    case ExercisePhase.LOWERING: {
      if (movementSpeed < -8) {
        return {
          message: 'Slow down. Lower your leg in a controlled manner.',
          type: 'warning',
        };
      }
      return {
        message: 'Good. Lower your leg slowly and with control.',
        type: 'info',
      };
    }

    default:
      return {
        message: 'Tracking your movement…',
        type: 'info',
      };
  }
}

/**
 * Generate session summary feedback bullets.
 * @param {Object} sessionData
 * @returns {string[]} Array of feedback bullet strings
 */
export function generateSummaryFeedback({ repCount, repGoal, goodReps, avgAngle, minTarget, maxTarget }) {
  const bullets = [];

  if (repCount === 0) {
    bullets.push('No repetitions were recorded in this session.');
    return bullets;
  }

  const completionRate = repCount / repGoal;
  if (completionRate >= 1) {
    bullets.push(`All ${repGoal} target repetitions completed.`);
  } else if (completionRate >= 0.7) {
    bullets.push(`${repCount} of ${repGoal} target repetitions completed.`);
  } else {
    bullets.push(`${repCount} repetitions completed — consider building toward ${repGoal}.`);
  }

  const goodRate = repCount > 0 ? goodReps / repCount : 0;
  if (goodRate >= 0.8) {
    bullets.push('Good consistency across repetitions.');
  } else if (goodRate >= 0.5) {
    bullets.push(`${repCount - goodReps} repetition${repCount - goodReps !== 1 ? 's' : ''} did not reach the configured target range.`);
  } else {
    bullets.push('Most repetitions were below the configured target range. Try raising the leg further.');
  }

  if (avgAngle > 0) {
    if (avgAngle < minTarget) {
      bullets.push('Average angle was below the target range. Focus on full range of motion.');
    } else if (avgAngle > maxTarget + 15) {
      bullets.push('Average angle was above the typical target range — ensure controlled movement.');
    } else {
      bullets.push('Maintain controlled movement speed throughout each repetition.');
    }
  }

  return bullets;
}
