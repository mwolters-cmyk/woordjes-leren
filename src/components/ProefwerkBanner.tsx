"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Jaarlaag, type Module, LANGUAGE_LABELS, LANGUAGE_EMOJI } from "@/lib/types";
import {
  fetchProefwerken,
  getProefwerkenForModule,
  getLanguageProefwerken,
  getToetsweek,
  getUpcomingModule,
  deduplicateProefwerken,
  type ProefwerkenData,
  type Proefwerk,
} from "@/lib/proefwerken";
import { matchProefwerk, type MatchResult } from "@/lib/proefwerk-matching";

interface Props {
  jaarlaag: Jaarlaag;
}

const COVERAGE_ICON: Record<string, string> = {
  full: "🟢",
  partial: "🟠",
  none: "⚪",
};

const COVERAGE_LABEL: Record<string, string> = {
  full: "Klaar om te oefenen",
  partial: "Deels beschikbaar",
  none: "Nog niet beschikbaar",
};

export default function ProefwerkBanner({ jaarlaag }: Props) {
  const [data, setData] = useState<ProefwerkenData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProefwerken()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  if (error || !data) return null;

  const upcomingMod = getUpcomingModule(data);
  if (!upcomingMod) return null;

  const toetsweek = getToetsweek(data, upcomingMod);
  if (!toetsweek) return null;

  const allPW = getProefwerkenForModule(data, jaarlaag, upcomingMod);
  const langPW = deduplicateProefwerken(getLanguageProefwerken(allPW));

  if (langPW.length === 0) return null;

  // Match each proefwerk to registry lists
  const matches = langPW.map((pw) => matchProefwerk(pw, jaarlaag, upcomingMod));

  // Count how many are ready
  const readyCount = matches.filter((m) => m.coverage === "full").length;

  return (
    <div className="mb-6 rounded-xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-primary flex items-center gap-2">
            📚 Proefwerkweek Module {upcomingMod}
          </h3>
          <p className="text-sm text-text-light mt-0.5">{toetsweek.periode}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
          {readyCount}/{matches.length} vakken klaar
        </span>
      </div>

      <div className="space-y-3">
        {matches.map((match, i) => (
          <ProefwerkRow key={i} match={match} />
        ))}
      </div>

      {/* Combined practice button if any lists are ready */}
      {matches.some((m) => m.readyCount > 0) && (
        <CombinedPracticeButton matches={matches} />
      )}
    </div>
  );
}

function ProefwerkRow({ match }: { match: MatchResult }) {
  const lang = match.language;
  if (!lang) return null;

  return (
    <div className="bg-white/70 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span>{COVERAGE_ICON[match.coverage]}</span>
          <span className="text-sm font-medium">
            {LANGUAGE_EMOJI[lang]} {match.proefwerk.vak}
          </span>
        </div>
        <span className="text-xs text-text-light">
          {COVERAGE_LABEL[match.coverage]}
        </span>
      </div>

      <p className="text-xs text-text-light ml-6 mb-2">
        {match.proefwerk.beschrijving}
      </p>

      {/* Matched lists */}
      {match.matchedLists.length > 0 && (
        <div className="ml-6 flex flex-wrap gap-1.5">
          {match.matchedLists.map((listId) => {
            const isReady = match.readyCount > 0; // simplified check
            return (
              <Link
                key={listId}
                href={`/lijst/${listId}`}
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                  isReady
                    ? "bg-green-50 text-green-700 hover:bg-green-100"
                    : "bg-gray-100 text-text-light"
                }`}
              >
                {formatListId(listId)}
              </Link>
            );
          })}
        </div>
      )}

      {/* Missing topics */}
      {match.missingTopics.length > 0 && (
        <div className="ml-6 mt-1">
          <span className="text-xs text-amber-600">
            Nog nodig: {match.missingTopics.join(", ")}
          </span>
        </div>
      )}
    </div>
  );
}

function CombinedPracticeButton({ matches }: { matches: MatchResult[] }) {
  // Collect all ready list IDs
  const readyListIds = matches
    .flatMap((m) => m.matchedLists)
    .filter((id, i, arr) => arr.indexOf(id) === i); // deduplicate

  if (readyListIds.length === 0) return null;

  const listParam = readyListIds.join(",");

  return (
    <div className="mt-4 pt-3 border-t border-primary/10">
      <Link
        href={`/lijst/${readyListIds[0]}?combi=${listParam}`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
      >
        🎯 Gecombineerde oefentoets
        <span className="text-xs opacity-80">({readyListIds.length} lijsten)</span>
      </Link>
    </div>
  );
}

/** Format a list ID into a short readable label */
function formatListId(id: string): string {
  // k3-m3-de-kap4 → "Kap. 4"
  // k3-m3-fr-delf-a2 → "DELF A2"
  const parts = id.split("-");
  const tail = parts.slice(3).join("-"); // after k{n}-m{n}-{lang}-

  if (tail.startsWith("kap")) return `Kap. ${tail.replace("kap", "")}`;
  if (tail.startsWith("voc-u")) return `Voc. U${tail.replace("voc-u", "")}`;
  if (tail.startsWith("gram")) return `Gram. ${tail.replace("gram-", "")}`;
  if (tail.startsWith("ch")) return `Ch. ${tail.replace("ch", "")}`;
  if (tail.startsWith("w")) return `W. ${tail.replace("w", "")}`;
  if (tail.startsWith("les")) return `Les ${tail.replace("les", "")}`;
  if (tail.includes("delf")) return "DELF A2";
  if (tail.includes("sterk")) return "Sterke ww.";
  if (tail.includes("tijden")) return "Tijden";
  if (tail.includes("alfabet")) return "Alfabet";

  return tail;
}
