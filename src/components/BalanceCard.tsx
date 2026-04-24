"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Student } from "@/lib/supabase/types";

/**
 * Tegoed-kaartje voor leerling. Toont saldo en biedt Tikkie-knop.
 *
 * Tikkie-flow voor MVP (handmatig, geen webhook):
 *   1. Leerling klikt "Stuur Tikkie" → opent Tikkie-link met
 *      kenmerk = username (zo weet de docent wie het is)
 *   2. Docent ontvangt Tikkie, ziet kenmerk, gaat naar /admin/saldo
 *   3. Docent boekt het bedrag bij op username
 *
 * Later: webhook voor automatische verwerking via Tikkie Business API.
 */
const TIKKIE_BASE_URL = "https://tikkie.me/pay/abfvlr6u88q23pa1rk2t";

export default function BalanceCard() {
  const { user, hasBackend } = useAuth();
  const [creditsCents, setCreditsCents] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasBackend || !user) {
      setLoading(false);
      return;
    }
    const supabase = getSupabaseBrowser();
    supabase
      .from("students")
      .select("credits_cents")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCreditsCents(((data as Student | null)?.credits_cents) ?? 0);
        setLoading(false);
      });
  }, [hasBackend, user]);

  if (!hasBackend || !user) return null;
  if (loading) return null;

  const euros = ((creditsCents ?? 0) / 100).toFixed(2).replace(".", ",");
  const isLow = (creditsCents ?? 0) < 100; // <€1

  return (
    <div className="card p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-text-light">Jouw tegoed</span>
        <span className={`text-xl font-bold ${isLow ? "text-amber-700" : "text-primary"}`}>
          €{euros}
        </span>
      </div>

      {isLow && (
        <p className="text-xs text-amber-700 mb-3">
          Bijna leeg. Wil je doorgaan met mondelingen oefenen?
        </p>
      )}

      <a
        href={tikkieLinkFor(user.username)}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        {"\u{1F4B0}"} Stuur Tikkie naar de docent
      </a>

      <p className="text-xs text-text-light mt-2 leading-relaxed">
        Vul bij het kenmerk in: <strong>{user.username}</strong>. Zo weet de
        docent dat het van jou is. Saldo verschijnt binnen 24 uur.
      </p>
    </div>
  );
}

/**
 * Tikkie-link met username als referentie.
 * Tikkie ondersteunt geen automatische pre-fill van kenmerk via URL,
 * dus tonen we de username naast de knop ter info.
 */
function tikkieLinkFor(_username: string): string {
  return TIKKIE_BASE_URL;
}
