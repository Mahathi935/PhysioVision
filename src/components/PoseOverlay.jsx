/**
 * PoseOverlay.jsx
 * Draws the MediaPipe pose skeleton on a canvas overlay.
 * Highlights the key landmarks: Shoulder → Hip → Knee → Ankle
 * Shows the angle arc at the Hip joint.
 */

import { useEffect, useRef } from 'react';
import { LANDMARK_NAMES } from '../data/exerciseConfig';

// MediaPipe PoseLandmarker connections (subset of full body we care about)
const POSE_CONNECTIONS = [
  // Torso
  [LANDMARK_NAMES.LEFT_SHOULDER, LANDMARK_NAMES.RIGHT_SHOULDER],
  [LANDMARK_NAMES.LEFT_SHOULDER, LANDMARK_NAMES.LEFT_HIP],
  [LANDMARK_NAMES.RIGHT_SHOULDER, LANDMARK_NAMES.RIGHT_HIP],
  [LANDMARK_NAMES.LEFT_HIP, LANDMARK_NAMES.RIGHT_HIP],
  // Left leg
  [LANDMARK_NAMES.LEFT_HIP, LANDMARK_NAMES.LEFT_KNEE],
  [LANDMARK_NAMES.LEFT_KNEE, LANDMARK_NAMES.LEFT_ANKLE],
  // Right leg
  [LANDMARK_NAMES.RIGHT_HIP, LANDMARK_NAMES.RIGHT_KNEE],
  [LANDMARK_NAMES.RIGHT_KNEE, LANDMARK_NAMES.RIGHT_ANKLE],
  // Arms (subtle)
  [LANDMARK_NAMES.LEFT_SHOULDER, 13],  // LEFT_ELBOW
  [LANDMARK_NAMES.RIGHT_SHOULDER, 14], // RIGHT_ELBOW
];

// Indices of KEY landmarks (rendered larger + brighter)
const KEY_LANDMARK_SETS = {
  left: [
    LANDMARK_NAMES.LEFT_SHOULDER,
    LANDMARK_NAMES.LEFT_HIP,
    LANDMARK_NAMES.LEFT_KNEE,
    LANDMARK_NAMES.LEFT_ANKLE,
  ],
  right: [
    LANDMARK_NAMES.RIGHT_SHOULDER,
    LANDMARK_NAMES.RIGHT_HIP,
    LANDMARK_NAMES.RIGHT_KNEE,
    LANDMARK_NAMES.RIGHT_ANKLE,
  ],
};

const COLORS = {
  skeleton: 'rgba(20, 184, 176, 0.5)',       // teal, semi-transparent
  keyLine: 'rgba(20, 184, 176, 0.9)',         // teal, strong
  landmark: 'rgba(255, 255, 255, 0.5)',       // white dots
  keyLandmark: '#14b8b0',                     // teal key dots
  keyLandmarkStroke: '#ffffff',               // white border on key dots
  angle: '#14b8b0',                           // angle arc color
  angleText: '#ffffff',                       // angle number color
  angleArc: 'rgba(20, 184, 176, 0.25)',       // arc fill
};

