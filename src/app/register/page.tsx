"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const { register, hasBackend } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [voornaam, setVoornaam] = useState("");
  const [klas, setKlas] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!/^[a-z0-9._-]{2,30}$/i.test(username.trim())) {
      setError("Gebruikersnaam: 2-30 tekens, alleen letters/cijfers/._- ");
      return;
    }
    if (password.length < 6) {
      setError("Wachtwoord minimaal 6 tekens");
      return;
    }

    setLoading(true);
    const result = await register(username.trim().toLowerCase(), password, {
      username: username.trim().toLowerCase(),
      voornaam: voornaam.trim() || undefined,
      klas: klas.trim() || undefined,
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error || "Er ging iets mis");
      return;
    }
    router.replace("/");
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">{"\u{2728}"}</span>
          <h1 className="text-2xl font-bold text-primary mt-3">Account maken</h1>
          <p className="text-text-light text-sm mt-1">
            Kies zelf je gebruikersnaam en wachtwoord
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {!hasBackend && (
            <div className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-4">
              Account aanmaken is nog niet beschikbaar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-text mb-1">
                Gebruikersnaam <span className="text-red-500">*</span>
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
              <p className="text-xs text-text-light mt-1">
                Geen e-mail nodig. Verzin iets dat je kunt onthouden.
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text mb-1">
                Wachtwoord <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="minimaal 6 tekens"
                autoComplete="new-password"
                disabled={!hasBackend}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="voornaam" className="block text-sm font-medium text-text mb-1">
                  Voornaam
                </label>
                <input
                  id="voornaam"
                  type="text"
                  value={voornaam}
                  onChange={(e) => setVoornaam(e.target.value)}
                  placeholder="optioneel"
                  disabled={!hasBackend}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
                />
              </div>
              <div>
                <label htmlFor="klas" className="block text-sm font-medium text-text mb-1">
                  Klas
                </label>
                <input
                  id="klas"
                  type="text"
                  value={klas}
                  onChange={(e) => setKlas(e.target.value)}
                  placeholder="bijv. 1A"
                  disabled={!hasBackend}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm disabled:opacity-50"
                />
              </div>
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
              {loading ? "Aan het registreren..." : "Account maken"}
            </button>
          </form>

          <p className="text-xs text-text-light mt-6 text-center">
            Heb je al een account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Log in
            </Link>
          </p>

          <p className="text-xs text-text-light mt-4 text-center bg-blue-50 rounded-lg p-3">
            {"\u{1F510}"} Jouw oefenruimte. Niemand anders kan jouw voortgang zien —
            ook geen docent of ouder.
          </p>
        </div>
      </div>
    </div>
  );
}
