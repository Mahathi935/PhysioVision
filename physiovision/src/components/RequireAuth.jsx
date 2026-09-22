/**
 * RequireAuth.jsx
 * Route guard — redirects to /login if no user is logged in,
 * remembering where they were headed so we can send them back after login.
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
