"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  getToken,
  getSavedUser,
  login as doLogin,
  register as doRegister,
  logout as doLogout,
  pullProgress,
  pushProgress,
} from "@/lib/sync";

interface User {
  id: number;
  username: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  syncToServer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: check for existing token
  useEffect(() => {
    const token = getToken();
    const saved = getSavedUser();
    if (token && saved) {
      setUser(saved);
      // Pull latest from server in background
      pullProgress().catch(() => {});
    }
    setLoading(false);
  }, []);

  // Auto-sync: push progress every 30 seconds if logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      pushProgress().catch(() => {});
    }, 30_000);
    return () => clearInterval(interval);
  }, [user]);

  // Sync before tab close
  useEffect(() => {
    if (!user) return;
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliability
      const token = getToken();
      if (!token) return;
      const progress = localStorage.getItem("woordjes-leren-progress") || "{}";
      const sessions = localStorage.getItem("woordjes-leren-sessions") || "[]";
      const body = JSON.stringify({
        progress: JSON.parse(progress),
        sessions: JSON.parse(sessions),
      });
      navigator.sendBeacon(
        "/api/progress?token=" + encodeURIComponent(token),
        new Blob([body], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  const login = useCallback(
    async (username: string, password: string) => {
      const result = await doLogin(username, password);
      if (result.ok) {
        setUser(result.user);
        return { ok: true };
      }
      return { ok: false, error: result.error };
    },
    []
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const result = await doRegister(username, password);
      if (result.ok) {
        setUser(result.user);
        // Push any existing localStorage progress to the new account
        await pushProgress();
        return { ok: true };
      }
      return { ok: false, error: result.error };
    },
    []
  );

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  const syncToServer = useCallback(async () => {
    await pushProgress();
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, syncToServer }}
    >
      {children}
    </AuthContext.Provider>
  );
}
