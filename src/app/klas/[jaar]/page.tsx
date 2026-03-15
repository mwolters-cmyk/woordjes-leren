"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
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
import { useEffect, useState, useCallback } from "react";
import ProgressBar from "@/components/ProgressBar";
import ProefwerkBanner from "@/components/ProefwerkBanner";

function parseJaarlaag(param: string): Jaarlaag {
  if (param === "bovenbouw") return "bovenbouw";
  const num = parseInt(param);
  if (num >= 1 && num <= 3) return num as Jaarlaag;
  return 1;
}

// Subject type includes languages + rekenen
type Subject = Language | "rekenen";

const SUBJECT_LABELS: Record<Subject, string> = {
  fr: "Frans",
  en: "Engels",
  de: "Duits",
  la: "Latijn",
  gr: "Grieks",
  nl: "Nederlands",
  rekenen: "Rekenen",
};

const SUBJECT_EMOJI: Record<Subject, string> = {
  ...LANGUAGE_EMOJI,
  rekenen: "🧮",
};

export default function KlasPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const jaarlaag = parseJaarlaag(params.jaar as string);
  const [mounted, setMounted] = useState(false);

  // Get active filter from URL
  const activeFilter = searchParams.get("vak") as Subject | null;

  const setFilter = useCallback((subject: Subject | null) => {
    const url = subject
      ? `/klas/${params.jaar}?vak=${subject}`
      : `/klas/${params.jaar}`;
    router.replace(url, { scroll: false });
  }, [params.jaar, router]);

  useEffect(() => setMounted(true), []);

  const isBovenbouw = jaarlaag === "bovenbouw";
  const modules: Module[] = [1, 2, 3];

  // Determine available subjects for this jaarlaag
  const allLists = getListsByJaarlaag(jaarlaag);
  const availableLangs = Array.from(new Set(allLists.map((l) => l.language.from))) as Language[];
  const langOrder: Language[] = ["fr", "en", "de", "la", "gr", "nl"];
  const sortedLangs = langOrder.filter((l) => availableLangs.includes(l));

  const hasRekenen = jaarlaag === 1;
  const subjects: Subject[] = [...sortedLangs, ...(hasRekenen ? ["rekenen" as Subject] : [])];

  if (isBovenbouw) {
    // Bovenbouw: show lists grouped by language, no modules
    const byLang: Record<string, typeof allLists> = {};
    for (const list of allLists) {
      const lang = list.language.from;
      if (!byLang[lang]) byLang[lang] = [];
      byLang[lang].push(list);
    }

    const filteredLangs = activeFilter && activeFilter !== "rekenen"
      ? sortedLangs.filter((l) => l === activeFilter)
      : sortedLangs;

    return (
      <div>
        <Link href="/" className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug naar overzicht
        </Link>
        <h2 className="text-2xl font-bold text-text mb-4">
          {JAARLAAG_LABELS[String(jaarlaag)]}
        </h2>

        {/* Subject filter bar */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeFilter
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-light hover:bg-gray-200"
            }`}
          >
            Alles
          </button>
          {subjects.map((subj) => (
            <button
              key={subj}
              onClick={() => setFilter(activeFilter === subj ? null : subj)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
                activeFilter === subj
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-text-light hover:bg-gray-200"
              }`}
            >
              <span>{SUBJECT_EMOJI[subj]}</span>
              {SUBJECT_LABELS[subj]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLangs
            .filter((lang) => byLang[lang])
            .map((lang) => (
            <div key={lang} className="card p-5">
              <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                <span>{LANGUAGE_EMOJI[lang]}</span>
                {LANGUAGE_LABELS[lang]}
              </h3>
              <div className="space-y-2">
                {byLang[lang].map((list) => (
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

  // Klas 1-3: show modules with subject filter
  return (
    <div>
      <Link href="/" className="text-primary-light hover:underline text-sm mb-4 inline-block">
        &larr; Terug naar overzicht
      </Link>
      <h2 className="text-2xl font-bold text-text mb-4">
        {JAARLAAG_LABELS[String(jaarlaag)]}
      </h2>

      {/* Subject filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !activeFilter
              ? "bg-primary text-white"
              : "bg-gray-100 text-text-light hover:bg-gray-200"
          }`}
        >
          Alles
        </button>
        {subjects.map((subj) => (
          <button
            key={subj}
            onClick={() => setFilter(activeFilter === subj ? null : subj)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
              activeFilter === subj
                ? "bg-primary text-white"
                : "bg-gray-100 text-text-light hover:bg-gray-200"
            }`}
          >
            <span>{SUBJECT_EMOJI[subj]}</span>
            {SUBJECT_LABELS[subj]}
          </button>
        ))}
      </div>

      {/* Proefwerkweek banner */}
      {!activeFilter || activeFilter !== "rekenen" ? (
        <ProefwerkBanner jaarlaag={jaarlaag} />
      ) : null}

      {/* Rekenen section (only shown when filtered to Rekenen or showing all, Klas 1 only) */}
      {hasRekenen && (activeFilter === "rekenen" || !activeFilter) && (
        <div className="card p-5 mb-6">
          <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
            <span>🧮</span> Rekenen
          </h3>
          <Link
            href="/rekentoets"
            className="block p-3 rounded-lg border border-gray-200 hover:border-primary-light text-sm transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Rekentoets oefenen</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">
                4 blokken
              </span>
            </div>
            <p className="text-text-light text-xs mt-1">
              Gehele getallen · Decimalen · Breuken · Maateenheden
            </p>
          </Link>
        </div>
      )}

      {/* Only show language lists when not filtered to rekenen */}
      {activeFilter !== "rekenen" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {modules.map((mod) => {
            const modLists = getListsByModule(jaarlaag, mod);
            const byLang: Record<string, typeof modLists> = {};
            for (const list of modLists) {
              const lang = list.language.from;
              if (!byLang[lang]) byLang[lang] = [];
              byLang[lang].push(list);
            }

            // Which languages to show in this module
            const visibleLangs = activeFilter
              ? langOrder.filter((l) => l === activeFilter && byLang[l])
              : langOrder.filter((l) => byLang[l]);

            // Skip module entirely if no matching lists
            if (visibleLangs.length === 0) return null;

            return (
              <div key={mod} className="card p-5">
                <h3 className="text-lg font-bold text-primary mb-4">
                  {MODULE_LABELS[mod]}
                </h3>

                <div className="space-y-4">
                  {visibleLangs.map((lang) => (
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
      )}
    </div>
  );
}
