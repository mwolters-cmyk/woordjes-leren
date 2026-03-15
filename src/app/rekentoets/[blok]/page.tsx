"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { generateBlock, generateFullTest, checkAnswer, BLOCKS, type Question, type QElement } from "@/lib/rekentoets";
import { saveRekentoetsResult } from "@/lib/storage";

// ──── Fraction display component ───────────────────────────────────

function FractionEl({ el }: { el: QElement }) {
  if (typeof el === "string") return <span>{el}</span>;

  const { w, n, d } = el;
  return (
    <span className="inline-flex items-center gap-0.5">
      {w !== undefined && w > 0 && <span>{w}</span>}
      <span className="inline-flex flex-col items-center" style={{ fontSize: "0.75em", lineHeight: 1.1, verticalAlign: "middle" }}>
        <span>{n}</span>
        <span style={{ width: "100%", height: "1px", background: "currentColor" }} />
        <span>{d}</span>
      </span>
    </span>
  );
}

function QuestionDisplay({ parts }: { parts: QElement[] }) {
  return (
    <span className="text-xl sm:text-2xl font-medium flex flex-wrap items-center gap-1">
      {parts.map((el, i) => (
        <FractionEl key={i} el={el} />
      ))}
    </span>
  );
}

// ──── Main page ────────────────────────────────────────────────────

