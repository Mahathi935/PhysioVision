/**
 * useSpokenFeedback.js
 * Reads feedback messages out loud using the browser's built-in Web Speech API
 * (speechSynthesis) — no extra dependency or API key needed.
 *
 * Why it is more than a plain `speak(message)`:
 * - Feedback changes many times per second, so speech is debounced, de-duplicated
 *   and rate-limited. Otherwise the voice would stutter and fall behind the movement.
 * - Corrective messages (reposition, slow down, go further) have a higher priority
 *   than encouragement and may interrupt it. Encouragement never interrupts a
 *   correction.
 * - A message that is still the current one after the voice finishes is not dropped;
 *   stale messages are (we always speak what is on screen *now*).
 * - Persistent problems (e.g. "move farther from the camera") are repeated every
 *   few seconds until fixed, because the person may be too far away to read the screen.
 */

import { useEffect, useRef, useState, useCallback } from 'react';

const VOICE_PREF_KEY = 'med_vision_voice_enabled';

// ── Tunables ────────────────────────────────────────────────────────────────
const TICK_MS = 400;          // how often we check what should be spoken
const MIN_GAP_MS = 600;       // silence between two utterances
const REPEAT_MS = 8000;       // repeat an unresolved warning/pause message this often
const SPEECH_RATE = 0.95;

// Same message will not be spoken again inside this window (stops A→B→A chatter)
const COOLDOWN_MS = {
  pause: 8000,
  warning: 8000,
  success: 3000,
  info: 8000,
};

// Higher priority may interrupt lower priority speech
const PRIORITY = { pause: 3, warning: 3, success: 2, info: 1 };

export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    'SpeechSynthesisUtterance' in window
  );
}

/**
 * Persisted on/off preference for voice guidance (defaults to ON).
 * @returns {[boolean, (value: boolean) => void]}
 */
export function useVoicePreference() {
  const [enabled, setEnabledState] = useState(() => {
    try {
      const raw = localStorage.getItem(VOICE_PREF_KEY);
      return raw === null ? true : raw === 'true';
    } catch {
      return true;
    }
  });

  const setEnabled = useCallback((value) => {
    setEnabledState(value);
    try {
      localStorage.setItem(VOICE_PREF_KEY, String(value));
    } catch {
      /* storage unavailable — preference just won't persist */
    }
  }, []);

  return [enabled, setEnabled];
}

/** Turn an on-screen message into something that sounds natural when spoken. */
function toSpeechText(message) {
  return message
    .replace(/(\d+(?:\.\d+)?)°\s*[–-]\s*(\d+(?:\.\d+)?)°/g, '$1 to $2 degrees')
    .replace(/(\d+(?:\.\d+)?)°/g, '$1 degrees')
    .replace(/…/g, '')
    .replace(/\s*—\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Identity of a message for de-duplication. Angle values change every frame
 * ("Good range at 62°" / "…at 63°"), so they are masked. Rep counts are kept
 * so "3 reps done" and "4 reps done" are different messages.
 */
function messageKey(message) {
  return message.replace(/\d+(?:\.\d+)?°/g, '#°');
}

/**
 * @param {{ message: string, type?: 'info'|'success'|'warning'|'pause' } | null} feedback
 *        The message currently shown on screen. null = nothing to say.
 * @param {{ enabled?: boolean }} [options]
 */
export function useSpokenFeedback(feedback, { enabled = true } = {}) {
  const latestRef = useRef(feedback);
  const voiceRef = useRef(null);
  const utteranceRef = useRef(null);      // keep a reference — Chrome may GC utterances mid-speech
  const speakingRef = useRef(false);
  const startedAtRef = useRef(0);
  const currentRef = useRef(null);        // { key, priority } of what is being spoken
  const lastEndRef = useRef(0);
  const lastKeyRef = useRef(null);        // last message key that was spoken
  const lastAtRef = useRef(0);            // when it was spoken
  const lastSpokenRef = useRef(new Map()); // key → timestamp (per-message cooldown)
  const seenRef = useRef({ key: null, since: 0 }); // debounce: message must be stable

  useEffect(() => {
    latestRef.current = feedback;
  }, [feedback]);

  // Pick an English voice (voices load asynchronously in most browsers)
  useEffect(() => {
    if (!isSpeechSupported()) return;
    const synth = window.speechSynthesis;

    const pickVoice = () => {
      const voices = synth.getVoices();
      if (!voices.length) return;
      const pref = (navigator.language || 'en-US').toLowerCase();
      voiceRef.current =
        voices.find((v) => v.lang.toLowerCase() === pref && pref.startsWith('en')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('en-')) ||
        null;
    };

    pickVoice();
    synth.addEventListener('voiceschanged', pickVoice);
    return () => synth.removeEventListener('voiceschanged', pickVoice);
  }, []);

  // Main loop
  useEffect(() => {
    if (!enabled || !isSpeechSupported()) return;
    const synth = window.speechSynthesis;

    const speak = (text, key, priority) => {
      if (speakingRef.current) synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = SPEECH_RATE;
      utterance.lang = voiceRef.current?.lang || 'en-US';
      if (voiceRef.current) utterance.voice = voiceRef.current;

      const finish = () => {
        // Ignore events from an utterance we already replaced/cancelled
        if (utteranceRef.current !== utterance) return;
        speakingRef.current = false;
        currentRef.current = null;
        lastEndRef.current = Date.now();
      };
      utterance.onend = finish;
      utterance.onerror = finish;

      const now = Date.now();
      utteranceRef.current = utterance;
      speakingRef.current = true;
      startedAtRef.current = now;
      currentRef.current = { key, priority };
      lastKeyRef.current = key;
      lastAtRef.current = now;
      lastSpokenRef.current.set(key, now);

      synth.speak(utterance);
    };

    const tick = () => {
      const fb = latestRef.current;
      if (!fb || !fb.message) return;

      const type = PRIORITY[fb.type] ? fb.type : 'info';
      const priority = PRIORITY[type];
      const key = messageKey(fb.message);
      const now = Date.now();

      // Safety net: some browsers occasionally never fire `onend`
      if (
        speakingRef.current &&
        !synth.speaking &&
        !synth.pending &&
        now - startedAtRef.current > 800
      ) {
        speakingRef.current = false;
        currentRef.current = null;
        lastEndRef.current = now;
      }

      // Debounce: only act on a message that has stayed the same for a full tick
      if (seenRef.current.key !== key) {
        seenRef.current = { key, since: now };
        return;
      }

      const text = toSpeechText(fb.message);
      if (!text) return;

      // Something is being spoken: only a higher-priority, different message may cut in
      if (speakingRef.current) {
        const cur = currentRef.current;
        if (cur && key !== cur.key && priority > cur.priority) {
          speak(text, key, priority);
        }
        return;
      }

      if (now - lastEndRef.current < MIN_GAP_MS) return;

      const isNewMessage = key !== lastKeyRef.current;
      if (isNewMessage) {
        const last = lastSpokenRef.current.get(key);
        if (last && now - last < COOLDOWN_MS[type]) return;
        speak(text, key, priority);
      } else if (priority >= PRIORITY.warning && now - lastAtRef.current >= REPEAT_MS) {
        // Same unresolved problem — remind the person
        speak(text, key, priority);
      }
    };

    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      synth.cancel();
      speakingRef.current = false;
      currentRef.current = null;
      utteranceRef.current = null;
    };
  }, [enabled]);
}
