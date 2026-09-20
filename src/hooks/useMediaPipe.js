/**
 * useMediaPipe.js
 * React hook for MediaPipe PoseLandmarker initialization and frame processing.
 *
 * Handles:
 * - Model loading via CDN WASM
 * - Camera permission and stream setup
 * - Per-frame landmark detection
 * - Graceful error handling and Demo Mode fallback
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

export const MediaPipeStatus = {
  IDLE: 'IDLE',
  LOADING_MODEL: 'LOADING_MODEL',
  REQUESTING_CAMERA: 'REQUESTING_CAMERA',
  RUNNING: 'RUNNING',
  ERROR: 'ERROR',
  DEMO_MODE: 'DEMO_MODE',
};

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

export function useMediaPipe({ videoRef, enabled = false, onLandmarks }) {
  const [status, setStatus] = useState(MediaPipeStatus.IDLE);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const poseLandmarkerRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [videoRef]);

  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const landmarker = poseLandmarkerRef.current;

    if (!video || !landmarker || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const currentTime = video.currentTime;
    if (currentTime === lastVideoTimeRef.current) {
      animFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }
    lastVideoTimeRef.current = currentTime;

    try {
      const result = landmarker.detectForVideo(video, performance.now());
      if (onLandmarks) {
        onLandmarks(result.landmarks?.[0] || null);
      }
    } catch (err) {
      console.warn('Frame detection error:', err);
    }

    animFrameRef.current = requestAnimationFrame(processFrame);
  }, [videoRef, onLandmarks]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = resolve;
          video.onerror = reject;
        });
        await video.play();
      }

      return true;
    } catch (err) {
      const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
      throw new Error(
        isDenied
          ? 'Camera permission denied. Please allow camera access and try again.'
          : `Camera unavailable: ${err.message}`
      );
    }
  }, [videoRef]);

  const initMediaPipe = useCallback(async () => {
    setStatus(MediaPipeStatus.LOADING_MODEL);
    setError(null);

    try {
      // Load MediaPipe WASM + model
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      poseLandmarkerRef.current = landmarker;

      setStatus(MediaPipeStatus.REQUESTING_CAMERA);
      await startCamera();

      setStatus(MediaPipeStatus.RUNNING);
      animFrameRef.current = requestAnimationFrame(processFrame);
    } catch (err) {
      console.error('MediaPipe init error:', err);
      setError(err.message || 'Failed to initialize pose detection.');
      setStatus(MediaPipeStatus.ERROR);
    }
  }, [startCamera, processFrame]);

  const activateDemoMode = useCallback(() => {
    setIsDemoMode(true);
    setStatus(MediaPipeStatus.DEMO_MODE);
    setError(null);
  }, []);

  useEffect(() => {
    if (enabled && status === MediaPipeStatus.IDLE) {
      initMediaPipe();
    }
    return () => {
      if (!enabled) {
        stopCamera();
      }
    };
  }, [enabled, status, initMediaPipe, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, [stopCamera]);

  return {
    status,
    error,
    isDemoMode,
    activateDemoMode,
    isRunning: status === MediaPipeStatus.RUNNING,
    isLoading:
      status === MediaPipeStatus.LOADING_MODEL ||
      status === MediaPipeStatus.REQUESTING_CAMERA,
    reinitialize: () => {
      stopCamera();
      setStatus(MediaPipeStatus.IDLE);
    },
  };
}
