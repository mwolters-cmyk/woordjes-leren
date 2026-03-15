"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListById, isPlaceholder } from "@/data/registry";
import { getListProgress } from "@/lib/storage";
import { getListStats, getBoxDistribution } from "@/lib/leitner";
import { calculateReadiness } from "@/lib/readiness";
import { WordList, ListProgress, JAARLAAG_LABELS, LIST_TYPE_LABELS } from "@/lib/types";
import { Direction, DIRECTION_SHORT, supportsDirection } from "@/lib/direction";
import LeitnerBoxes from "@/components/LeitnerBoxes";
import ToetsklaarMeter from "@/components/ToetsklaarMeter";
import {
  hasGrammarGenerator, getGrammarGenerator, getGrammarConceptsAsWords,
} from "@/lib/grammarRegistry";
import type { GrammarGenerator } from "@/lib/grammarTypes";
import { DER_GRUPPE, EIN_GRUPPE } from "@/data/grammar/de-faelle";
import { RELATIVE_PRONOUN, CONJUNCTIVUS } from "@/data/grammar/gr-gram-t20";

const MODES = [
  {
    id: "flashcards",
    label: "Flashcards",
    icon: "\u{1F4C7}",
    description: "Bekijk kaarten en geef aan of je het woord kent",
  },
  {
    id: "schrijven",
    label: "Schrijven",
    icon: "\u{270D}\u{FE0F}",
    description: "Typ de vertaling van elk woord",
  },
  {
    id: "meerkeuze",
    label: "Meerkeuze",
    icon: "\u{1F4CB}",
    description: "Kies de juiste vertaling uit 4 opties",
  },
  {
    id: "toets",
    label: "Toets",
    icon: "\u{1F4DD}",
    description: "Mix van schrijven en meerkeuze",
  },
];

