"use client";

import { useState } from "react";

/**
 * Admin-pagina voor het handmatig bijschrijven van saldo na een Tikkie.
 *
 * Routebeveiliging: zit onder /admin/* dat al door AdminAuthGuard gaat.
 * Bovendien checkt de API zelf of de huidige user in de admins-tabel staat.
 *
 * Workflow:
 *   1. Docent ontvangt Tikkie (€5,00) van iemand
 *   2. Tikkie-melding bevat de naam van de betaler / kenmerk
 *   3. Docent typt: username = pepijn, bedrag = 5.00, kenmerk = "Tikkie 25 apr"
 *   4. POST /api/admin/credit → trigger update saldo
 */
export default function SaldoAdmin() {
  const [username, setUsername] = useState("");
  const [eurAmount, setEurAmount] = useState("");
  const [description, setDescription] = useState("");
  const [externalRef, setExternalRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          eurAmount: parseFloat(eurAmount),
          description: description || undefined,
          externalRef: externalRef || undefined,
          reason: "tikkie",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Mislukt");
        return;
      }
      const eur = (data.newBalanceCents / 100).toFixed(2).replace(".", ",");
      setResult(`Saldo van ${data.student.username} is nu \u20AC${eur}`);
      setUsername("");
      setEurAmount("");
      setDescription("");
      setExternalRef("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Onbekende fout");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <h2 className="text-xl font-bold mb-4">Saldo bijschrijven</h2>
      <p className="text-sm text-text-light mb-6">
        Na ontvangst van een Tikkie: typ de gebruikersnaam (kenmerk in
        de Tikkie-melding) en het bedrag. De student ziet het saldo
        binnen enkele seconden in zijn account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Gebruikersnaam</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="bijv. pepijn"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Bedrag (in euro)</label>
          <input
            type="number"
            step="0.01"
            min="-100"
            max="100"
            value={eurAmount}
            onChange={(e) => setEurAmount(e.target.value)}
            placeholder="5.00"
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
          <p className="text-xs text-text-light mt-1">
            Negatief bedrag is mogelijk voor terugboekingen.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Omschrijving (optioneel)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="bijv. Tikkie 25 apr"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Externe referentie (optioneel)</label>
          <input
            type="text"
            value={externalRef}
            onChange={(e) => setExternalRef(e.target.value)}
            placeholder="Tikkie betaal-id"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm"
          />
        </div>

        {result && (
          <div className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">
            {result}
          </div>
        )}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !username.trim() || !eurAmount}
          className="w-full py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading ? "Bezig..." : "Bijschrijven"}
        </button>
      </form>
    </div>
  );
}
