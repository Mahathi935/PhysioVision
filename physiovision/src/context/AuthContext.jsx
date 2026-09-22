/**
 * AuthContext.jsx
 * Provides the current logged-in user and login/register/logout actions
 * to the whole app.
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { getCurrentUser, loginUser, registerUser, logoutUser } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getCurrentUser());

  const login = useCallback((credentials) => {
    const result = loginUser(credentials);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const register = useCallback((details) => {
    const result = registerUser(details);
    if (result.ok) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    logoutUser();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
