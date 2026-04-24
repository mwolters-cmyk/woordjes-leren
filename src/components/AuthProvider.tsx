"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import { migrateLocalStorageToSupabase } from "@/lib/supabase/migrate";
import { setCurrentStudentId } from "@/lib/supabase/sync";
import type { Student, SignUpMetadata } from "@/lib/supabase/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string; // UUID (was number bij Neon, nu UUID bij Supabase)
  username: string;
  voornaam?: string | null;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True als Supabase backend beschikbaar is */
  hasBackend: boolean;
  login: (
    usernameOrEmail: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string }>;
  register: (
    username: string,
    password: string,
    metadata?: SignUpMetadata
  ) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}

/**
 * Username → email mapping voor Supabase Auth.
 * Supabase Auth verwacht email; wij willen leerlingnummer/username.
 * Truc: gebruik <username>@overhoorme.local als pseudo-email.
 * Voor leerlingen onzichtbaar; ze zien alleen username + wachtwoord.
 */
function usernameToEmail(username: string): string {
  return `${username.toLowerCase().trim()}@overhoorme.local`;
}

function isEmailLike(s: string): boolean {
  return s.includes("@");
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const hasBackend = isSupabaseConfigured();

  // On mount + auth changes
  useEffect(() => {
    if (!hasBackend) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowser();
    let mounted = true;

    async function loadProfile(supabaseUser: SupabaseUser | null) {
      if (!supabaseUser) {
        if (mounted) {
          setUser(null);
          setLoading(false);
          setCurrentStudentId(null);
        }
        return;
      }
      setCurrentStudentId(supabaseUser.id);

      const { data } = await supabase
        .from("students")
        .select("id, username, voornaam")
        .eq("id", supabaseUser.id)
        .maybeSingle();

      if (mounted) {
        if (data) {
          setUser({
            id: data.id,
            username: (data as Student).username,
            voornaam: (data as Student).voornaam,
          });
        } else {
          // Profile-row mist (trigger faalde?). Toon user toch.
          setUser({
            id: supabaseUser.id,
            username:
              supabaseUser.user_metadata?.username ?? supabaseUser.email ?? "?",
          });
        }
        setLoading(false);

        // Eerste keer ingelogd op dit apparaat: migreer localStorage
        // naar Supabase. Idempotent — runs once.
        migrateLocalStorageToSupabase(supabaseUser.id).catch((e) => {
          console.warn("Migration warning:", e);
        });
      }
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      loadProfile(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => loadProfile(session?.user ?? null)
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasBackend]);

  const login = useCallback(
    async (usernameOrEmail: string, password: string) => {
      if (!hasBackend) {
        return { ok: false, error: "Login (nog) niet beschikbaar" };
      }
      const supabase = getSupabaseBrowser();
      const email = isEmailLike(usernameOrEmail)
        ? usernameOrEmail
        : usernameToEmail(usernameOrEmail);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { ok: false, error: friendlyError(error.message) };
      }
      return { ok: true };
    },
    [hasBackend]
  );

  const register = useCallback(
    async (username: string, password: string, metadata?: SignUpMetadata) => {
      if (!hasBackend) {
        return { ok: false, error: "Registreren (nog) niet beschikbaar" };
      }
      if (password.length < 6) {
        return { ok: false, error: "Wachtwoord minimaal 6 tekens" };
      }
      const supabase = getSupabaseBrowser();
      const email = usernameToEmail(username);

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            voornaam: metadata?.voornaam,
            klas: metadata?.klas,
            jaarlaag: metadata?.jaarlaag,
          },
        },
      });

      if (error) {
        return { ok: false, error: friendlyError(error.message) };
      }
      return { ok: true };
    },
    [hasBackend]
  );

  const logout = useCallback(async () => {
    if (!hasBackend) return;
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    setUser(null);
  }, [hasBackend]);

  return (
    <AuthContext.Provider value={{ user, loading, hasBackend, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "Verkeerde gebruikersnaam of wachtwoord";
  if (msg.includes("already registered") || msg.includes("already exists"))
    return "Deze gebruikersnaam is al in gebruik";
  if (msg.includes("Password should be")) return "Wachtwoord minimaal 6 tekens";
  if (msg.includes("Email rate limit")) return "Te veel pogingen, probeer het later opnieuw";
  return msg;
}
