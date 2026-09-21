/**
 * Login.jsx — Login / Sign up page
 * Simple required fields, no backend: accounts live in this browser's
 * localStorage so each user's exercise history stays separate.
 */

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiActivity, FiUser, FiMail, FiLock, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === 'signup';

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password || (isSignup && !name.trim())) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    const result = isSignup
      ? register({ name, email, password })
      : login({ email, password });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Something went wrong. Please try again.');
      return;
    }

    navigate(redirectTo, { replace: true });
  }

  function toggleMode() {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
  }

  return (
    <div className="min-h-screen bg-surface-800 flex items-center justify-center px-4 sm:px-6 py-12">
      <div className="w-full max-w-md animate-fade-in">

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30 mb-3">
            <FiActivity className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-bold text-text-primary tracking-wide">PhysioVision</span>
          <span className="text-xs text-text-muted uppercase tracking-widest mt-1">AI-Assisted Rehab</span>
        </div>

        <div className="card p-6 sm:p-8">
          <h1 className="text-xl font-bold text-text-primary mb-1">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="text-text-secondary text-sm mb-6">
            {isSignup
              ? 'Sign up to start tracking your exercise sessions.'
              : 'Log in to see your exercise history and continue your sessions.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label htmlFor="name" className="section-label block mb-1.5">
                  Full name
                </label>
                <div className="relative">
                  <FiUser className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full bg-surface-600 border border-surface-500 rounded-xl pl-10 pr-4 py-2.5
                               text-text-primary placeholder:text-text-muted text-sm
                               focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="section-label block mb-1.5">
                Email
              </label>
              <div className="relative">
                <FiMail className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-surface-600 border border-surface-500 rounded-xl pl-10 pr-4 py-2.5
                             text-text-primary placeholder:text-text-muted text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="section-label block mb-1.5">
                Password
              </label>
              <div className="relative">
                <FiLock className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignup ? 'At least 4 characters' : '••••••••'}
                  required
                  className="w-full bg-surface-600 border border-surface-500 rounded-xl pl-10 pr-4 py-2.5
                             text-text-primary placeholder:text-text-muted text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Log in'}
            </button>
          </form>

          <p className="text-center text-text-secondary text-sm mt-6">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-accent-400 font-medium hover:text-accent-300 transition-colors"
            >
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>

        <p className="text-center text-text-muted text-xs mt-6">
          Your account and session history are stored only on this device/browser.
        </p>
      </div>
    </div>
  );
}
