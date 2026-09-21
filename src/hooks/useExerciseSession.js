/**
 * useExerciseSession.js
 * Core session management hook.
 *
 * Integrates:
 * - Landmark processing (poseAnalysis) — dispatched by exerciseId
 * - Confidence checking (confidenceCheck)
 * - Angle calculation (angleCalculation)
 * - State machine (exerciseStateMachine) — raise or lower mode
 * - Feedback generation (feedbackEngine)
 * - Demo mode simulation
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { detectBestSideForExercise, isPersonDetected as checkPersonDetected } from '../logic/poseAnalysis';
import { checkLandmarkConfidenceByKeys, ConfidenceLevel } from '../logic/confidenceCheck';
import { calculateAngle, ema } from '../logic/angleCalculation';
import {
  createStateMachine,
  updateStateMachine,
  ExercisePhase,
} from '../logic/exerciseStateMachine';
import { generateFeedback } from '../logic/feedbackEngine';
import { EXERCISES, DEFAULT_EXERCISE_ID } from '../data/exerciseConfig';

const SMOOTHING_ALPHA = 0.3;
const DEMO_PERIOD_MS = 4000;

export function useExerciseSession({ config, isActive, isDemoMode }) {
  const {
    exerciseId = DEFAULT_EXERCISE_ID,
    minTargetAngle = 45,
    maxTargetAngle = 75,
    repGoal = 10,
  } = config || {};

  const exerciseDef = EXERCISES[exerciseId] || EXERCISES[DEFAULT_EXERCISE_ID];
  // 'lower' mode for wrist (rest at high angle), 'raise' for leg raise
  const smMode = exerciseId === 'wrist_flexion' ? 'lower' : 'raise';

  // Session state
  const [repCount, setRepCount] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [angle, setAngle] = useState(smMode === 'lower' ? 170 : 0);
  const [smoothedAngle, setSmoothedAngle] = useState(smMode === 'lower' ? 170 : 0);
  const [phase, setPhase] = useState(ExercisePhase.REST);
  const [confidence, setConfidence] = useState(ConfidenceLevel.LOW);
  const [confidenceDetails, setConfidenceDetails] = useState(null);
  const [isPersonVisible, setIsPersonVisible] = useState(false);
  const [activeSide, setActiveSide] = useState('left');
  const [feedback, setFeedback] = useState({
    message: smMode === 'lower'
      ? 'Rest your forearm on the table, then curl your hand upward.'
      : 'Position yourself so your full side is visible.',
    type: 'info',
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [repHistory, setRepHistory] = useState([]);
  const [formStatus, setFormStatus] = useState('READY');

  // Refs for mutable values used in callbacks without stale closures
  const smRef = useRef(null);
  const smoothedAngleRef = useRef(smMode === 'lower' ? 170 : 0);
  const prevAngleRef = useRef(smMode === 'lower' ? 170 : 0);
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
      mode: smMode,
    });
    // Reset session
    const initAngle = smMode === 'lower' ? 170 : 0;
    setRepCount(0);
    setGoodReps(0);
    setRepHistory([]);
    setPhase(ExercisePhase.REST);
    repCountRef.current = 0;
    goodRepsRef.current = 0;
    repHistoryRef.current = [];
    smoothedAngleRef.current = initAngle;
    prevAngleRef.current = initAngle;
    setAngle(initAngle);
    setSmoothedAngle(initAngle);

    if (isActive && !sessionStartRef.current) {
      sessionStartRef.current = Date.now();
      setSessionStartTime(Date.now());
    }
  }, [exerciseId, minTargetAngle, maxTargetAngle, isActive, smMode]);

  // Process a raw angle from either real landmarks or demo mode
  const processAngle = useCallback((rawAngle) => {
    const sa = ema(smoothedAngleRef.current, rawAngle, SMOOTHING_ALPHA);
    smoothedAngleRef.current = sa;

    const speed = sa - prevAngleRef.current;
    prevAngleRef.current = sa;

    setSmoothedAngle(Math.round(sa * 10) / 10);
    setAngle(Math.round(sa));

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

    const fb = generateFeedback({
      confidence: ConfidenceLevel.HIGH,
      phase: smRef.current.phase,
      angle: sa,
      minTarget: minTargetAngle,
      maxTarget: maxTargetAngle,
      repCount: repCountRef.current,
      repGoal,
      lastRepGood: formGood,
      movementSpeed: speed,
      exerciseId,
    });
    setFeedback(fb);
  }, [minTargetAngle, maxTargetAngle, repGoal, exerciseId]);

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

    const best = detectBestSideForExercise(landmarks, exerciseId);
    if (!best) return;
    setActiveSide(best.side);

    const check = checkLandmarkConfidenceByKeys(best.landmarks);
    setConfidenceDetails(check);
    setConfidence(check.overallConfidence);

    if (check.overallConfidence === ConfidenceLevel.LOW) {
      setFormStatus('PAUSED');
      setFeedback({ message: check.message, type: 'pause' });
      return;
    }

    if (check.overallConfidence === ConfidenceLevel.MEDIUM) {
      setFeedback({ message: check.message, type: 'warning' });
    }

    // Calculate angle based on exercise type
    let rawAngle;
    if (exerciseId === 'wrist_flexion') {
      const { elbow, wrist, index_finger } = best.landmarks;
      if (!elbow || !wrist || !index_finger) return;
      rawAngle = calculateAngle(
        { x: elbow.x, y: elbow.y },
        { x: wrist.x, y: wrist.y },
        { x: index_finger.x, y: index_finger.y }
      );
    } else {
      const { shoulder, hip, knee } = best.landmarks;
      if (!shoulder || !hip || !knee) return;
      rawAngle = calculateAngle(
        { x: shoulder.x, y: shoulder.y },
        { x: hip.x, y: hip.y },
        { x: knee.x, y: knee.y }
      );
    }

    processAngle(rawAngle);
  }, [isActive, isDemoMode, exerciseId, processAngle]);

  // Demo mode simulation
  useEffect(() => {
    if (!isDemoMode || !isActive) {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      return;
    }

    setIsPersonVisible(true);
    setConfidence(ConfidenceLevel.HIGH);

    let startTime = Date.now();

    // For wrist: oscillate from restAngle down to midpoint of target range
    const isLowerMode = smMode === 'lower';
    const restAngle = exerciseDef.thresholds.restAngle;
    const midTarget = (minTargetAngle + maxTargetAngle) / 2;
    const DEMO_REST = isLowerMode ? restAngle : 0;
    const DEMO_PEAK = isLowerMode ? midTarget : midTarget;

    const tick = () => {
      const t = (Date.now() - startTime) / DEMO_PERIOD_MS;
      const sineVal = Math.max(0, Math.sin(t * Math.PI * 2));

      let raw;
      if (isLowerMode) {
        // Oscillate from restAngle DOWN to midTarget and back
        raw = DEMO_REST - (DEMO_REST - DEMO_PEAK) * sineVal;
      } else {
        raw = DEMO_REST + (DEMO_PEAK - DEMO_REST) * sineVal;
      }
      processAngle(raw);
    };

    demoTimerRef.current = setInterval(tick, 50);

    return () => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
    };
  }, [isDemoMode, isActive, processAngle, minTargetAngle, maxTargetAngle, smMode, exerciseDef]);

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
      exerciseId,
      exerciseName: exerciseDef.name,
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
  }, [exerciseId, exerciseDef, repGoal, minTargetAngle, maxTargetAngle]);

  const isComplete = repCount >= repGoal && repGoal > 0;

  return {
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
    isComplete,
    processLandmarks,
    getSessionData,
  };
}
