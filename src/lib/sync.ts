"use client";

import { ListProgress, SessionResult } from "./types";

const TOKEN_KEY = "woordjes-token";
const PROGRESS_KEY = "woordjes-leren-progress";
const SESSIONS_KEY = "woordjes-leren-sessions";

/** Get auth token from localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Save auth token */
export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Remove auth token */
export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/** Get saved user info */
export function getSavedUser(): { id: number; username: string } | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("woordjes-user");
  return raw ? JSON.parse(raw) : null;
}

export function setSavedUser(user: { id: number; username: string }) {
  localStorage.setItem("woordjes-user", JSON.stringify(user));
}

export function clearSavedUser() {
  localStorage.removeItem("woordjes-user");
}

/** Pull progress from server → localStorage */
export async function pullProgress(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const res = await fetch("/api/progress", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      if (res.status === 401) {
        // Token expired
        clearToken();
        clearSavedUser();
      }
      return false;
    }

    const { progress, sessions } = await res.json();

    // Write server data to localStorage
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}

/** Push localStorage progress → server */
export async function pushProgress(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;

  try {
    const progress = JSON.parse(
      localStorage.getItem(PROGRESS_KEY) || "{}"
    ) as Record<string, ListProgress>;
    const sessions = JSON.parse(
      localStorage.getItem(SESSIONS_KEY) || "[]"
    ) as SessionResult[];

    const res = await fetch("/api/progress", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ progress, sessions }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

/** Register a new user */
export async function register(
  username: string,
  password: string
): Promise<{ ok: true; user: { id: number; username: string } } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error };
    }

    setToken(data.token);
    setSavedUser(data.user);
    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: "Geen verbinding met de server" };
  }
}

/** Log in an existing user */
export async function login(
  username: string,
  password: string
): Promise<{ ok: true; user: { id: number; username: string } } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error };
    }

    setToken(data.token);
    setSavedUser(data.user);

    // Pull server progress into localStorage
    await pullProgress();

    return { ok: true, user: data.user };
  } catch {
    return { ok: false, error: "Geen verbinding met de server" };
  }
}

/** Log out */
export function logout() {
  // Push final state before clearing
  pushProgress(); // fire-and-forget
  clearToken();
  clearSavedUser();
  // Clear progress from localStorage
  localStorage.removeItem(PROGRESS_KEY);
  localStorage.removeItem(SESSIONS_KEY);
}
