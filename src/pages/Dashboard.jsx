/**
 * Dashboard.jsx — Home / Landing page
 */

import { useNavigate } from 'react-router-dom';
import { FiPlay, FiClock, FiAlertCircle, FiActivity, FiShield } from 'react-icons/fi';
import { loadSessions } from '../utils/storage';
import { EXERCISES } from '../data/exerciseConfig';

export default function Dashboard() {
  const navigate = useNavigate();
  const sessions = loadSessions();
  const lastSession = sessions[0];

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Hero section */}
        <div className="mb-10 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-5 bg-accent-500 rounded-full" />
            <span className="section-label">AI-Assisted Home Rehabilitation</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-text-primary leading-tight mb-4">
            Monitor Your
            <span className="text-accent-400"> Prescribed</span>
            <br />Exercises at Home
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl leading-relaxed">
            Real-time exercise monitoring between physiotherapy sessions.
            Your webcam tracks movement while your physiotherapist's parameters guide your form.
          </p>
        </div>

        {/* Safety Notice */}
        <div className="card p-4 mb-8 border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3 animate-fade-in">
          <FiShield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-200/80">
            <span className="font-semibold text-yellow-300">Clinical Notice: </span>
            AI monitoring supports exercise execution only. It does not replace professional physiotherapy assessment, diagnosis, or prescription.
          </p>
        </div>

        {/* Quick stats if sessions exist */}
        {lastSession && (
          <div className="grid grid-cols-3 gap-4 mb-8 animate-slide-up">
            <div className="card p-4">
              <p className="section-label mb-1">Last Session</p>
              <p className="stat-value">{lastSession.repCount}/{lastSession.repGoal}</p>
              <p className="stat-label">Reps completed</p>
            </div>
            <div className="card p-4">
              <p className="section-label mb-1">Avg Angle</p>
              <p className="stat-value">{lastSession.avgAngle}°</p>
              <p className="stat-label">Peak hip flexion</p>
            </div>
            <div className="card p-4">
              <p className="section-label mb-1">Sessions</p>
              <p className="stat-value">{sessions.length}</p>
              <p className="stat-label">Total recorded</p>
            </div>
          </div>
        )}

        {/* Action cards */}
        <div className="grid sm:grid-cols-3 gap-5 animate-slide-up">

          {/* Start Exercise — primary CTA */}
          <button
            onClick={() => navigate('/setup')}
            className="card p-6 text-left hover:bg-surface-600 hover:border-accent-500/40
                       transition-all duration-200 active:scale-95 group col-span-full sm:col-span-2
                       border-accent-500/20 bg-accent-500/5"
          >
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center mb-4
                            shadow-lg shadow-accent-500/30 group-hover:shadow-accent-500/50 transition-shadow">
              <FiPlay className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Start Exercise</h2>
            <p className="text-text-secondary text-sm leading-relaxed">
              Begin a monitored session for Leg Raise or Wrist Flexion.
              Configure your physiotherapist's target parameters and start tracking.
            </p>
            <div className="mt-4 flex items-center gap-2 text-accent-400 text-sm font-medium">
              <span>Configure & Start</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </button>

          {/* History */}
          <button
            onClick={() => navigate('/history')}
            className="card p-6 text-left hover:bg-surface-600 hover:border-surface-400
                       transition-all duration-200 active:scale-95 group"
          >
            <div className="w-12 h-12 bg-surface-600 rounded-xl flex items-center justify-center mb-4
                            group-hover:bg-accent-500/10 transition-colors">
              <FiClock className="w-6 h-6 text-text-secondary group-hover:text-accent-400 transition-colors" />
            </div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Session History</h2>
            <p className="text-text-secondary text-sm">
              {sessions.length > 0
                ? `${sessions.length} session${sessions.length > 1 ? 's' : ''} recorded`
                : 'No sessions yet'}
            </p>
          </button>

        </div>

        {/* Available exercises info */}
        <div className="mt-5 card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <FiActivity className="w-5 h-5 text-accent-400" />
            <h3 className="font-semibold text-text-primary">Available Exercises</h3>
          </div>
          <div className="space-y-4">
            {Object.values(EXERCISES).map((ex, i) => (
              <div key={ex.id} className={`flex items-start gap-4 ${i > 0 ? 'pt-4 border-t border-surface-500' : ''}`}>
                <div className="flex-1">
                  <p className="font-medium text-text-primary">{ex.name}</p>
                  <p className="text-text-secondary text-sm mt-1 leading-relaxed">{ex.description}</p>
                  <p className="text-text-muted text-xs mt-1">
                    <span className="text-accent-400">Tracks: </span>{ex.jointDescription}
                  </p>
                </div>
                <div className="flex-shrink-0 px-3 py-1 bg-accent-500/10 rounded-lg border border-accent-500/20">
                  <span className="text-accent-400 text-xs font-semibold">Available</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
