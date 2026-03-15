"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BLOCKS } from "@/lib/rekentoets";
import { getRekentoetsProgress } from "@/lib/storage";
import { calculateRekenReadiness, type RekenBlockReadiness, type RekenReadiness } from "@/lib/rekenReadiness";

function MiniMeter({ block }: { block: RekenBlockReadiness }) {
  const pct = block.score;
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: block.color }}
        />
      </div>
      <span className="text-xs font-medium whitespace-nowrap" style={{ color: block.color }}>
        {block.label}
      </span>
    </div>
  );
}

function TotalMeter({ readiness }: { readiness: RekenReadiness }) {
  const { totalScore, label, color, advice, practiceDays, blocks } = readiness;
  const masteredCount = blocks.filter((b) => b.mastered).length;

  return (
    <div className="card p-5 max-w-2xl mx-auto mb-6">
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `conic-gradient(${color} ${totalScore * 3.6}deg, #e5e7eb ${totalScore * 3.6}deg)`,
            }}
          />
          <div className="absolute inset-1.5 rounded-full bg-white flex items-center justify-center">
            <span className="text-sm font-bold" style={{ color }}>
              {totalScore}%
            </span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color }}>
            {label}
          </p>
          <p className="text-xs text-text-light mt-0.5">{advice}</p>
          <p className="text-xs text-text-light mt-1">
            {masteredCount}/4 blokken beheerst &middot; {practiceDays} oefen{practiceDays === 1 ? "dag" : "dagen"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RekentoetsPage() {
  const [readiness, setReadiness] = useState<RekenReadiness | null>(null);

  useEffect(() => {
    const progress = getRekentoetsProgress();
    setReadiness(calculateRekenReadiness(progress));
  }, []);

  return (
    <div>
      <Link href="/klas/1" className="text-primary-light hover:underline text-sm mb-4 inline-block">
        &larr; Terug naar Klas 1
      </Link>

      <div className="mb-6 text-center">
        <h2 className="text-3xl font-bold text-text mb-2">Rekentoets oefenen</h2>
        <p className="text-text-light text-lg">
          Oefen per blok of maak een volledige toets.
        </p>
      </div>

      {readiness && readiness.blocks.some((b) => b.attempts > 0) && (
        <TotalMeter readiness={readiness} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
        {BLOCKS.map((b) => {
          const br = readiness?.blocks.find((r) => r.block === b.block);
          return (
            <Link
              key={b.block}
              href={`/rekentoets/${b.block}`}
              className="card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{b.icon}</span>
                <div className="flex-1">
                  <h3 className="font-bold text-text">
                    Blok {b.block}: {b.title}
                  </h3>
                  <p className="text-sm text-text-light mt-1">{b.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-text-light">
                      {b.questionCount} opgaven
                    </p>
                    {br && br.attempts > 0 && (
                      <p className="text-xs text-text-light">
                        {br.attempts}x geoefend
                      </p>
                    )}
                  </div>
                  {br && br.attempts > 0 && <MiniMeter block={br} />}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="max-w-2xl mx-auto">
        <Link
          href="/rekentoets/alles"
          className="card p-5 hover:shadow-lg transition-shadow flex items-center justify-center gap-3 text-center"
        >
          <span className="text-3xl">📝</span>
          <div>
            <h3 className="font-bold text-text text-lg">Volledige toets</h3>
            <p className="text-sm text-text-light">Alle 4 blokken achter elkaar (17 opgaven)</p>
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center text-sm text-text-light">
        <p>Elke keer worden nieuwe opgaven gegenereerd.</p>
        <p>Alle antwoorden komen altijd &quot;mooi&quot; uit.</p>
      </div>
    </div>
  );
}
