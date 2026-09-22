/**
 * ExerciseSession.jsx — Main live exercise screen (P0 priority)
 *
 * Layout:
 * - Top bar: logo + exercise name + timer + end button
 * - Left/center: large webcam + pose overlay
 * - Right: live stats panel
 * - Bottom: feedback message bar
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStopCircle, FiActivity, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { useMediaPipe, MediaPipeStatus } from '../hooks/useMediaPipe';
import { useExerciseSession } from '../hooks/useExerciseSession';
import { ExercisePhase } from '../logic/exerciseStateMachine';
import { ConfidenceLevel } from '../logic/confidenceCheck';
import { formatDuration, createSessionId } from '../utils/storage';
import { useSpokenFeedback, useVoicePreference, isSpeechSupported } from '../hooks/useSpokenFeedback';
import CameraView from '../components/CameraView';
import VoiceToggle from '../components/VoiceToggle';

const PHASE_LABELS = {
  [ExercisePhase.REST]: 'REST',
  [ExercisePhase.RAISING]: 'RAISING',
  [ExercisePhase.PEAK]: 'AT PEAK',
  [ExercisePhase.LOWERING]: 'LOWERING',
  [ExercisePhase.UNKNOWN]: '—',
};

const PHASE_COLORS = {
  [ExercisePhase.REST]: 'text-text-muted bg-surface-600 border-surface-500',
  [ExercisePhase.RAISING]: 'text-accent-300 bg-accent-500/15 border-accent-500/30',
  [ExercisePhase.PEAK]: 'text-green-300 bg-green-500/15 border-green-500/30',
  [ExercisePhase.LOWERING]: 'text-blue-300 bg-blue-500/15 border-blue-500/30',
  [ExercisePhase.UNKNOWN]: 'text-text-muted bg-surface-600 border-surface-500',
};

const FEEDBACK_BG = {
  success: 'bg-accent-500/15 border-accent-500/30 text-accent-200',
  warning: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-200',
  pause: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-200',
  info: 'bg-surface-600 border-surface-500 text-text-secondary',
};

function StatCard({ label, value, sub, accent = false }) {
  return (
    <div className="card p-4">
      <p className="section-label mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-accent-400' : 'text-text-primary'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

export default function ExerciseSession({ config }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [landmarks, setLandmarks] = useState(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const timerRef = useRef(null);
  const timerStartedRef = useRef(false);
  // One id per exercise session — the summary uses it so the session is stored only once
  const sessionIdRef = useRef(null);
  if (sessionIdRef.current === null) sessionIdRef.current = createSessionId();

  const {
    status,
    error,
    isDemoMode,
    activateDemoMode,
  } = useMediaPipe({
    videoRef,
    enabled: true,
    onLandmarks: setLandmarks,
  });

  const {
    repCount,
    goodReps,
    angle,
    phase,
    confidence,
    confidenceDetails,
    isPersonVisible,
    activeSide,
    feedback,
    formStatus,
    processLandmarks,
    getSessionData,
    isComplete,
  } = useExerciseSession({
    config,
    isActive: sessionActive,
    isDemoMode,
  });

  // Spoken guidance — reads the on-screen feedback aloud (useful when standing away from the screen)
  const [voiceEnabled, setVoiceEnabled] = useVoicePreference();
  const voiceActive = voiceEnabled && isSpeechSupported();
  useSpokenFeedback(feedback, { enabled: voiceEnabled && sessionActive });

  // Auto-stop: when all reps are done, wait then navigate to summary.
  // With voice on, wait a little longer so "Exercise complete…" can be heard.
  const autoStopRef = useRef(null);
  useEffect(() => {
    if (isComplete && sessionActive && !autoStopRef.current) {
      autoStopRef.current = setTimeout(() => {
        handleEndSession();
      }, voiceActive ? 4000 : 1500);
    }
    return () => {
      if (autoStopRef.current) {
        clearTimeout(autoStopRef.current);
        autoStopRef.current = null;
      }
    };
  // handleEndSession is stable via useCallback
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete, sessionActive]);

  // Start the session once the camera is running
  useEffect(() => {
    if (
      (status === MediaPipeStatus.RUNNING || isDemoMode) &&
      !timerStartedRef.current
    ) {
      timerStartedRef.current = true;
      setSessionActive(true);
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, isDemoMode]);

  // Route landmarks to exercise session
  useEffect(() => {
    processLandmarks(landmarks);
  }, [landmarks, processLandmarks]);

  const handleEndSession = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSessionActive(false);
    const data = getSessionData();
    navigate('/summary', {
      state: {
        ...data,
        sessionId: sessionIdRef.current,
        durationSeconds: elapsed,
        demoMode: isDemoMode,
      },
    });
  }, [getSessionData, navigate, elapsed, isDemoMode]);

  const repGoal = config?.repGoal || 10;
  const minTarget = config?.minTargetAngle || 45;
  const maxTarget = config?.maxTargetAngle || 75;
  const repProgress = Math.min(1, repCount / repGoal);

  const isAngleInTarget = angle >= minTarget && angle <= maxTarget;

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">

      {/* Top bar */}
      <div className="bg-surface-800 border-b border-surface-500 px-4 sm:px-6 h-16 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/30">
            <FiActivity className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-xs text-text-muted font-medium uppercase tracking-wider block leading-none">{config?.exerciseName || 'Exercise'}</span>
            <span className="text-text-primary font-semibold text-sm">
              {sessionActive ? 'Session Active' : 'Starting…'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="font-mono text-xl font-bold text-text-primary tabular-nums">
            {formatDuration(elapsed)}
          </div>

          {/* Voice guidance on/off */}
          <VoiceToggle enabled={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} />

          {/* End session */}
          <button
            onClick={handleEndSession}
            className="btn-danger flex items-center gap-2 text-sm"
          >
            <FiStopCircle className="w-4 h-4" />
            End Session
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row gap-4 p-4 overflow-hidden">

        {/* Camera feed - takes most space */}
        <div className="flex-1 flex flex-col min-w-0">
          <CameraView
            videoRef={videoRef}
            landmarks={landmarks}
            activeSide={activeSide}
            angle={sessionActive ? angle : null}
            className="flex-1 min-h-0"
            demoMode={isDemoMode}
          />

          {/* Error state */}
          {status === MediaPipeStatus.ERROR && !isDemoMode && (
            <div className="mt-3 card p-4 border-red-500/20">
              <p className="text-red-400 text-sm font-medium mb-2">{error}</p>
              <button onClick={activateDemoMode} className="btn-secondary text-sm text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10">
                Continue in Demo Mode
              </button>
            </div>
          )}

          {/* Feedback bar */}
          <div className={`mt-3 p-3.5 rounded-xl border transition-all duration-300 feedback-bar ${FEEDBACK_BG[feedback.type] || FEEDBACK_BG.info}`}>
            <p className="text-sm font-medium">{feedback.message}</p>
          </div>
        </div>

        {/* Right stats panel */}
        <div className="md:w-64 flex flex-col gap-3 flex-shrink-0">

          {/* Rep counter — prominent */}
          <div className="card p-5 text-center border-accent-500/20">
            <p className="section-label mb-2">Repetitions</p>
            <div className="flex items-end justify-center gap-1 mb-2">
              <span className="text-5xl font-bold text-accent-400 tabular-nums leading-none">
                {repCount}
              </span>
              <span className="text-xl text-text-muted mb-1">/ {repGoal}</span>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-surface-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 rounded-full transition-all duration-500"
                style={{ width: `${repProgress * 100}%` }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              {goodReps} correct · {repCount - goodReps} improve
            </p>
          </div>

          {/* Current angle */}
          <div className="card p-4">
            <p className="section-label mb-1">Current Angle</p>
            <p className={`text-3xl font-bold tabular-nums ${
              isAngleInTarget ? 'text-accent-400' : 'text-text-primary'
            }`}>
              {angle}°
            </p>
            <div className="flex items-center gap-1 mt-1.5">
              <FiTarget className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-xs text-text-muted">Target: {minTarget}° – {maxTarget}°</span>
            </div>

            {/* Mini angle bar */}
            <div className="mt-2 h-1.5 bg-surface-600 rounded-full overflow-hidden relative">
              {/* Target zone */}
              <div
                className="absolute h-full bg-accent-500/20 border-x border-accent-500/40"
                style={{
                  left: `${(minTarget / 90) * 100}%`,
                  width: `${((maxTarget - minTarget) / 90) * 100}%`,
                }}
              />
              {/* Current angle indicator */}
              <div
                className="absolute h-full w-1 bg-accent-400 rounded-full transition-all duration-100"
                style={{ left: `${Math.min(100, (angle / 90) * 100)}%` }}
              />
            </div>
          </div>

          {/* Movement phase */}
          <div className="card p-4">
            <p className="section-label mb-2">Movement Phase</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold tracking-wider ${PHASE_COLORS[phase]}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${
                phase === ExercisePhase.REST ? 'bg-text-muted' :
                phase === ExercisePhase.PEAK ? 'bg-green-400 animate-pulse' :
                'bg-accent-400 animate-pulse'
              }`} />
              {PHASE_LABELS[phase]}
            </div>
          </div>

          {/* Form status */}
          <div className="card p-4">
            <p className="section-label mb-2">Form Status</p>
            <div className={`text-sm font-bold ${
              formStatus === 'GOOD' ? 'text-accent-400' :
              formStatus === 'IMPROVE' ? 'text-yellow-400' :
              formStatus === 'PAUSED' ? 'text-indigo-400' :
              'text-text-muted'
            }`}>
              {formStatus === 'GOOD' ? '✓ GOOD' :
               formStatus === 'IMPROVE' ? '⚠ IMPROVE' :
               formStatus === 'PAUSED' ? '⏸ PAUSED' :
               '— READY'}
            </div>
          </div>

          {/* Confidence */}
          <div className="card p-4">
            <p className="section-label mb-2">Tracking Confidence</p>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold ${
              confidence === ConfidenceLevel.HIGH
                ? 'text-accent-300 bg-accent-500/10 border-accent-500/30'
                : confidence === ConfidenceLevel.MEDIUM
                ? 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30'
                : 'text-red-300 bg-red-500/10 border-red-500/30'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                confidence === ConfidenceLevel.HIGH ? 'bg-accent-400' :
                confidence === ConfidenceLevel.MEDIUM ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              {confidence}
            </div>
            {isPersonVisible && (
              <p className="text-xs text-text-muted mt-1.5 capitalize">Tracking {activeSide} side</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
