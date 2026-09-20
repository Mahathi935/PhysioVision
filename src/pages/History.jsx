/**
 * History.jsx — Session history from localStorage
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiTrash2, FiPlay, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { loadSessions, clearSessions, formatDate, formatDuration } from '../utils/storage';

function StatusBadge({ status }) {
  if (status === 'completed') {
    return (
      <span className="badge bg-accent-500/15 text-accent-300 border border-accent-500/30">
        <FiCheck className="w-3 h-3" /> Completed
      </span>
    );
  }
  return (
    <span className="badge bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">
      <FiAlertCircle className="w-3 h-3" /> Partial
    </span>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState(() => loadSessions());
  const [confirmClear, setConfirmClear] = useState(false);

  const handleClear = () => {
    clearSessions();
    setSessions([]);
    setConfirmClear(false);
  };

  return (
    <div className="min-h-screen bg-surface-800 pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 animate-fade-in">

        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="section-label block mb-2">Session Records</span>
            <h1 className="text-3xl font-bold text-text-primary">Exercise History</h1>
            <p className="text-text-secondary mt-1">Stored locally on this device · {sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          {sessions.length > 0 && (
            <div>
              {confirmClear ? (
                <div className="flex gap-2">
                  <button onClick={handleClear} className="btn-danger text-sm">Confirm Clear</button>
                  <button onClick={() => setConfirmClear(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="btn-secondary flex items-center gap-2 text-sm text-text-muted hover:text-red-400"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Clear History
                </button>
              )}
            </div>
          )}
        </div>

        {sessions.length === 0 ? (
          <div className="card p-12 text-center">
            <FiClock className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-text-secondary font-medium">No sessions recorded yet.</p>
            <p className="text-text-muted text-sm mt-1 mb-5">Complete an exercise session to see it here.</p>
            <button onClick={() => navigate('/setup')} className="btn-primary inline-flex items-center gap-2">
              <FiPlay className="w-4 h-4" />
              Start First Session
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="card p-5 hover:bg-surface-600 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Date + status */}
                  <div className="flex-shrink-0">
                    <StatusBadge status={session.status} />
                    {session.demoMode && (
                      <span className="badge bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 mt-1.5 text-[10px]">
                        DEMO
                      </span>
                    )}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="font-semibold text-text-primary">{session.exercise}</h3>
                      <span className="text-xs text-text-muted font-medium">
                        {formatDate(session.date)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <p className="section-label text-[10px] mb-0.5">Reps</p>
                        <p className="text-sm font-bold text-text-primary">
                          {session.repCount} / {session.repGoal}
                        </p>
                      </div>
                      <div>
                        <p className="section-label text-[10px] mb-0.5">Target</p>
                        <p className="text-sm font-bold text-text-primary">
                          {session.minTarget}° – {session.maxTarget}°
                        </p>
                      </div>
                      <div>
                        <p className="section-label text-[10px] mb-0.5">Avg Angle</p>
                        <p className="text-sm font-bold text-text-primary">
                          {session.avgAngle > 0 ? `${session.avgAngle}°` : '—'}
                        </p>
                      </div>
                      <div>
                        <p className="section-label text-[10px] mb-0.5">Duration</p>
                        <p className="text-sm font-bold text-text-primary font-mono">
                          {formatDuration(session.durationSeconds)}
                        </p>
                      </div>
                    </div>

                    {/* Mini rep progress */}
                    <div className="mt-3 h-1 bg-surface-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          session.status === 'completed' ? 'bg-accent-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(100, (session.repCount / session.repGoal) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
