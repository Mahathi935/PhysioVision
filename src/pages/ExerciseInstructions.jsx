/**
 * ExerciseInstructions.jsx — Pre-exercise positioning & movement guide
 *
 * Step 2 of 3 — shown right after setup and BEFORE camera calibration.
 * Explains how to position and perform the exercise; the user then calibrates
 * the camera (step 3) and starts the exercise from there.
 */

import { useNavigate } from 'react-router-dom';
import { FiChevronLeft, FiCamera, FiTarget, FiUser } from 'react-icons/fi';
import { EXERCISES, DEFAULT_EXERCISE_ID } from '../data/exerciseConfig';

export default function ExerciseInstructions({ config }) {
  const navigate = useNavigate();

  const exerciseId = config?.exerciseId || DEFAULT_EXERCISE_ID;
  const exercise = EXERCISES[exerciseId] || EXERCISES[DEFAULT_EXERCISE_ID];
  const minTarget = config?.minTargetAngle ?? exercise.defaults.minTargetAngle;
  const maxTarget = config?.maxTargetAngle ?? exercise.defaults.maxTargetAngle;
  const repGoal = config?.repGoal ?? exercise.defaults.repGoal;

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/setup')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Setup
        </button>

        <div className="mb-6">
          <span className="section-label block mb-2">Step 2 of 3 — Guidelines</span>
          <h1 className="text-3xl font-bold text-text-primary">{exercise.name}</h1>
          <p className="text-text-secondary mt-2 leading-relaxed">{exercise.description}</p>
        </div>

        {/* Session parameters summary */}
        <div className="card p-4 mb-6 flex items-center gap-6 flex-wrap">
          <div>
            <p className="section-label text-[10px] mb-0.5">Target Range</p>
            <p className="font-bold text-accent-400">{minTarget}° – {maxTarget}°</p>
          </div>
          <div className="w-px h-8 bg-surface-500" />
          <div>
            <p className="section-label text-[10px] mb-0.5">Rep Goal</p>
            <p className="font-bold text-text-primary">{repGoal} reps</p>
          </div>
          <div className="w-px h-8 bg-surface-500" />
          <div>
            <p className="section-label text-[10px] mb-0.5">Tracked Joint</p>
            <p className="font-bold text-text-primary text-xs">{exercise.jointDescription}</p>
          </div>
        </div>

        {/* Positioning instructions */}
        <div className="card p-6 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-accent-500/15 rounded-lg flex items-center justify-center">
              <FiUser className="w-4 h-4 text-accent-400" />
            </div>
            <h2 className="font-semibold text-text-primary">How to Position Yourself</h2>
          </div>
          <ol className="space-y-3">
            {exercise.positioningSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-600 border border-surface-400
                                 flex items-center justify-center text-xs font-bold text-accent-400">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Movement instructions */}
        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center">
              <FiTarget className="w-4 h-4 text-green-400" />
            </div>
            <h2 className="font-semibold text-text-primary">How to Perform the Exercise</h2>
          </div>
          <ol className="space-y-3">
            {exercise.movementSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-600 border border-green-500/30
                                 flex items-center justify-center text-xs font-bold text-green-400">
                  {i + 1}
                </span>
                <p className="text-sm text-text-secondary leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Safety reminder */}
        <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-xl mb-6">
          <p className="text-xs text-yellow-200/70 leading-relaxed">
            <span className="font-semibold text-yellow-300">Safety: </span>
            Stop immediately if you feel sharp pain or discomfort. This app monitors movement only —
            it does not replace advice from your physiotherapist.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/camera-check')}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        >
          <FiCamera className="w-5 h-5" />
          I've Read the Guidelines — Calibrate Camera →
        </button>

      </div>
    </div>
  );
}
