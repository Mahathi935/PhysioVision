/**
 * ExerciseSetup.jsx — Exercise configuration page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCamera, FiInfo, FiSliders, FiChevronLeft } from 'react-icons/fi';
import { EXERCISES, DEFAULT_EXERCISE_ID } from '../data/exerciseConfig';

const exercise = EXERCISES[DEFAULT_EXERCISE_ID];

export default function ExerciseSetup({ config, setConfig }) {
  const navigate = useNavigate();

  const [localMin, setLocalMin] = useState(config?.minTargetAngle ?? exercise.defaults.minTargetAngle);
  const [localMax, setLocalMax] = useState(config?.maxTargetAngle ?? exercise.defaults.maxTargetAngle);
  const [localReps, setLocalReps] = useState(config?.repGoal ?? exercise.defaults.repGoal);

  const handleStart = () => {
    setConfig({
      minTargetAngle: localMin,
      maxTargetAngle: localMax,
      repGoal: localReps,
    });
    navigate('/camera-check');
  };

  const resetDefaults = () => {
    setLocalMin(exercise.defaults.minTargetAngle);
    setLocalMax(exercise.defaults.maxTargetAngle);
    setLocalReps(exercise.defaults.repGoal);
  };

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="mb-6">
          <span className="section-label block mb-2">Step 1 of 3</span>
          <h1 className="text-3xl font-bold text-text-primary">Exercise Setup</h1>
          <p className="text-text-secondary mt-2">Configure the parameters defined by your physiotherapist.</p>
        </div>

        {/* Exercise info */}
        <div className="card p-5 mb-5">
          <div className="flex items-start justify-between">
            <div>
              <span className="section-label block mb-1">Selected Exercise</span>
              <h2 className="text-xl font-bold text-text-primary">Lying Leg Raise</h2>
              <p className="text-text-secondary text-sm mt-1">{exercise.jointDescription}</p>
            </div>
            <div className="px-3 py-1 bg-accent-500/10 border border-accent-500/20 rounded-lg">
              <span className="text-accent-400 text-xs font-semibold">Active</span>
            </div>
          </div>
        </div>

        {/* Configuration panel */}
        <div className="card p-6 mb-5">
          <div className="flex items-center gap-2 mb-5">
            <FiSliders className="w-4 h-4 text-accent-400" />
            <h3 className="font-semibold text-text-primary">Physiotherapist-Configured Parameters</h3>
          </div>

          {/* Demo disclaimer */}
          <div className="flex items-start gap-2.5 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
            <FiInfo className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-200/80 text-xs leading-relaxed">
              <strong className="text-blue-300">Demo parameters.</strong> In clinical use, the target range and rep goal are defined by a licensed physiotherapist based on the patient's specific condition, capability, and treatment plan.
            </p>
          </div>

          {/* Min target angle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Minimum Target Angle</label>
              <span className="font-mono font-bold text-accent-400 text-lg">{localMin}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="60"
              value={localMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalMin(v);
                if (v >= localMax) setLocalMax(v + 10);
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-teal-500 bg-surface-500"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>15°</span>
              <span>60°</span>
            </div>
          </div>

          {/* Max target angle */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Maximum Target Angle</label>
              <span className="font-mono font-bold text-accent-400 text-lg">{localMax}°</span>
            </div>
            <input
              type="range"
              min="30"
              max="90"
              value={localMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                setLocalMax(v);
                if (v <= localMin) setLocalMin(v - 10);
              }}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-teal-500 bg-surface-500"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>30°</span>
              <span>90°</span>
            </div>
          </div>

          {/* Target range visualization */}
          <div className="mb-6 p-3 bg-surface-900 rounded-xl border border-surface-500">
            <p className="text-xs text-text-muted mb-2">Target Range Preview</p>
            <div className="relative h-3 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-accent-500/40 border-x-2 border-accent-500 rounded-full transition-all duration-200"
                style={{ left: `${(localMin / 90) * 100}%`, width: `${((localMax - localMin) / 90) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-text-secondary mt-1.5">
              <span>0°</span>
              <span className="text-accent-400 font-medium">{localMin}° – {localMax}°</span>
              <span>90°</span>
            </div>
          </div>

          {/* Rep goal */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-text-primary">Repetition Goal</label>
              <span className="font-mono font-bold text-accent-400 text-lg">{localReps} reps</span>
            </div>
            <div className="flex gap-2">
              {[5, 8, 10, 12, 15].map((n) => (
                <button
                  key={n}
                  onClick={() => setLocalReps(n)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all
                    ${localReps === n
                      ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30'
                      : 'bg-surface-600 text-text-secondary hover:bg-surface-500'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={resetDefaults}
            className="mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Reset to demo defaults
          </button>
        </div>

        {/* Camera instructions */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FiCamera className="w-4 h-4 text-accent-400" />
            <h3 className="font-semibold text-text-primary">Camera Setup</h3>
          </div>
          <ul className="space-y-2 text-sm text-text-secondary">
            <li className="flex items-start gap-2">
              <span className="text-accent-400 mt-0.5">→</span>
              Position the camera to your <strong className="text-text-primary">side</strong> so your entire profile is visible
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400 mt-0.5">→</span>
              Your <strong className="text-text-primary">shoulder, hip, knee, and ankle</strong> must all be in frame
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400 mt-0.5">→</span>
              Lie flat on your back on a mat or firm surface
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent-400 mt-0.5">→</span>
              Ensure the room has adequate lighting
            </li>
          </ul>
        </div>

        <button
          onClick={handleStart}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base"
        >
          <FiCamera className="w-5 h-5" />
          Check Camera →
        </button>

      </div>
    </div>
  );
}
