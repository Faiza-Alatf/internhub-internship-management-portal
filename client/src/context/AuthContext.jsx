import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/resources';
import { clearSession, getStoredUser, getToken, saveSession, updateStoredUser } from '../utils/storage';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(() => (getToken() ? getStoredUser() : null));

  const logout = useCallback(() => { clearSession(); setUser(null); }, []);

  const login = useCallback(async (email, password, remember) => {
    const { token, user: loggedIn } = await authApi.login({ email, password, remember });
    saveSession(token, loggedIn, remember);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const updateUser = useCallback((changes) => {
    setUser((current) => { const next = { ...current, ...changes }; updateStoredUser(next); return next; });
  }, []);

  // Token expired or revoked -> log out automatically
  useEffect(() => {
    const onExpired = () => {
      if (getToken()) toast.error('Your session has expired. Please log in again.');
      logout();
    };
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [logout, toast]);

  // Validate the stored token once when the app opens
  useEffect(() => {
    if (getToken()) authApi.me().then((fresh) => updateUser(fresh)).catch(() => {});
  }, [updateUser]);

  const value = useMemo(() => ({ user, login, logout, updateUser, isAuthenticated: !!user }), [user, login, logout, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
