import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { authApi, getToken, clearToken, type ApiUser } from "../services/api";
import type { AppUser, UserRole } from "../types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function apiUserToAppUser(u: ApiUser): AppUser {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role as UserRole,
    department: u.department,
    status: u.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount if a token exists
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(res => setUser(apiUserToAppUser(res.user)))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setUser(apiUserToAppUser(res.user));
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