export default function PoseOverlay({ canvasRef, landmarks, activeSide = 'left', angle = null, videoWidth = 640, videoHeight = 480 }) {

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!landmarks || landmarks.length === 0) return;

    const W = canvas.width;
    const H = canvas.height;

    // Helper: landmark normalized coords → canvas pixels
    // MediaPipe landmarks are in normalized [0,1] coords
    // Note: x is flipped for front-facing camera
    const toCanvas = (lm) => ({
      x: (1 - lm.x) * W,  // mirror for selfie view
      y: lm.y * H,
    });

    const keyIndices = KEY_LANDMARK_SETS[activeSide] || KEY_LANDMARK_SETS.left;

    // 1. Draw skeleton connections (dimmed background lines)
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    for (const [a, b] of POSE_CONNECTIONS) {
      const lmA = landmarks[a];
      const lmB = landmarks[b];
      if (!lmA || !lmB) continue;
      if ((lmA.visibility || 0) < 0.3 || (lmB.visibility || 0) < 0.3) continue;

      const isKeyConnection =
        keyIndices.includes(a) && keyIndices.includes(b);

      ctx.strokeStyle = isKeyConnection ? COLORS.keyLine : COLORS.skeleton;
      ctx.lineWidth = isKeyConnection ? 3 : 1.5;

      const pA = toCanvas(lmA);
      const pB = toCanvas(lmB);

      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.stroke();
    }

    // 2. Draw all landmarks (small dots)
    for (let i = 0; i < landmarks.length; i++) {
      const lm = landmarks[i];
      if (!lm || (lm.visibility || 0) < 0.3) continue;

      const isKey = keyIndices.includes(i);
      const p = toCanvas(lm);

      if (isKey) {
        // Key landmark: larger teal dot with white border
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.keyLandmark;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = COLORS.keyLandmarkStroke;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Regular landmark: small white dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = COLORS.landmark;
        ctx.fill();
      }
    }

    // 3. Draw angle arc at Hip
    if (angle !== null) {
      const shoulderIdx = activeSide === 'left' ? LANDMARK_NAMES.LEFT_SHOULDER : LANDMARK_NAMES.RIGHT_SHOULDER;
      const hipIdx = activeSide === 'left' ? LANDMARK_NAMES.LEFT_HIP : LANDMARK_NAMES.RIGHT_HIP;
      const kneeIdx = activeSide === 'left' ? LANDMARK_NAMES.LEFT_KNEE : LANDMARK_NAMES.RIGHT_KNEE;

      const lmShoulder = landmarks[shoulderIdx];
      const lmHip = landmarks[hipIdx];
      const lmKnee = landmarks[kneeIdx];

      if (
        lmShoulder && lmHip && lmKnee &&
        (lmShoulder.visibility || 0) > 0.5 &&
        (lmHip.visibility || 0) > 0.5 &&
        (lmKnee.visibility || 0) > 0.5
      ) {
        const pShoulder = toCanvas(lmShoulder);
        const pHip = toCanvas(lmHip);
        const pKnee = toCanvas(lmKnee);

        // Compute angles of the two arms from Hip
        const angleArm1 = Math.atan2(pShoulder.y - pHip.y, pShoulder.x - pHip.x);
        const angleArm2 = Math.atan2(pKnee.y - pHip.y, pKnee.x - pHip.x);

        const arcRadius = 35;

        // Draw arc fill
        ctx.beginPath();
        ctx.moveTo(pHip.x, pHip.y);
        ctx.arc(pHip.x, pHip.y, arcRadius, angleArm1, angleArm2, false);
        ctx.closePath();
        ctx.fillStyle = COLORS.angleArc;
        ctx.fill();

        // Draw arc stroke
        ctx.beginPath();
        ctx.arc(pHip.x, pHip.y, arcRadius, angleArm1, angleArm2, false);
        ctx.strokeStyle = COLORS.angle;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw angle text near hip
        const midAngle = (angleArm1 + angleArm2) / 2;
        const textX = pHip.x + Math.cos(midAngle) * (arcRadius + 20);
        const textY = pHip.y + Math.sin(midAngle) * (arcRadius + 20);

        ctx.font = 'bold 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow for readability
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillText(`${Math.round(angle)}°`, textX + 1, textY + 1);

        ctx.fillStyle = COLORS.angleText;
        ctx.fillText(`${Math.round(angle)}°`, textX, textY);
      }
    }

    // 4. Label key landmarks
    const labelMap = {
      [LANDMARK_NAMES.LEFT_SHOULDER]: 'Shoulder',
      [LANDMARK_NAMES.RIGHT_SHOULDER]: 'Shoulder',
      [LANDMARK_NAMES.LEFT_HIP]: 'Hip',
      [LANDMARK_NAMES.RIGHT_HIP]: 'Hip',
      [LANDMARK_NAMES.LEFT_KNEE]: 'Knee',
      [LANDMARK_NAMES.RIGHT_KNEE]: 'Knee',
      [LANDMARK_NAMES.LEFT_ANKLE]: 'Ankle',
      [LANDMARK_NAMES.RIGHT_ANKLE]: 'Ankle',
    };

    ctx.font = '11px Inter, sans-serif';
    ctx.textBaseline = 'bottom';

    for (const idx of keyIndices) {
      const lm = landmarks[idx];
      if (!lm || (lm.visibility || 0) < 0.5) continue;
      const p = toCanvas(lm);
      const label = labelMap[idx] || '';

      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillText(label, p.x + 1, p.y - 11);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(label, p.x, p.y - 12);
    }

  }, [landmarks, activeSide, angle, canvasRef]);

  return null; // Canvas is managed by ref
}
