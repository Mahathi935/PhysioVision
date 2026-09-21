/**
 * CameraCheck.jsx — Step 3 of 3: camera calibration
 *
 * Runs AFTER the guidelines page. Verifies the person and all required landmarks
 * are visible (with spoken repositioning guidance), then "Start Exercise" goes
 * straight to the live session — there is no countdown.
 */

import { useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiChevronLeft, FiRefreshCw, FiAlertTriangle, FiPlay } from 'react-icons/fi';
import { useMediaPipe, MediaPipeStatus } from '../hooks/useMediaPipe';
import { detectBestSideForExercise, isPersonDetected } from '../logic/poseAnalysis';
import { checkLandmarkConfidenceByKeys, VisibilityLevel, ConfidenceLevel } from '../logic/confidenceCheck';
import { useSpokenFeedback, useVoicePreference } from '../hooks/useSpokenFeedback';
import CameraView from '../components/CameraView';
import VoiceToggle from '../components/VoiceToggle';

function LandmarkStatusRow({ name, level }) {
  const isVisible = level === VisibilityLevel.HIGH || level === VisibilityLevel.MEDIUM;
  const isHigh = level === VisibilityLevel.HIGH;

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-500 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${
          isHigh ? 'bg-accent-400' : isVisible ? 'bg-yellow-400' : 'bg-red-400'
        }`} />
        <span className="text-sm text-text-primary capitalize font-medium">
          {name.replace('_', ' ')}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {isHigh ? (
          <>
            <FiCheck className="w-4 h-4 text-accent-400" />
            <span className="text-xs text-accent-400 font-medium">Visible</span>
          </>
        ) : isVisible ? (
          <>
            <FiAlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-yellow-400 font-medium">Low</span>
          </>
        ) : (
          <>
            <FiX className="w-4 h-4 text-red-400" />
            <span className="text-xs text-red-400 font-medium">Not visible</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function CameraCheck({ config }) {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [landmarks, setLandmarks] = useState(null);
  const [confidenceData, setConfidenceData] = useState(null);
  const [activeSide, setActiveSide] = useState('left');
  const [personDetected, setPersonDetected] = useState(false);

  const exerciseId = config?.exerciseId || 'lying_leg_raise';
  const exerciseName = config?.exerciseName || 'Exercise';

  // Determine which landmark labels to show in the checklist
  const landmarkLabels = exerciseId === 'wrist_flexion'
    ? ['elbow', 'wrist', 'index_finger']
    : ['shoulder', 'hip', 'knee', 'ankle'];

  const handleLandmarks = useCallback((lms) => {
    setLandmarks(lms);

    if (!lms || !isPersonDetected(lms)) {
      setPersonDetected(false);
      setConfidenceData(null);
      return;
    }

    setPersonDetected(true);
    const best = detectBestSideForExercise(lms, exerciseId);
    if (best) {
      setActiveSide(best.side);
      setConfidenceData(checkLandmarkConfidenceByKeys(best.landmarks));
    }
  }, [exerciseId]);

  const { status, error, isDemoMode, activateDemoMode, reinitialize } = useMediaPipe({
    videoRef,
    enabled: true,
    onLandmarks: handleLandmarks,
  });

  const isReady =
    confidenceData?.overallConfidence === ConfidenceLevel.HIGH && personDetected;

  // ── Voice guidance ───────────────────────────────────────────────────────
  // Read the repositioning hints aloud so they can be followed from a distance.
  const [voiceEnabled, setVoiceEnabled] = useVoicePreference();

  let voiceFeedback = null;
  if (status === MediaPipeStatus.RUNNING && !isDemoMode) {
    if (!personDetected) {
      voiceFeedback = { message: 'I cannot see you. Please step into the camera frame.', type: 'warning' };
    } else if (isReady) {
      voiceFeedback = { message: 'Position confirmed. You are ready to start the exercise.', type: 'success' };
    } else {
      voiceFeedback = { message: confidenceData?.message || 'Please adjust your position.', type: 'warning' };
    }
  }
  useSpokenFeedback(voiceFeedback, { enabled: voiceEnabled });

  // ── Status info ──────────────────────────────────────────────────────────
  const statusInfo = (() => {
    if (status === MediaPipeStatus.LOADING_MODEL) {
      return {
        label: 'LOADING',
        message: 'Loading pose detection model…',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
      };
    }
    if (status === MediaPipeStatus.REQUESTING_CAMERA) {
      return {
        label: 'CAMERA',
        message: 'Requesting camera access…',
        color: 'text-blue-400',
        bg: 'bg-blue-500/10 border-blue-500/20',
      };
    }
    if (status === MediaPipeStatus.ERROR) {
      return {
        label: 'ERROR',
        message: error || 'Camera initialization failed.',
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20',
      };
    }
    if (isDemoMode) {
      return {
        label: 'DEMO MODE',
        message: 'Demo mode active — skipping camera check.',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/10 border-yellow-500/20',
      };
    }
    if (!personDetected) {
      return {
        label: 'SCANNING',
        message: 'Looking for a person. Please step into frame.',
        color: 'text-text-muted',
        bg: 'bg-surface-600 border-surface-500',
      };
    }
    if (isReady) {
      return {
        label: 'READY',
        message: confidenceData?.message || 'All required landmarks visible.',
        color: 'text-accent-400',
        bg: 'bg-accent-500/10 border-accent-500/20',
      };
    }
    return {
      label: 'REPOSITION',
      message: confidenceData?.message || 'Please adjust your position.',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
    };
  })();

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in">

        <button
          onClick={() => navigate('/instructions')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Guidelines
        </button>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <span className="section-label block mb-2">Step 3 of 3 — Calibration</span>
            <h1 className="text-3xl font-bold text-text-primary">Camera Check</h1>
            <p className="text-text-secondary mt-2">
              Position yourself as described in the guidelines and follow the spoken hints until all landmarks are
              visible, then start the exercise.
            </p>
          </div>
          <VoiceToggle enabled={voiceEnabled} onToggle={() => setVoiceEnabled(!voiceEnabled)} className="flex-shrink-0" />
        </div>

        <div className="grid md:grid-cols-5 gap-5">

          {/* Camera feed — 3/5 width */}
          <div className="md:col-span-3 relative">
            <CameraView
              videoRef={videoRef}
              landmarks={landmarks}
              activeSide={activeSide}
              angle={null}
              className="w-full"
              demoMode={isDemoMode}
            />

            {/* Status message */}
            <div className={`mt-3 p-3 rounded-xl border ${statusInfo.bg} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isReady ? 'bg-accent-400' :
                status === MediaPipeStatus.ERROR ? 'bg-red-400' :
                'bg-yellow-400 animate-pulse'
              }`} />
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
                <p className="text-sm text-text-secondary mt-0.5">{statusInfo.message}</p>
              </div>
            </div>

            {/* Error actions */}
            {status === MediaPipeStatus.ERROR && (
              <div className="mt-3 flex gap-3">
                <button onClick={reinitialize} className="btn-secondary flex items-center gap-2 text-sm flex-1">
                  <FiRefreshCw className="w-4 h-4" />
                  Retry Camera
                </button>
                <button onClick={activateDemoMode} className="btn-secondary flex items-center gap-2 text-sm flex-1 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10">
                  Use Demo Mode
                </button>
              </div>
            )}
          </div>

          {/* Landmark checklist — 2/5 width */}
          <div className="md:col-span-2 space-y-4">

            {/* Exercise badge */}
            <div className="card p-3 flex items-center gap-3">
              <div className="w-7 h-7 bg-accent-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <FiPlay className="w-3.5 h-3.5 text-accent-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Selected Exercise</p>
                <p className="text-sm font-semibold text-text-primary">{exerciseName}</p>
              </div>
            </div>

            {/* Person detected */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="section-label">Person Detection</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  personDetected ? 'bg-accent-500/20' : 'bg-surface-600'
                }`}>
                  {personDetected
                    ? <FiCheck className="w-4 h-4 text-accent-400" />
                    : <FiX className="w-4 h-4 text-text-muted" />
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {personDetected ? 'Person detected' : 'No person detected'}
                  </p>
                  {personDetected && (
                    <p className="text-xs text-text-muted capitalize">
                      Tracking {activeSide} side
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Landmark statuses */}
            <div className="card p-4">
              <span className="section-label block mb-3">Required Landmarks</span>
              {landmarkLabels.map((name) => (
                <LandmarkStatusRow
                  key={name}
                  name={name}
                  level={confidenceData?.statuses?.[name] || VisibilityLevel.ABSENT}
                />
              ))}
            </div>

            {/* Confidence */}
            <div className="card p-4">
              <span className="section-label block mb-2">Overall Confidence</span>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                confidenceData?.overallConfidence === ConfidenceLevel.HIGH
                  ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                  : confidenceData?.overallConfidence === ConfidenceLevel.MEDIUM
                  ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                  : 'bg-surface-600 text-text-muted border border-surface-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  confidenceData?.overallConfidence === ConfidenceLevel.HIGH ? 'bg-accent-400' :
                  confidenceData?.overallConfidence === ConfidenceLevel.MEDIUM ? 'bg-yellow-400' :
                  'bg-surface-400'
                }`} />
                {confidenceData?.overallConfidence || 'LOW'}
              </div>
            </div>

            {/* Start button — goes straight to the live session (no countdown) */}
            <button
              onClick={() => navigate('/session')}
              disabled={!isReady && !isDemoMode}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FiPlay className="w-4 h-4" />
              {isDemoMode ? 'Start (Demo Mode)' : 'Start Exercise →'}
            </button>

            {!isReady && !isDemoMode && status === MediaPipeStatus.RUNNING && (
              <p className="text-xs text-text-muted text-center">
                Adjust camera until all landmarks show as visible
              </p>
            )}

            {isReady && (
              <p className="text-xs text-accent-400/80 text-center">
                ✓ Position confirmed — click Start Exercise to begin
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
