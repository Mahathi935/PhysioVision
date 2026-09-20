/**
 * CameraView.jsx
 * Webcam video element + canvas overlay container.
 * Handles sizing so canvas exactly matches video dimensions.
 */

import { useEffect, useRef } from 'react';
import PoseOverlay from './PoseOverlay';

export default function CameraView({
  videoRef,
  landmarks,
  activeSide,
  angle,
  className = '',
  showOverlay = true,
  demoMode = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Keep canvas dimensions in sync with video
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const syncSize = () => {
      const rect = video.getBoundingClientRect();
      canvas.width = video.videoWidth || rect.width;
      canvas.height = video.videoHeight || rect.height;
    };

    video.addEventListener('loadedmetadata', syncSize);
    video.addEventListener('resize', syncSize);
    syncSize();

    return () => {
      video.removeEventListener('loadedmetadata', syncSize);
      video.removeEventListener('resize', syncSize);
    };
  }, [videoRef]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-surface-900 overflow-hidden rounded-2xl ${className}`}
      style={{ aspectRatio: '16/9' }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: 'scaleX(-1)',  // mirror for natural selfie view
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />

      {/* Canvas overlay for pose skeleton */}
      {showOverlay && (
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Demo mode banner */}
      {demoMode && (
        <div className="absolute top-3 left-3 right-3 flex justify-center pointer-events-none">
          <div className="bg-yellow-500/90 text-yellow-900 text-xs font-bold px-4 py-1.5 rounded-full tracking-wide">
            ⚠ DEMO MODE — Simulated movement data
          </div>
        </div>
      )}

      {showOverlay && (
        <PoseOverlay
          canvasRef={canvasRef}
          landmarks={landmarks}
          activeSide={activeSide}
          angle={angle}
        />
      )}
    </div>
  );
}
