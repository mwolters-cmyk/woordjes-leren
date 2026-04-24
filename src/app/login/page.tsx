"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const { login, hasBackend } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Er ging iets mis");
      return;
    }
    router.replace(from);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">{"\u{1F393}"}</span>
          <h1 className="text-2xl font-bold text-primary mt-3">Welkom terug</h1>
          <p className="text-text-light text-sm mt-1">
            Log in om verder te oefenen
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {!hasBackend && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
              Inloggen is nog niet beschikbaar. Je voortgang wordt nu lokaal
              opgeslagen op dit apparaat.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text mb-1">
                Gebruikersnaam
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="bijv. pepijn"
                autoComplete="username"
                autoFocus
                disabled={!hasBackend}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={!hasBackend}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password || !hasBackend}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Even geduld..." : "Inloggen"}
            </button>
          </form>

          <p className="text-xs text-text-light mt-6 text-center">
            Nog geen account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Maak er een aan
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-text-light">Laden...</div>}>
      <LoginForm />
    </Suspense>
  );
}