export default function RekentoetsOefenPage() {
  const params = useParams();
  const blokParam = params.blok as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let qs: Question[];
    if (blokParam === "alles") {
      qs = generateFullTest();
    } else {
      const blockNum = parseInt(blokParam) as 1 | 2 | 3 | 4;
      if (blockNum >= 1 && blockNum <= 4) {
        qs = generateBlock(blockNum);
      } else {
        qs = [];
      }
    }
    setQuestions(qs);
  }, [blokParam]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const blockNum = blokParam === "alles" ? null : parseInt(blokParam);
  const blockInfo = blockNum ? BLOCKS.find(b => b.block === blockNum) : null;
  const title = blokParam === "alles"
    ? "Volledige toets"
    : blockInfo
      ? `Blok ${blockNum}: ${blockInfo.title}`
      : "Rekentoets";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback || !questions.length) return;

    const q = questions[currentIndex];
    const isCorrect = checkAnswer(userAnswer, q);
    setFeedback(isCorrect ? "correct" : "incorrect");
    setResults([...results, isCorrect]);
  };

  // Save results when finished
  useEffect(() => {
    if (!finished || questions.length === 0) return;
    const today = new Date().toISOString().slice(0, 10);

    if (blokParam === "alles") {
      // Save per block separately
      const blockGroups: Record<number, { correct: number; total: number }> = {};
      questions.forEach((q, i) => {
        if (!blockGroups[q.block]) blockGroups[q.block] = { correct: 0, total: 0 };
        blockGroups[q.block].total++;
        if (results[i]) blockGroups[q.block].correct++;
      });
      for (const [block, { correct, total }] of Object.entries(blockGroups)) {
        saveRekentoetsResult({
          block: Number(block) as 1 | 2 | 3 | 4,
          date: today,
          correct,
          total,
          percentage: Math.round((correct / total) * 100),
        });
      }
    } else {
      const bn = parseInt(blokParam) as 1 | 2 | 3 | 4;
      const correct = results.filter(Boolean).length;
      saveRekentoetsResult({
        block: bn,
        date: today,
        correct,
        total: results.length,
        percentage: Math.round((correct / results.length) * 100),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setFeedback(null);
    }
  };

  const handleRestart = () => {
    let qs: Question[];
    if (blokParam === "alles") {
      qs = generateFullTest();
    } else {
      const bn = parseInt(blokParam) as 1 | 2 | 3 | 4;
      qs = generateBlock(bn);
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setResults([]);
    setFinished(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-text-light text-lg">Blok niet gevonden.</p>
        <Link href="/rekentoets" className="text-primary-light underline mt-2 inline-block">
          Terug naar overzicht
        </Link>
      </div>
    );
  }

  // ── Finished: show score ──
  if (finished) {
    const correct = results.filter(Boolean).length;
    const total = results.length;
    const pct = Math.round((correct / total) * 100);

    return (
      <div>
        <Link href="/rekentoets" className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug naar overzicht
        </Link>

        <div className="card p-8 max-w-lg mx-auto text-center">
          <div className="text-5xl mb-4">
            {pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "💪"}
          </div>
          <h2 className="text-2xl font-bold text-text mb-2">{title}</h2>
          <p className="text-4xl font-bold mb-2" style={{ color: pct >= 60 ? "var(--color-success)" : "var(--color-error)" }}>
            {correct}/{total}
          </p>
          <p className="text-text-light mb-6">{pct}% goed</p>

          {/* Show all questions with answers */}
          <div className="text-left space-y-3 mb-6">
            {questions.map((q, i) => (
              <div
                key={q.id + i}
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: results[i]
                    ? "rgba(39, 174, 96, 0.08)"
                    : "rgba(231, 76, 60, 0.08)",
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-text-light">{q.label}.</span>
                  <QuestionDisplay parts={q.display} />
                </div>
                <div className="ml-8">
                  {results[i] ? (
                    <span className="text-success font-medium">
                      ✓ {q.answer}
                    </span>
                  ) : (
                    <span className="text-error">
                      ✗ Antwoord: <strong>{q.answer}</strong>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="py-2 px-6 rounded-lg text-white font-medium cursor-pointer"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Opnieuw (nieuwe opgaven)
            </button>
            <Link
              href="/rekentoets"
              className="py-2 px-6 rounded-lg font-medium border border-gray-300 hover:bg-gray-50"
            >
              Terug
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Exercise view ──
  const q = questions[currentIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href="/rekentoets" className="text-primary-light hover:underline text-sm">
          &larr; Terug
        </Link>
        <h2 className="font-semibold text-text">{title}</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex) / questions.length) * 100}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Question card */}
        <div className="card p-8 text-center mb-6">
          <div className="text-sm text-text-light mb-3 font-medium">
            Opgave {q.label}
          </div>
          <QuestionDisplay parts={q.display} />
          {q.hint && (
            <p className="text-sm text-accent mt-3">{q.hint}</p>
          )}
        </div>

        {/* Answer input */}
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="text-sm text-text-light block mb-1">
              {q.answerType === "fraction"
                ? "Antwoord (bijv. 3 1/2 of 7/2)"
                : q.answerType === "decimal"
                  ? "Antwoord (gebruik komma voor decimalen)"
                  : "Antwoord"}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={feedback !== null}
              placeholder={
                q.answerType === "fraction"
                  ? "bijv. 3 1/2"
                  : q.answerType === "decimal"
                    ? "bijv. 3,5"
                    : "bijv. 42"
              }
              className="w-full px-4 py-3 rounded-lg border-2 text-xl outline-none transition-colors text-center"
              style={{
                borderColor: feedback
                  ? feedback === "incorrect"
                    ? "var(--color-error)"
                    : "var(--color-success)"
                  : "var(--color-primary-light)",
              }}
              autoComplete="off"
              inputMode={q.answerType === "fraction" ? "text" : "decimal"}
            />
          </div>

          {!feedback && (
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className="w-full mt-3 py-3 rounded-lg text-white font-medium text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Controleer
            </button>
          )}
        </form>

        {/* Feedback */}
        {feedback && (
          <div className="mt-4">
            <div
              className="p-4 rounded-lg text-center mb-4"
              style={{
                backgroundColor: feedback === "incorrect"
                  ? "rgba(231, 76, 60, 0.1)"
                  : "rgba(39, 174, 96, 0.1)",
              }}
            >
              {feedback === "correct" ? (
                <p className="text-success font-semibold text-lg">Goed!</p>
              ) : (
                <div>
                  <p className="text-error font-semibold text-lg">Helaas!</p>
                  <p className="text-sm text-text-light mt-1">
                    Het juiste antwoord is: <strong className="text-text text-base">{q.answer}</strong>
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-lg text-white font-medium cursor-pointer"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {currentIndex + 1 < questions.length ? "Volgende" : "Bekijk resultaat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
