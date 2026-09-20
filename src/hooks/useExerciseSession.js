/**
 * useExerciseSession.js
 * Core session management hook.
 *
 * Integrates:
 * - Landmark processing (poseAnalysis)
 * - Confidence checking (confidenceCheck)
 * - Angle calculation (angleCalculation)
 * - State machine (exerciseStateMachine)
 * - Feedback generation (feedbackEngine)
 * - Demo mode simulation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectBestSide, isPersonDetected as checkPersonDetected } from '../logic/poseAnalysis';
import { checkLandmarkConfidence, ConfidenceLevel } from '../logic/confidenceCheck';
import { calculateAngle, ema } from '../logic/angleCalculation';
import {
  createStateMachine,
  updateStateMachine,
  ExercisePhase,
} from '../logic/exerciseStateMachine';
import { generateFeedback } from '../logic/feedbackEngine';
import { EXERCISES, DEFAULT_EXERCISE_ID } from '../data/exerciseConfig';

const SMOOTHING_ALPHA = 0.3;
const DEMO_PERIOD_MS = 4000; // one rep cycle in demo mode

export function useExerciseSession({ config, isActive, isDemoMode }) {
  const { minTargetAngle = 45, maxTargetAngle = 75, repGoal = 10 } = config || {};

  const exerciseDef = EXERCISES[DEFAULT_EXERCISE_ID];

  // Session state
  const [repCount, setRepCount] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [angle, setAngle] = useState(0);
  const [smoothedAngle, setSmoothedAngle] = useState(0);
  const [phase, setPhase] = useState(ExercisePhase.REST);
  const [confidence, setConfidence] = useState(ConfidenceLevel.LOW);
  const [confidenceDetails, setConfidenceDetails] = useState(null);
  const [isPersonVisible, setIsPersonVisible] = useState(false);
  const [activeSide, setActiveSide] = useState('left');
  const [feedback, setFeedback] = useState({ message: 'Position yourself so your full side is visible.', type: 'info' });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [repHistory, setRepHistory] = useState([]); // { peakAngle, good }[]
  const [formStatus, setFormStatus] = useState('READY');

  // Refs for mutable values used in callbacks without stale closures
  const smRef = useRef(null);
  const smoothedAngleRef = useRef(0);
  const prevAngleRef = useRef(0);
  const repCountRef = useRef(0);
  const goodRepsRef = useRef(0);
  const repHistoryRef = useRef([]);
  const demoTimerRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Initialize state machine
  useEffect(() => {
    smRef.current = createStateMachine({
      restAngle: exerciseDef.thresholds.restAngle,
      minTargetAngle,
      maxTargetAngle,
    });
    // Reset session
    setRepCount(0);
    setGoodReps(0);
    setRepHistory([]);
    setPhase(ExercisePhase.REST);
    repCountRef.current = 0;
    goodRepsRef.current = 0;
    repHistoryRef.current = [];
    smoothedAngleRef.current = 0;

    if (isActive && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
      setSessionStartTime(Date.now());
    }
  }, [minTargetAngle, maxTargetAngle, isActive]);

  // Process a raw angle from either real landmarks or demo mode
  const processAngle = useCallback((rawAngle) => {
    // Smooth angle
    const sa = ema(smoothedAngleRef.current, rawAngle, SMOOTHING_ALPHA);
    smoothedAngleRef.current = sa;

    const speed = sa - prevAngleRef.current;
    prevAngleRef.current = sa;

    setSmoothedAngle(Math.round(sa * 10) / 10);
    setAngle(Math.round(sa));

    // Update state machine
    if (!smRef.current) return;
    const { repCompleted, formGood, repPeakAngle } = updateStateMachine(
      smRef.current,
      sa,
      Date.now()
    );

    setPhase(smRef.current.phase);

    if (repCompleted) {
      repCountRef.current += 1;
      setRepCount(repCountRef.current);

      if (formGood) {
        goodRepsRef.current += 1;
        setGoodReps(goodRepsRef.current);
      }

      repHistoryRef.current.push({ peakAngle: repPeakAngle || sa, good: !!formGood });
      setRepHistory([...repHistoryRef.current]);
      setFormStatus(formGood ? 'GOOD' : 'IMPROVE');
    }

    // Generate feedback
    const fb = generateFeedback({
      confidence: ConfidenceLevel.HIGH,  // called only when confidence is high
      phase: smRef.current.phase,
      angle: sa,
      minTarget: minTargetAngle,
      maxTarget: maxTargetAngle,
      repCount: repCountRef.current,
      repGoal,
      lastRepGood: formGood,
      movementSpeed: speed,
    });
    setFeedback(fb);
  }, [minTargetAngle, maxTargetAngle, repGoal]);

  // Real landmark processing
  const processLandmarks = useCallback((landmarks) => {
    if (!isActive || isDemoMode) return;

    if (!landmarks || !checkPersonDetected(landmarks)) {
      setIsPersonVisible(false);
      setConfidence(ConfidenceLevel.LOW);
      setFeedback({
        message: 'No person detected. Please step into the camera frame.',
        type: 'pause',
      });
      return;
    }

    setIsPersonVisible(true);

    // Auto-detect best side
    const best = detectBestSide(landmarks);
    if (!best) return;
    setActiveSide(best.side);

    // Check confidence
    const check = checkLandmarkConfidence(best.landmarks);
    setConfidenceDetails(check);
    setConfidence(check.overallConfidence);

    if (check.overallConfidence === ConfidenceLevel.LOW) {
      setFormStatus('PAUSED');
      setFeedback({ message: check.message, type: 'pause' });
      return;
    }

    if (check.overallConfidence === ConfidenceLevel.MEDIUM) {
      setFeedback({ message: check.message, type: 'warning' });
      // Still process angle at medium confidence but flag it
    }

    // Calculate hip flexion angle: Shoulder → Hip → Knee
    const { shoulder, hip, knee } = best.landmarks;
    if (!shoulder || !hip || !knee) return;

    const rawAngle = calculateAngle(
      { x: shoulder.x, y: shoulder.y },
      { x: hip.x, y: hip.y },
      { x: knee.x, y: knee.y }
    );

    processAngle(rawAngle);
  }, [isActive, isDemoMode, processAngle]);

  // Demo mode simulation: sinusoidal angle matching the state machine
  useEffect(() => {
    if (!isDemoMode || !isActive) {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      return;
    }

    setIsPersonVisible(true);
    setConfidence(ConfidenceLevel.HIGH);

    let startTime = Date.now();

    const DEMO_MIN = 0;
    const DEMO_MAX = (minTargetAngle + maxTargetAngle) / 2;

    const tick = () => {
      const t = (Date.now() - startTime) / DEMO_PERIOD_MS;
      // Sinusoidal: 0 → max → 0 
      const raw = DEMO_MIN + (DEMO_MAX - DEMO_MIN) * Math.max(0, Math.sin(t * Math.PI * 2));
      processAngle(raw);
    };

    demoTimerRef.current = setInterval(tick, 50);

    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, [isDemoMode, isActive, processAngle, minTargetAngle, maxTargetAngle]);

  // Session summary data
  const getSessionData = useCallback(() => {
    const history = repHistoryRef.current;
    const peaks = history.map((r) => r.peakAngle).filter((a) => a > 0);
    const avgAngle = peaks.length > 0 ? peaks.reduce((a, b) => a + b, 0) / peaks.length : 0;
    const maxAngle = peaks.length > 0 ? Math.max(...peaks) : 0;
    const durationSeconds = sessionStartRef.current
      ? Math.floor((Date.now() - sessionStartRef.current) / 1000)
      : 0;

    return {
      repCount: repCountRef.current,
      repGoal,
      goodReps: goodRepsRef.current,
      avgAngle: Math.round(avgAngle * 10) / 10,
      maxAngle: Math.round(maxAngle * 10) / 10,
      minTarget: minTargetAngle,
      maxTarget: maxTargetAngle,
      durationSeconds,
      repHistory: repHistoryRef.current,
    };
  }, [repGoal, minTargetAngle, maxTargetAngle]);

  return {
    // State
    repCount,
    goodReps,
    angle,
    smoothedAngle,
    phase,
    confidence,
    confidenceDetails,
    isPersonVisible,
    activeSide,
    feedback,
    formStatus,
    repHistory,
    sessionStartTime,
    // Actions
    processLandmarks,
    getSessionData,
  };
}
