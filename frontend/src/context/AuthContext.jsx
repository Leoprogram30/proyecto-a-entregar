/* oxlint-disable react/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, SESSION_EXPIRED_EVENT } from '../services/api';
import { useToast } from '../components/ui';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(api.hasToken());

  // Al cargar, si hay token se valida contra el servidor
  useEffect(() => {
    if (!api.hasToken()) return;
    let cancelled = false;
    api
      .getMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        api.logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Sesión vencida o invalidada por el servidor
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      toast.error('Su sesión expiró. Ingrese nuevamente.');
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [toast]);

  const login = useCallback(async (email, password) => {
    const loggedUser = await api.login(email, password);
    setUser(loggedUser);
    return loggedUser;
  }, []);

  const register = useCallback((formData) => api.register(formData), []);

  const updateProfile = useCallback(async (data) => {
    const updated = await api.updateProfile(data);
    setUser((prev) => ({ ...prev, ...updated }));
    return updated;
  }, []);

  const logout = useCallback(() => {
    api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, updateProfile }),
    [user, loading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
