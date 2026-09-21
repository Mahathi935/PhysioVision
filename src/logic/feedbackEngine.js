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
 * @param {string} [params.exerciseId='lying_leg_raise'] - Exercise identifier for context-aware messages
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
  exerciseId = 'lying_leg_raise',
}) {
  const isWrist = exerciseId === 'wrist_flexion';

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

  // Phase-specific feedback — wrist flexion vs leg raise
  switch (phase) {
    case ExercisePhase.REST:
      if (repCount === 0) {
        return {
          message: isWrist
            ? 'Rest your hand flat on the table, then curl upward when ready.'
            : 'Ready. Slowly raise your leg when ready.',
          type: 'info',
        };
      }
      return {
        message: isWrist
          ? `${repCount} rep${repCount > 1 ? 's' : ''} done. Rest briefly, then curl again.`
          : `${repCount} rep${repCount > 1 ? 's' : ''} done. Rest briefly, then raise again.`,
        type: 'info',
      };

    case ExercisePhase.RAISING: {
      // For wrist: RAISING = curling toward peak (angle decreasing)
      if (isWrist) {
        if (movementSpeed < -8) {
          return {
            message: 'Slow down — curl your wrist in a smooth, controlled motion.',
            type: 'warning',
          };
        }
        return {
          message: 'Good. Keep curling your wrist upward steadily.',
          type: 'info',
        };
      }
      // Leg raise
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
      if (isWrist) {
        if (angle > maxTarget) {
          return {
            message: `Try curling your wrist a little further — target is ${minTarget}°–${maxTarget}°.`,
            type: 'warning',
          };
        }
        if (angle < minTarget - 10) {
          return {
            message: 'Good curl. No need to go further — hold briefly.',
            type: 'info',
          };
        }
        return {
          message: `Good wrist flexion at ${Math.round(angle)}°. Hold briefly then return slowly.`,
          type: 'success',
        };
      }
      // Leg raise
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
      // For wrist: LOWERING = returning hand to flat position (angle increasing)
      if (isWrist) {
        if (movementSpeed > 8) {
          return {
            message: 'Slow down. Return your hand to the flat position in a controlled manner.',
            type: 'warning',
          };
        }
        return {
          message: 'Good. Slowly return your hand to the resting position.',
          type: 'info',
        };
      }
      // Leg raise
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
 * @param {string} [sessionData.exerciseId='lying_leg_raise']
 * @returns {string[]} Array of feedback bullet strings
 */
export function generateSummaryFeedback({ repCount, repGoal, goodReps, avgAngle, minTarget, maxTarget, exerciseId = 'lying_leg_raise' }) {
  const isWrist = exerciseId === 'wrist_flexion';
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
    bullets.push(isWrist
      ? 'Most repetitions did not reach the target wrist flexion range. Try curling your hand further.'
      : 'Most repetitions were below the configured target range. Try raising the leg further.');
  }

  if (avgAngle > 0) {
    if (isWrist) {
      if (avgAngle > maxTarget) {
        bullets.push('Average wrist angle was above the target range. Aim for a deeper curl.');
      } else if (avgAngle < minTarget - 15) {
        bullets.push('Average wrist angle was well within the target range — well controlled.');
      } else {
        bullets.push('Maintain a smooth, controlled curl and return motion each repetition.');
      }
    } else {
      if (avgAngle < minTarget) {
        bullets.push('Average angle was below the target range. Focus on full range of motion.');
      } else if (avgAngle > maxTarget + 15) {
        bullets.push('Average angle was above the typical target range — ensure controlled movement.');
      } else {
        bullets.push('Maintain controlled movement speed throughout each repetition.');
      }
    }
  }

  return bullets;
}
