/**
 * Summary.jsx — Post-session summary page
 */

import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { FiHome, FiClock, FiCheck, FiAlertCircle, FiTrendingUp, FiBarChart2 } from 'react-icons/fi';
import { saveSession, formatDuration } from '../utils/storage';
import { generateSummaryFeedback } from '../logic/feedbackEngine';

export default function Summary() {
  const location = useLocation();
  const navigate = useNavigate();

  const data = location.state;

  // Compute performance level from good rep ratio
  function computePerformanceLevel(goodReps, repCount) {
    if (repCount === 0) return 'N/A';
    const rate = goodReps / repCount;
    if (rate >= 0.8) return 'Excellent';
    if (rate >= 0.5) return 'Good';
    return 'Needs Work';
  }

  // Save session on mount — always saved, tagged by status
  useEffect(() => {
    if (!data || data.repCount === undefined) return;
    const performanceLevel = computePerformanceLevel(data.goodReps, data.repCount);
    saveSession({
      date: new Date().toISOString(),
      exercise: data.exerciseName || 'Exercise',
      exerciseId: data.exerciseId || 'unknown',
      repCount: data.repCount,
      repGoal: data.repGoal,
      goodReps: data.goodReps,
      avgAngle: data.avgAngle,
      maxAngle: data.maxAngle,
      minTarget: data.minTarget,
      maxTarget: data.maxTarget,
      durationSeconds: data.durationSeconds,
      status: data.repCount >= data.repGoal ? 'completed' : 'partial',
      performanceLevel,
      demoMode: data.demoMode || false,
    });
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-surface-800 pt-24 flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No session data available.</p>
          <button onClick={() => navigate('/')} className="btn-primary">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const {
    repCount = 0,
    repGoal = 10,
    goodReps = 0,
    avgAngle = 0,
    maxAngle = 0,
    minTarget = 45,
    maxTarget = 75,
    durationSeconds = 0,
    demoMode = false,
    exerciseId = 'lying_leg_raise',
  } = data;

  const performanceLevel = computePerformanceLevel(goodReps, repCount);
  const completionPct = Math.round((repCount / repGoal) * 100);
  const goodPct = repCount > 0 ? Math.round((goodReps / repCount) * 100) : 0;
  const needsImprovement = repCount - goodReps;
  const isComplete = repCount >= repGoal;

  const feedbackBullets = generateSummaryFeedback({
    repCount,
    repGoal,
    goodReps,
    avgAngle,
    minTarget,
    maxTarget,
    exerciseId,
  });

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isComplete ? 'bg-accent-500/20' : 'bg-yellow-500/20'
          }`}>
            {isComplete
              ? <FiCheck className="w-6 h-6 text-accent-400" />
              : <FiBarChart2 className="w-6 h-6 text-yellow-400" />
            }
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-text-primary">Session Complete</h1>
              {/* Performance level badge */}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                performanceLevel === 'Excellent'
                  ? 'bg-accent-500/15 text-accent-300 border-accent-500/30'
                  : performanceLevel === 'Good'
                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                  : performanceLevel === 'Needs Work'
                  ? 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30'
                  : 'bg-surface-600 text-text-muted border-surface-500'
              }`}>
                {performanceLevel}
              </span>
            </div>
            <p className="text-text-secondary text-sm mt-0.5">
              {isComplete ? 'All repetitions completed.' : `${repCount} of ${repGoal} repetitions completed.`}
            </p>
          </div>
        </div>

        {demoMode && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-yellow-300 text-xs font-medium">⚠ DEMO MODE — Results from simulated movement data</p>
          </div>
        )}

        {/* Exercise info */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="section-label mb-1">Exercise</p>
              <p className="font-semibold text-text-primary">{data.exerciseName || 'Exercise'}</p>
            </div>
            <div className="text-right">
              <p className="section-label mb-1">Duration</p>
              <p className="font-semibold text-text-primary font-mono">{formatDuration(durationSeconds)}</p>
            </div>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">

          {/* Repetitions */}
          <div className="card p-5 col-span-2">
            <p className="section-label mb-3">Repetitions</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-5xl font-bold text-text-primary tabular-nums">{repCount}</span>
              <span className="text-xl text-text-muted mb-1">/ {repGoal}</span>
              <span className={`mb-1 text-sm font-medium ${isComplete ? 'text-accent-400' : 'text-yellow-400'}`}>
                ({completionPct}%)
              </span>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-surface-600 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isComplete ? 'bg-accent-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(100, completionPct)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2.5 p-2.5 bg-accent-500/10 rounded-lg border border-accent-500/20">
                <FiCheck className="w-4 h-4 text-accent-400 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary">{goodReps}</p>
                  <p className="text-xs text-text-muted">Completed correctly</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <FiAlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                <div>
                  <p className="text-lg font-bold text-text-primary">{needsImprovement}</p>
                  <p className="text-xs text-text-muted">Needs improvement</p>
                </div>
              </div>
            </div>
          </div>

          {/* Angles */}
          <div className="card p-5">
            <p className="section-label mb-1">Avg Peak Angle</p>
            <p className="text-3xl font-bold text-accent-400 tabular-nums">
              {avgAngle > 0 ? `${avgAngle}°` : '—'}
            </p>
            <p className="text-xs text-text-muted mt-1">
              {exerciseId === 'wrist_flexion' ? 'Wrist flexion' : 'Hip flexion'}
            </p>
          </div>

          <div className="card p-5">
            <p className="section-label mb-1">Max Detected</p>
            <p className="text-3xl font-bold text-text-primary tabular-nums">
              {maxAngle > 0 ? `${maxAngle}°` : '—'}
            </p>
            <p className="text-xs text-text-muted mt-1">Peak angle</p>
          </div>

          {/* Target range */}
          {(() => {
            // Use the full angle scale for the exercise: 180° for wrist, 90° for leg raise
            const scaleMax = exerciseId === 'wrist_flexion' ? 180 : 90;
            return (
              <div className="card p-5 col-span-2">
                <p className="section-label mb-2">Target Range (Configured)</p>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-accent-400">{minTarget}° – {maxTarget}°</span>
                  <div className="flex-1 h-2 bg-surface-600 rounded-full overflow-hidden relative">
                    <div
                      className="absolute h-full bg-accent-500/30 border-x-2 border-accent-500"
                      style={{
                        left: `${(minTarget / scaleMax) * 100}%`,
                        width: `${((maxTarget - minTarget) / scaleMax) * 100}%`,
                      }}
                    />
                    {avgAngle > 0 && (
                      <div
                        className="absolute h-full w-1 bg-white rounded-full"
                        style={{ left: `${Math.min(100, (avgAngle / scaleMax) * 100)}%` }}
                        title={`Avg: ${avgAngle}°`}
                      />
                    )}
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1.5">
                  White marker = average peak angle ({avgAngle}°)
                </p>
              </div>
            );
          })()}
        </div>

        {/* AI Feedback */}
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FiTrendingUp className="w-4 h-4 text-accent-400" />
            <h3 className="font-semibold text-text-primary">Session Feedback</h3>
          </div>
          <ul className="space-y-2">
            {feedbackBullets.map((bullet, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <span className="text-accent-400 mt-0.5 flex-shrink-0">•</span>
                {bullet}
              </li>
            ))}
          </ul>
          <p className="text-xs text-text-muted mt-3 pt-3 border-t border-surface-500">
            Feedback is based on configured parameters only. Consult your physiotherapist for clinical assessment.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => navigate('/')} className="btn-secondary flex items-center gap-2 flex-1 justify-center">
            <FiHome className="w-4 h-4" />
            Dashboard
          </button>
          <button onClick={() => navigate('/setup')} className="btn-primary flex items-center gap-2 flex-1 justify-center">
            Start Again
          </button>
        </div>

      </div>
    </div>
  );
}
