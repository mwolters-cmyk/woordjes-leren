"use client";

import { ExerciseResult, Word } from "@/lib/types";
import Link from "next/link";

interface SessionSummaryProps {
  results: ExerciseResult[];
  words: Word[];
  listId: string;
  mode: string;
  onPracticeErrors?: () => void;
}

export default function SessionSummary({
  results,
  words,
  listId,
  mode,
  onPracticeErrors,
}: SessionSummaryProps) {
  const correct = results.filter((r) => r.correct).length;
  const total = results.length;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const errors = results.filter((r) => !r.correct);

  const getWord = (id: string) => words.find((w) => w.id === id);

  return (
    <div className="card p-6 max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-center mb-4">Resultaat</h2>

      <div className="text-center mb-6">
        <div
          className="text-5xl font-bold mb-2"
          style={{
            color:
              pct >= 80
                ? "var(--color-success)"
                : pct >= 50
                ? "var(--color-accent)"
                : "var(--color-error)",
          }}
        >
          {pct}%
        </div>
        <p className="text-text-light">
          {correct} van {total} goed
        </p>
      </div>

      {errors.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-error">
            Fouten ({errors.length})
          </h3>
          <div className="space-y-2">
            {errors.map((r) => {
              const word = getWord(r.wordId);
              return (
                <div
                  key={r.wordId}
                  className="flex justify-between items-center p-2 bg-red-50 rounded-lg text-sm"
                >
                  <span className="font-medium">{word?.term}</span>
                  <div className="text-right">
                    <span className="text-error line-through mr-2">
                      {r.userAnswer}
                    </span>
                    <span className="text-success font-medium">
                      {r.correctAnswer}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {errors.length > 0 && onPracticeErrors && (
          <button
            onClick={onPracticeErrors}
            className="flex-1 py-3 px-4 rounded-lg font-medium text-white cursor-pointer"
            style={{ backgroundColor: "var(--color-accent)" }}
          >
            Oefen fouten
          </button>
        )}
        <Link
          href={`/lijst/${listId}`}
          className="flex-1 py-3 px-4 rounded-lg font-medium text-white text-center"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Terug naar lijst
        </Link>
      </div>
    </div>
  );
}