export default function ListDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [list, setList] = useState<WordList | null>(null);
  const [progress, setProgress] = useState<ListProgress | null>(null);
  const [direction, setDirection] = useState<Direction>("vt-nl");

  useEffect(() => {
    const found = getListById(id);
    if (found) {
      setList(found);
      setProgress(getListProgress(id));
    }
  }, [id]);

  if (!list) {
    return (
      <div className="text-center py-12">
        <p className="text-text-light text-lg">Lijst niet gevonden.</p>
        <Link href="/" className="text-primary-light underline mt-2 inline-block">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  const empty = isPlaceholder(list);
  const backUrl = list.jaarlaag === "bovenbouw"
    ? "/klas/bovenbouw"
    : `/klas/${list.jaarlaag}`;

  // Placeholder view
  if (empty) {
    return (
      <div>
        <Link href={backUrl} className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug naar {JAARLAAG_LABELS[String(list.jaarlaag)]}
        </Link>

        <div className="card p-8 text-center max-w-lg mx-auto">
          <div className="text-5xl mb-4">{"\u{1F6A7}"}</div>
          <h2 className="text-2xl font-bold text-text mb-2">{list.title}</h2>
          <div className="flex justify-center gap-2 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
              {LIST_TYPE_LABELS[list.listType]}
            </span>
            {list.source && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
                {list.source}
              </span>
            )}
            {list.module && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
                Module {list.module}
              </span>
            )}
          </div>
          <p className="text-text-light mb-6">
            Deze lijst wordt binnenkort aangevuld met woorden.
            <br />
            Kom snel terug!
          </p>
          <Link
            href={backUrl}
            className="inline-block py-2 px-6 rounded-lg text-white font-medium"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Terug naar {JAARLAAG_LABELS[String(list.jaarlaag)]}
          </Link>
        </div>
      </div>
    );
  }

  // ── Grammar generator view ──
  const grammarGen = hasGrammarGenerator(list.id) ? getGrammarGenerator(list.id) : null;
  if (grammarGen) {
    const grammarWords = getGrammarConceptsAsWords(list.id);
    const grammarStats = getListStats(grammarWords, progress);
    const grammarDist = getBoxDistribution(grammarWords, progress);
    const grammarReadiness = calculateReadiness(grammarWords, progress);

    const GRAMMAR_MODES = [
      { id: "meerkeuze", label: "Meerkeuze", icon: "📋", description: "Kies het juiste antwoord uit 4 opties" },
      { id: "oefenen", label: "Invullen", icon: "✍️", description: "Typ het juiste antwoord" },
      { id: "toets", label: "Toets", icon: "📝", description: "Mix van invullen en meerkeuze" },
    ];

    return (
      <div>
        <Link href={backUrl} className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug naar {JAARLAAG_LABELS[String(list.jaarlaag)]}
        </Link>

        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="text-2xl font-bold text-text">{list.title}</h2>
            <div className="flex gap-1">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
                {LIST_TYPE_LABELS[list.listType]}
              </span>
              {list.source && (
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
                  {list.source}
                </span>
              )}
            </div>
          </div>
          {list.description && (
            <p className="text-text-light mb-4">{list.description}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <ToetsklaarMeter readiness={grammarReadiness} />
            </div>
            <div>
              <p className="text-sm text-text-light mb-1">Leitner verdeling</p>
              <LeitnerBoxes distribution={grammarDist} />
            </div>
          </div>

          <div className="flex gap-4 text-sm text-text-light">
            <span>{grammarStats.total} concepten</span>
            <span>{grammarStats.learned} beheerst</span>
            <span>{grammarStats.inProgress} bezig</span>
            <span>{grammarStats.new} nieuw</span>
          </div>
        </div>

        {/* Grammar blocks overview */}
        <h3 className="text-lg font-semibold mb-4">Grammatica-blokken</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {grammarGen.GRAMMAR_BLOCKS.map(b => {
            const count = grammarGen.getConceptsByBlock(b.block).length;
            return (
              <div key={b.block} className="card p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <h4 className="font-bold text-text">Blok {b.block}: {b.title}</h4>
                    <p className="text-sm text-text-light mt-1">{b.description}</p>
                    <p className="text-xs text-text-light mt-1">{count} concepten</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Exercise modes */}
        <h3 className="text-lg font-semibold mb-4">Kies een oefenmodus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {GRAMMAR_MODES.map((mode) => (
            <Link
              key={mode.id}
              href={`/lijst/${id}/grammatica/${mode.id}`}
              className="card p-5 hover:shadow-lg transition-shadow flex items-start gap-4"
            >
              <span className="text-3xl">{mode.icon}</span>
              <div>
                <h4 className="font-semibold text-text">{mode.label}</h4>
                <p className="text-sm text-text-light">{mode.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Reference tables */}
        {list.id === "k3-m3-de-gram-k46" && <GermanReferenceTables />}
        {list.id === "k3-m3-gr-gram-t20" && <GreekReferenceTables />}
      </div>
    );
  }

  // Active list view (vocabulary)
  const stats = getListStats(list.words, progress);
  const dist = getBoxDistribution(list.words, progress);
  const readiness = calculateReadiness(list.words, progress);

  return (
    <div>
      <Link href={backUrl} className="text-primary-light hover:underline text-sm mb-4 inline-block">
        &larr; Terug naar {JAARLAAG_LABELS[String(list.jaarlaag)]}
      </Link>

      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-2xl font-bold text-text">{list.title}</h2>
          <div className="flex gap-1">
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
              {LIST_TYPE_LABELS[list.listType]}
            </span>
            {list.source && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-text-light">
                {list.source}
              </span>
            )}
          </div>
        </div>
        {list.description && (
          <p className="text-text-light mb-4">{list.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <ToetsklaarMeter readiness={readiness} />
          </div>
          <div>
            <p className="text-sm text-text-light mb-1">Leitner verdeling</p>
            <LeitnerBoxes distribution={dist} />
          </div>
        </div>

        <div className="flex gap-4 text-sm text-text-light">
          <span>{stats.total} woorden</span>
          <span>{stats.learned} geleerd</span>
          <span>{stats.inProgress} bezig</span>
          <span>{stats.new} nieuw</span>
        </div>
      </div>

      {/* Direction picker for FR/EN/DE */}
      {supportsDirection(list.language.from) && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Richting</h3>
          <div className="flex gap-2">
            {(["vt-nl", "nl-vt", "mix"] as Direction[]).map((dir) => (
              <button
                key={dir}
                onClick={() => setDirection(dir)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  direction === dir
                    ? "bg-primary text-white"
                    : "bg-gray-100 text-text-light hover:bg-gray-200"
                }`}
              >
                {DIRECTION_SHORT[dir]}
              </button>
            ))}
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">Kies een oefenmodus</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {MODES.map((mode) => {
          const dirParam = supportsDirection(list.language.from) && direction !== "vt-nl"
            ? `?richting=${direction}`
            : "";
          return (
            <Link
              key={mode.id}
              href={`/lijst/${id}/${mode.id}${dirParam}`}
              className="card p-5 hover:shadow-lg transition-shadow flex items-start gap-4"
            >
              <span className="text-3xl">{mode.icon}</span>
              <div>
                <h4 className="font-semibold text-text">{mode.label}</h4>
                <p className="text-sm text-text-light">{mode.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-3">Alle woorden</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-text-light">Woord</th>
                <th className="text-left py-2 pr-4 font-medium text-text-light">Vertaling</th>
                {list.words.some((w) => w.extra) && (
                  <th className="text-left py-2 font-medium text-text-light">Extra</th>
                )}
              </tr>
            </thead>
            <tbody>
              {list.words.map((word) => (
                <tr key={word.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4 font-medium">{word.term}</td>
                  <td className="py-2 pr-4">{word.definition}</td>
                  {list.words.some((w) => w.extra) && (
                    <td className="py-2 text-text-light text-xs">{word.extra}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── German grammar reference tables ─────────────────────────────

function GermanReferenceTables() {
  const [open, setOpen] = useState(false);

  const cases = ["nominativ", "dativ", "akkusativ"] as const;
  const caseLabels = { nominativ: "1. Nominativ", dativ: "3. Dativ", akkusativ: "4. Akkusativ" };
  const genderHeaders = ["mannelijk", "vrouwelijk", "onzijdig", "meervoud"];
  const genderKeys = ["m", "f", "n", "pl"] as const;

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-semibold text-text cursor-pointer"
      >
        <span>📚 Naslagtabellen</span>
        <span className="text-text-light">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          {/* Der-Gruppe */}
          <div>
            <h4 className="font-bold text-text mb-2">Der-Gruppe (bepaald lidwoord)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b border-gray-200"></th>
                    {genderHeaders.map(h => (
                      <th key={h} className="text-center p-2 border-b border-gray-200 font-medium text-text-light">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c} className="border-b border-gray-100">
                      <td className="p-2 font-medium text-text-light">{caseLabels[c]}</td>
                      {genderKeys.map(g => (
                        <td key={g} className="p-2 text-center font-semibold">{DER_GRUPPE[c][g]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-light mt-1">
              💡 Dativ meervoud: zelfstandig naamwoord krijgt extra -n (mit den Kinder<strong>n</strong>), behalve als meervoud al op -n of -s eindigt.
            </p>
          </div>

          {/* Ein-Gruppe */}
          <div>
            <h4 className="font-bold text-text mb-2">Ein-Gruppe (onbepaald lidwoord)</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b border-gray-200"></th>
                    {genderHeaders.map(h => (
                      <th key={h} className="text-center p-2 border-b border-gray-200 font-medium text-text-light">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map(c => (
                    <tr key={c} className="border-b border-gray-100">
                      <td className="p-2 font-medium text-text-light">{caseLabels[c]}</td>
                      {genderKeys.map(g => (
                        <td key={g} className="p-2 text-center font-semibold">{EIN_GRUPPE[c][g]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-text-light mt-1">
              💡 Bezittelijke voornaamwoorden (mein, dein, sein, ihr, unser, euer) volgen hetzelfde patroon.
            </p>
          </div>

          {/* Prepositions summary */}
          <div>
            <h4 className="font-bold text-text mb-2">Voorzetsels</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="font-semibold text-blue-800 mb-1">+ Dativ (altijd)</p>
                <p className="text-blue-700">aus, bei, mit, nach, seit, von, zu</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <p className="font-semibold text-red-800 mb-1">+ Akkusativ (altijd)</p>
                <p className="text-red-700">bis, durch, für, gegen, ohne, um</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 sm:col-span-2">
                <p className="font-semibold text-purple-800 mb-1">Wechselpräpositionen (Dativ óf Akkusativ)</p>
                <p className="text-purple-700 mb-1">an, auf, hinter, in, neben, über, unter, vor, zwischen</p>
                <p className="text-purple-600 text-xs">Wo? (locatie) → Dativ &nbsp;|&nbsp; Wohin? (beweging) → Akkusativ</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Greek grammar reference tables ──────────────────────────────

function GreekReferenceTables() {
  const [open, setOpen] = useState(false);

  const cases = ["nom", "gen", "dat", "acc"] as const;
  const caseLabels = { nom: "Nominatief", gen: "Genitief", dat: "Datief", acc: "Accusatief" };
  const genders = ["m", "f", "n"] as const;
  const genderHeaders = ["mannelijk", "vrouwelijk", "onzijdig"];

  return (
    <div className="card p-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between font-semibold text-text cursor-pointer"
      >
        <span>📚 Naslagtabellen</span>
        <span className="text-text-light">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="mt-4 space-y-6">
          {/* Betrekkelijk voornaamwoord */}
          <div>
            <h4 className="font-bold text-text mb-2">Betrekkelijk voornaamwoord ὅς, ἥ, ὅ</h4>
            {(["sg", "pl"] as const).map(num => (
              <div key={num} className="mb-3">
                <p className="text-sm font-medium text-text-light mb-1">{num === "sg" ? "Enkelvoud" : "Meervoud"}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b border-gray-200"></th>
                        {genderHeaders.map(h => (
                          <th key={h} className="text-center p-2 border-b border-gray-200 font-medium text-text-light">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {cases.map(c => (
                        <tr key={c} className="border-b border-gray-100">
                          <td className="p-2 font-medium text-text-light">{caseLabels[c]}</td>
                          {genders.map(g => (
                            <td key={g} className="p-2 text-center font-semibold">{RELATIVE_PRONOUN[num][c][g]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Conjunctivus λύω */}
          <div>
            <h4 className="font-bold text-text mb-2">Conjunctivus van λύω</h4>
            <p className="text-xs text-text-light mb-2">💡 Kenmerk: lange klinker ω/η in de uitgang (i.p.v. ο/ε)</p>
            {(["praes", "aor"] as const).map(tense => (
              <div key={tense} className="mb-3">
                <p className="text-sm font-medium text-text-light mb-1">{tense === "praes" ? "Praesens" : "Aoristus"}</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr>
                        <th className="text-left p-2 border-b border-gray-200"></th>
                        <th className="text-center p-2 border-b border-gray-200 font-medium text-text-light">Actief</th>
                        <th className="text-center p-2 border-b border-gray-200 font-medium text-text-light">Medium</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([1, 2, 3] as const).flatMap(p =>
                        (["sg", "pl"] as const).map(n => (
                          <tr key={`${p}${n}`} className="border-b border-gray-100">
                            <td className="p-2 font-medium text-text-light">{p}e pers. {n === "sg" ? "ev." : "mv."}</td>
                            <td className="p-2 text-center font-semibold">{CONJUNCTIVUS[tense].act[p][n]}</td>
                            <td className="p-2 text-center font-semibold">{CONJUNCTIVUS[tense].med[p][n]}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Conjunctivus gebruik */}
          <div>
            <h4 className="font-bold text-text mb-2">Conjunctivus gebruik</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="font-semibold text-blue-800 mb-1">Hoofdzin</p>
                <p className="text-blue-700 text-xs">• <strong>Dubitativus</strong>: twijfelvraag ("zal ik...?")</p>
                <p className="text-blue-700 text-xs">• <strong>Adhortativus</strong>: aansporing ("laten wij...")</p>
                <p className="text-blue-700 text-xs">• <strong>Verbod</strong>: μή + conj. aor. ("doe niet...")</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50">
                <p className="font-semibold text-purple-800 mb-1">Bijzin</p>
                <p className="text-purple-700 text-xs">• <strong>Doelzin</strong>: ἵνα/ὅπως/ὡς + conj. ("opdat")</p>
                <p className="text-purple-700 text-xs">• <strong>Voorwaarde</strong>: ἐάν + conj. ("als/indien")</p>
                <p className="text-purple-700 text-xs">• <strong>Tijdsbijzin</strong>: ἐπεάν + conj. ("wanneer")</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
