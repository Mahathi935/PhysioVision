/**
 * storage.js
 * localStorage utilities for session history.
 * Simple, no-backend storage for demo sessions.
 */

const STORAGE_KEY = 'med_vision_sessions';

/**
 * @typedef {Object} SessionRecord
 * @property {string} id
 * @property {string} date - ISO string
 * @property {string} exercise - Exercise name
 * @property {number} repCount - Reps completed
 * @property {number} repGoal - Target reps
 * @property {number} goodReps - Reps within target range
 * @property {number} avgAngle - Average peak angle
 * @property {number} maxAngle - Maximum detected angle
 * @property {number} minTarget - Configured min target
 * @property {number} maxTarget - Configured max target
 * @property {number} durationSeconds - Session duration in seconds
 * @property {'completed'|'partial'|'aborted'} status
 * @property {boolean} demoMode - True if demo mode was used
 */

/**
 * Load all session records.
 * @returns {SessionRecord[]}
 */
export function loadSessions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Save a new session record.
 * @param {SessionRecord} session
 */
export function saveSession(session) {
  try {
    const sessions = loadSessions();
    const id = session.id || generateId();
    // Idempotent: a session that is already stored is never saved a second time
    // (guards against React StrictMode double-effects, page reloads, back/forward).
    if (sessions.some((s) => s.id === id)) return true;
    sessions.unshift({ ...session, id }); // newest first
    // Keep last 50 sessions
    const trimmed = sessions.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clear all session history.
 */
export function clearSessions() {
  localStorage.removeItem(STORAGE_KEY);
}

function generateId() {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Create a unique id for a session. Generated once when the exercise session
 * starts and carried through to the summary, so the same session can only be
 * stored once.
 */
export function createSessionId() {
  return generateId();
}

/**
 * Format duration in seconds to MM:SS string.
 */
export function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * Format an ISO date string to a human-readable local date.
 */
export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
