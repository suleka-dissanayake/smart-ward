import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, authApi, seedDb } from "../services/supabase";
import type { AppUser, UserRole } from "../types";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  quickLogin: (user: AppUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role, department, status")
    .eq("id", userId)
    .single();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role as UserRole,
    department: data.department,
    status: data.status,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore session on mount
    authApi.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await authApi.login(email, password);
    if (error) throw new Error(error.message);
    // Profile is loaded via onAuthStateChange above
  }, []);

  // Demo offline bypass — skips Supabase auth
  const quickLogin = useCallback((u: AppUser) => {
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, quickLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

// Expose seedDb for use in Login quick-access
export { seedDb };
