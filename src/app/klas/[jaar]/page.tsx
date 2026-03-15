"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  JAARLAAG_LABELS,
  MODULE_LABELS,
  LANGUAGE_LABELS,
  LANGUAGE_EMOJI,
  LIST_TYPE_LABELS,
  type Jaarlaag,
  type Module,
  type Language,
} from "@/lib/types";
import { getListsByJaarlaag, getListsByModule, isPlaceholder } from "@/data/registry";
import { getListProgress } from "@/lib/storage";
import { getListStats } from "@/lib/leitner";
import { useEffect, useState } from "react";
import ProgressBar from "@/components/ProgressBar";

function parseJaarlaag(param: string): Jaarlaag {
  if (param === "bovenbouw") return "bovenbouw";
  const num = parseInt(param);
  if (num >= 1 && num <= 3) return num as Jaarlaag;
  return 1;
}

export default function KlasPage() {
  const params = useParams();
  const jaarlaag = parseJaarlaag(params.jaar as string);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isBovenbouw = jaarlaag === "bovenbouw";
  const modules: Module[] = [1, 2, 3];

  if (isBovenbouw) {
    // Bovenbouw: show lists grouped by language, no modules
    const lists = getListsByJaarlaag("bovenbouw");
    const byLang: Record<string, typeof lists> = {};
    for (const list of lists) {
      const lang = list.language.from;
      if (!byLang[lang]) byLang[lang] = [];
      byLang[lang].push(list);
    }

    return (
      <div>
        <Link href="/" className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug naar overzicht
        </Link>
        <h2 className="text-2xl font-bold text-text mb-6">
          {JAARLAAG_LABELS[String(jaarlaag)]}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(byLang).map(([lang, langLists]) => (
            <div key={lang} className="card p-5">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <span>{LANGUAGE_EMOJI[lang as Language]}</span>
                {LANGUAGE_LABELS[lang as Language]}
              </h3>
              <div className="space-y-2">
                {langLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lijst/${list.id}`}
                    className={`block p-3 rounded-lg border text-sm transition-colors ${
                      isPlaceholder(list)
                        ? "border-dashed border-gray-300 text-text-light"
                        : "border-gray-200 hover:border-primary-light"
                    }`}
                  >
                    <span className="font-medium">{list.title}</span>
                    {isPlaceholder(list) && (
                      <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        binnenkort
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Klas 1-3: show modules
  return (
    <div>
      <Link href="/" className="text-primary-light hover:underline text-sm mb-4 inline-block">
        &larr; Terug naar overzicht
      </Link>
      <h2 className="text-2xl font-bold text-text mb-6">
        {JAARLAAG_LABELS[String(jaarlaag)]}
      </h2>

      {/* Rekentoets link for Klas 1 */}
      {jaarlaag === 1 && (
        <Link
          href="/rekentoets"
          className="card p-4 mb-6 hover:shadow-lg transition-shadow flex items-center gap-4"
        >
          <span className="text-3xl">🧮</span>
          <div>
            <h3 className="font-bold text-text">Rekentoets oefenen</h3>
            <p className="text-sm text-text-light">
              Oefen gehele getallen, decimalen, breuken en maateenheden
            </p>
          </div>
          <span className="ml-auto text-primary-light text-xl">&rarr;</span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {modules.map((mod) => {
          const modLists = getListsByModule(jaarlaag, mod);
          const byLang: Record<string, typeof modLists> = {};
          for (const list of modLists) {
            const lang = list.language.from;
            if (!byLang[lang]) byLang[lang] = [];
            byLang[lang].push(list);
          }

          return (
            <div key={mod} className="card p-5">
              <h3 className="text-lg font-bold text-primary mb-4">
                {MODULE_LABELS[mod]}
              </h3>

              <div className="space-y-4">
                {(["fr", "en", "de", "la", "gr", "nl"] as Language[])
                  .filter((lang) => byLang[lang])
                  .map((lang) => (
                    <div key={lang}>
                      <h4 className="text-sm font-semibold text-text-light mb-2 flex items-center gap-1">
                        <span>{LANGUAGE_EMOJI[lang]}</span>
                        {LANGUAGE_LABELS[lang]}
                      </h4>
                      <div className="space-y-1">
                        {byLang[lang].map((list) => {
                          const empty = isPlaceholder(list);
                          const progress = mounted ? getListProgress(list.id) : null;
                          const stats = !empty ? getListStats(list.words, progress) : null;

                          return (
                            <Link
                              key={list.id}
                              href={`/lijst/${list.id}`}
                              className={`block p-2 rounded-lg text-sm transition-colors ${
                                empty
                                  ? "text-text-light hover:bg-gray-50"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className={empty ? "" : "font-medium"}>
                                  {list.title.replace(`${LANGUAGE_LABELS[lang]} - `, "")}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-text-light">
                                    {LIST_TYPE_LABELS[list.listType]}
                                  </span>
                                  {empty && (
                                    <span className="text-xs text-text-light">
                                      binnenkort
                                    </span>
                                  )}
                                </div>
                              </div>
                              {stats && stats.total > 0 && (
                                <div className="mt-1">
                                  <ProgressBar
                                    current={stats.learned}
                                    total={stats.total}
                                  />
                                </div>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
