/**
 * Navbar.jsx
 * Top navigation bar for MED VISION'26
 */

import { Link, useLocation } from 'react-router-dom';
import { FiActivity, FiHome, FiClock, FiSettings } from 'react-icons/fi';

const NAV_LINKS = [
  { to: '/', label: 'Dashboard', icon: FiHome },
  { to: '/history', label: 'History', icon: FiClock },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface-900/90 backdrop-blur-md border-b border-surface-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center shadow-lg shadow-accent-500/30 group-hover:shadow-accent-500/50 transition-shadow">
            <FiActivity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-text-primary tracking-wide">MED VISION</span>
            <span className="text-[10px] text-accent-400 font-semibold tracking-widest uppercase">'26</span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-accent-500/20 text-accent-300 border border-accent-500/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-700'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Version badge */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-[10px] text-text-muted font-medium uppercase tracking-widest">
            AI-Assisted Rehab
          </span>
          <div className="w-1.5 h-1.5 bg-accent-500 rounded-full animate-pulse" />
        </div>
      </div>
    </header>
  );
}