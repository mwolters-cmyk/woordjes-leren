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

  // Active list view
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
