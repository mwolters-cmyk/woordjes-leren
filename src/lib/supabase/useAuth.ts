"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser, isSupabaseConfigured } from "./client";
import type { Student } from "./types";
import type { Session, User } from "@supabase/supabase-js";

export interface AuthState {
  loading: boolean;
  user: User | null;
  student: Student | null;
  /** True als Supabase configured AND user signed in */
  isAuthenticated: boolean;
  /** True als Supabase niet configured — dan werkt alles localStorage-only */
  noBackend: boolean;
}

/**
 * React hook voor auth-state. Subscribed op Supabase-auth-changes
 * en haalt de student-profile uit public.students.
 *
 * Als Supabase niet geconfigureerd is (bv. in dev zonder credentials):
 * `noBackend: true` → componenten kunnen graceful fallback naar
 * localStorage-only gedrag.
 */
export function useAuth(): AuthState {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);

  const noBackend = !isSupabaseConfigured();

  useEffect(() => {
    if (noBackend) {
      setLoading(false);
      return;
    }

    const supabase = getSupabaseBrowser();
    let mounted = true;

    async function loadStudent(session: Session | null) {
      if (!session?.user) {
        if (mounted) {
          setUser(null);
          setStudent(null);
          setLoading(false);
        }
        return;
      }

      if (mounted) setUser(session.user);

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (mounted) {
        setStudent((data as Student | null) ?? null);
        setLoading(false);
      }
      if (error) console.error("Student profile load error:", error.message);
    }

    supabase.auth.getSession().then(({ data: { session } }) => loadStudent(session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => loadStudent(session)
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [noBackend]);

  return {
    loading,
    user,
    student,
    isAuthenticated: !noBackend && !!user,
    noBackend,
  };
}

/** Sign-out helper voor in components */
export async function signOut() {
  if (!isSupabaseConfigured()) return;
  const supabase = getSupabaseBrowser();
  await supabase.auth.signOut();
}
