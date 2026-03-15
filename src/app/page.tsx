"use client";

import Link from "next/link";
import { JAARLAAG_LABELS, LANGUAGE_LABELS, LANGUAGE_EMOJI, type Jaarlaag, type Language } from "@/lib/types";
import { getListsByJaarlaag } from "@/data/registry";

const JAARLAGEN: { key: Jaarlaag; path: string }[] = [
  { key: 1, path: "/klas/1" },
  { key: 2, path: "/klas/2" },
  { key: 3, path: "/klas/3" },
  { key: "bovenbouw", path: "/klas/bovenbouw" },
];

function getJaarlaagSummary(jaarlaag: Jaarlaag) {
  const lists = getListsByJaarlaag(jaarlaag);
  const withWords = lists.filter((l) => l.words.length > 0);
  const langs = new Set(lists.map((l) => l.language.from));
  return {
    totalLists: lists.length,
    activeLists: withWords.length,
    languages: Array.from(langs) as Language[],
  };
}

export default function HomePage() {
  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-text mb-2">Welkom!</h2>
        <p className="text-text-light text-lg">
          Kies je klas om te beginnen met oefenen.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12">
        {JAARLAGEN.map(({ key, path }) => {
          const summary = getJaarlaagSummary(key);
          return (
            <Link
              key={String(key)}
              href={path}
              className="card p-6 hover:shadow-lg transition-shadow text-center"
            >
              <h3 className="text-2xl font-bold text-primary mb-2">
                {JAARLAAG_LABELS[String(key)]}
              </h3>
              <div className="flex justify-center gap-1 mb-3">
                {summary.languages.map((lang) => (
                  <span key={lang} title={LANGUAGE_LABELS[lang]} className="text-lg">
                    {LANGUAGE_EMOJI[lang]}
                  </span>
                ))}
                {key === 1 && (
                  <span title="Rekenen" className="text-lg">🧮</span>
                )}
              </div>
              <p className="text-sm text-text-light">
                {summary.totalLists} {summary.totalLists === 1 ? "lijst" : "lijsten"}
                {summary.activeLists > 0 && (
                  <span className="text-success"> ({summary.activeLists} actief)</span>
                )}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="text-center text-sm text-text-light">
        <p>
          Oefen je woordjes voor Frans, Engels, Duits, Latijn, Grieks en Nederlands.
        </p>
        <p>Je voortgang wordt automatisch opgeslagen in je browser.</p>
      </div>
    </div>
  );
}
