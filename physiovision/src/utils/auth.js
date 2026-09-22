/**
 * auth.js
 * Simple, no-backend authentication for demo purposes.
 * Users and password hashes are stored in localStorage.
 *
 * NOTE: This is client-side-only "auth" meant to let each user on this
 * browser have their own separate session history. It is NOT secure
 * (localStorage is readable by anyone with access to the browser/device)
 * and should not be treated as real authentication if this app ever
 * gets a real backend. It's enough to separate users' history on a
 * shared demo/dev machine.
 */

const USERS_KEY = 'med_vision_users';
const SESSION_KEY = 'med_vision_current_user';

/**
 * @typedef {Object} UserRecord
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} passwordHash
 * @property {string} createdAt
 */

function loadUsers() {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Small non-cryptographic hash. Good enough to avoid storing plaintext
// passwords for this local-only demo; NOT secure for production use.
function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = (hash << 5) - hash + password.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

function generateId() {
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Register a new user and log them in.
 * @returns {{ ok: boolean, user?: object, error?: string }}
 */
export function registerUser({ name, email, password }) {
  const trimmedName = (name || '').trim();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!trimmedName || !normalizedEmail || !password) {
    return { ok: false, error: 'All fields are required.' };
  }
  if (password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const users = loadUsers();
  if (users.some((u) => u.email === normalizedEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  const user = {
    id: generateId(),
    name: trimmedName,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);
  setCurrentUser(user);
  return { ok: true, user: publicUser(user) };
}

/**
 * Log in an existing user.
 * @returns {{ ok: boolean, user?: object, error?: string }}
 */
export function loginUser({ email, password }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Email and password are required.' };
  }

  const users = loadUsers();
  const user = users.find((u) => u.email === normalizedEmail);
  if (!user || user.passwordHash !== hashPassword(password)) {
    return { ok: false, error: 'Invalid email or password.' };
  }

  setCurrentUser(user);
  return { ok: true, user: publicUser(user) };
}

/**
 * Log out the current user.
 */
export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Get the currently logged-in user, or null.
 * @returns {{id: string, name: string, email: string} | null}
 */
export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(publicUser(user)));
}
