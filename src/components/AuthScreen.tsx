"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AuthScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result =
      mode === "login"
        ? await login(username, password)
        : await register(username, password);

    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Er ging iets mis");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">🎓</span>
          <h1 className="text-2xl font-bold text-primary mt-3">
            Woordjes Leren
          </h1>
          <p className="text-text-light text-sm mt-1">
            Stedelijk Gymnasium Leiden
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <button
              onClick={() => {
                setMode("login");
                setError("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "login"
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-light hover:text-text"
              }`}
            >
              Inloggen
            </button>
            <button
              onClick={() => {
                setMode("register");
                setError("");
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
                mode === "register"
                  ? "bg-white text-primary shadow-sm"
                  : "text-text-light hover:text-text"
              }`}
            >
              Account maken
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-text mb-1"
              >
                Gebruikersnaam
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="bijv. jan.de.vries"
                autoComplete="username"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text mb-1"
              >
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimaal 4 tekens"
                autoComplete={
                  mode === "register" ? "new-password" : "current-password"
                }
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username.trim() || !password}
              className="w-full py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Even geduld..."
                : mode === "login"
                ? "Inloggen"
                : "Account aanmaken"}
            </button>
          </form>

          {mode === "register" && (
            <p className="text-xs text-text-light mt-4 text-center">
              Kies een naam die je kunt onthouden.
              <br />
              Geen e-mail nodig!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
