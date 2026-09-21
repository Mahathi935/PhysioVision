/**
 * CameraCheck.jsx — Camera and landmark visibility check with auto-calibration countdown
 *
 * When the user clicks "Start Exercise →" a 5-second countdown overlay appears
 * so they can get into position. The session starts automatically at 0.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheck, FiX, FiChevronLeft, FiRefreshCw, FiAlertTriangle, FiPlay } from 'react-icons/fi';
import { useMediaPipe, MediaPipeStatus } from '../hooks/useMediaPipe';
import { detectBestSideForExercise, isPersonDetected } from '../logic/poseAnalysis';
import { checkLandmarkConfidenceByKeys, VisibilityLevel, ConfidenceLevel } from '../logic/confidenceCheck';
import CameraView from '../components/CameraView';

const COUNTDOWN_SECONDS = 5;

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

  // Countdown state
  const [countdown, setCountdown] = useState(null); // null = not started
  const countdownRef = useRef(null);

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

  // ── Countdown logic ──────────────────────────────────────────────────────
  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
  }, []);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  }, []);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      navigate('/instructions');
      return;
    }

    countdownRef.current = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(countdownRef.current);
  }, [countdown, navigate]);

  // Cancel countdown on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') cancelCountdown(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cancelCountdown]);

  // ── Status info ──────────────────────────────────────────────────────────
  const statusInfo = (() => {
    if (countdown !== null) {
      return {
        label: 'GET READY',
        message: `Starting in ${countdown}s — get into position!`,
        color: 'text-accent-400',
        bg: 'bg-accent-500/10 border-accent-500/20',
      };
    }
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
          onClick={() => navigate('/setup')}
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back to Setup
        </button>

        <div className="mb-6">
          <span className="section-label block mb-2">Step 2 of 3</span>
          <h1 className="text-3xl font-bold text-text-primary">Camera Check</h1>
          <p className="text-text-secondary mt-2">
            Verify all required landmarks are visible, then the session starts automatically after a countdown.
          </p>
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

            {/* Countdown overlay */}
            {countdown !== null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl">
                <p className="text-white/80 text-sm font-medium mb-2 uppercase tracking-wider">
                  Starting {exerciseName}
                </p>
                <div className="text-8xl font-bold text-accent-400 tabular-nums leading-none drop-shadow-lg">
                  {countdown === 0 ? 'GO!' : countdown}
                </div>
                <p className="text-white/60 text-xs mt-4">Get into position</p>
                <button
                  onClick={cancelCountdown}
                  className="mt-4 text-xs text-white/50 hover:text-white/80 transition-colors underline"
                >
                  Cancel (Esc)
                </button>
              </div>
            )}

            {/* Status message */}
            <div className={`mt-3 p-3 rounded-xl border ${statusInfo.bg} flex items-center gap-3`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                countdown !== null ? 'bg-accent-400 animate-pulse' :
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

            {/* Start button — triggers countdown */}
            {countdown === null ? (
              <button
                onClick={() => {
                  if (isReady || isDemoMode) startCountdown();
                }}
                disabled={!isReady && !isDemoMode}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <FiPlay className="w-4 h-4" />
                {isDemoMode ? 'Start (Demo Mode)' : 'Start Exercise →'}
              </button>
            ) : (
              <button
                onClick={cancelCountdown}
                className="btn-secondary w-full flex items-center justify-center gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Cancel Countdown
              </button>
            )}

            {!isReady && !isDemoMode && status === MediaPipeStatus.RUNNING && countdown === null && (
              <p className="text-xs text-text-muted text-center">
                Adjust camera until all landmarks show as visible
              </p>
            )}

            {isReady && countdown === null && (
              <p className="text-xs text-accent-400/80 text-center">
                ✓ Position confirmed — click Start to begin the {COUNTDOWN_SECONDS}s countdown
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
