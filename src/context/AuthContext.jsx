import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, getToken, clearToken } from '../services/api';

const AuthContext = createContext(null);

function apiUserToAppUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    status: u.status,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(apiUserToAppUser(res.user)))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    setUser(apiUserToAppUser(res.user));
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
