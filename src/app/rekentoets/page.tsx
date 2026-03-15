"use client";

import Link from "next/link";
import { BLOCKS } from "@/lib/rekentoets";

export default function RekentoetsPage() {
  return (
    <div>
      <Link href="/klas/1" className="text-primary-light hover:underline text-sm mb-4 inline-block">
        &larr; Terug naar Klas 1
      </Link>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-text mb-2">Rekentoets oefenen</h2>
        <p className="text-text-light text-lg">
          Oefen per blok of maak een volledige toets.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
        {BLOCKS.map((b) => (
          <Link
            key={b.block}
            href={`/rekentoets/${b.block}`}
            className="card p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{b.icon}</span>
              <div>
                <h3 className="font-bold text-text">
                  Blok {b.block}: {b.title}
                </h3>
                <p className="text-sm text-text-light mt-1">{b.description}</p>
                <p className="text-xs text-text-light mt-2">
                  {b.questionCount} opgaven
                </p>
              </div>
            </div>
          </Link>
        ))}
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
