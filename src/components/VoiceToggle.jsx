/**
 * VoiceToggle.jsx — Small mute/unmute button for spoken guidance.
 * Renders nothing if the browser has no speech synthesis support.
 */

import { FiVolume2, FiVolumeX } from 'react-icons/fi';
import { isSpeechSupported } from '../hooks/useSpokenFeedback';

export default function VoiceToggle({ enabled, onToggle, className = '' }) {
  if (!isSpeechSupported()) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={enabled}
      title={enabled ? 'Mute voice guidance' : 'Turn on voice guidance'}
      className={`btn-secondary flex items-center gap-2 text-sm ${className}`}
    >
      {enabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4" />}
      {enabled ? 'Voice on' : 'Voice off'}
    </button>
  );
}
