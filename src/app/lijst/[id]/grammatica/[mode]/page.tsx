"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { getListById } from "@/data/registry";
import { getGrammarGenerator } from "@/lib/grammarRegistry";
import type { GrammarQuestion, GrammarBlock } from "@/lib/grammarTypes";
import { getListProgress, updateWordProgress } from "@/lib/storage";
import { promoteWord, demoteWord } from "@/lib/leitner";
import { type WordProgress, type LeitnerBox } from "@/lib/types";

// ─── Exercise page for German grammar ───────────────────────────

type Mode = "oefenen" | "meerkeuze" | "toets";

function getOrCreateProgress(listId: string, conceptId: string): WordProgress {
  const lp = getListProgress(listId);
  if (lp?.wordProgress[conceptId]) return lp.wordProgress[conceptId];
  return {
    wordId: conceptId,
    listId,
    box: 1 as LeitnerBox,
    lastSeen: new Date().toISOString(),
    correctCount: 0,
    incorrectCount: 0,
  };
}

export default function GrammarExercisePage() {
  const params = useParams();
  const listId = params.id as string;
  const modeParam = params.mode as string;
  const mode: Mode = (["oefenen", "meerkeuze", "toets"].includes(modeParam)
    ? modeParam
    : "meerkeuze") as Mode;

  const [questions, setQuestions] = useState<GrammarQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<GrammarBlock | "all">("all");
  const [started, setStarted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const list = getListById(listId);
  const gen = getGrammarGenerator(listId);
  const backUrl = `/lijst/${listId}`;

  // Generate questions when block is selected
  const startExercise = useCallback((block: GrammarBlock | "all") => {
    if (!gen) return;
    let qs: GrammarQuestion[];
    if (block === "all") {
      // Generate a mix from all blocks
      const allConcepts = gen.ALL_CONCEPTS.map(c => c.id);
      // Pick ~20 random concepts
      const shuffled = allConcepts.sort(() => Math.random() - 0.5);
      qs = gen.generateSession(shuffled.slice(0, 20));
    } else {
      qs = gen.generateBlock(block);
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setUserAnswer("");
    setFeedback(null);
    setResults([]);
    setFinished(false);
    setStarted(true);
  }, [gen]);

  useEffect(() => {
    if (started) inputRef.current?.focus();
  }, [currentIndex, started]);

  // Determine if current question is MC or fill-in
  const isMC = mode === "meerkeuze" || (mode === "toets" && currentIndex % 2 === 0);

  const handleSubmit = (answer?: string) => {
    if (feedback || !questions.length) return;
    const q = questions[currentIndex];
    const input = answer ?? userAnswer;
    const isCorrect = gen ? gen.checkGrammarAnswer(input, q) : false;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setResults([...results, isCorrect]);

    // Update Leitner progress
    const wp = getOrCreateProgress(listId, q.conceptId);
    const updated = isCorrect ? promoteWord(wp) : demoteWord(wp);
    updateWordProgress(listId, updated);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setFeedback(null);
    }
  };

  const modeLabels: Record<Mode, string> = {
    oefenen: "Invullen",
    meerkeuze: "Meerkeuze",
    toets: "Toets",
  };

  const title = list?.title ?? "Grammatica";

  // ── Block selection ──
  if (!started) {
    return (
      <div>
        <Link href={backUrl} className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug
        </Link>
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-text mb-2">{modeLabels[mode]}</h2>
          <p className="text-text-light">Kies een blok om te oefenen</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-6">
          {(gen?.GRAMMAR_BLOCKS ?? []).map(b => {
            const conceptCount = gen?.getConceptsByBlock(b.block).length ?? 0;
            return (
              <button
                key={b.block}
                onClick={() => { setSelectedBlock(b.block); startExercise(b.block); }}
                className="card p-5 hover:shadow-lg transition-shadow text-left cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{b.icon}</span>
                  <div>
                    <h3 className="font-bold text-text">Blok {b.block}: {b.title}</h3>
                    <p className="text-sm text-text-light mt-1">{b.description}</p>
                    <p className="text-xs text-text-light mt-2">{conceptCount} concepten</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => { setSelectedBlock("all"); startExercise("all"); }}
            className="card p-5 hover:shadow-lg transition-shadow w-full flex items-center justify-center gap-3 text-center cursor-pointer"
          >
            <span className="text-3xl">📝</span>
            <div>
              <h3 className="font-bold text-text text-lg">Alle blokken</h3>
              <p className="text-sm text-text-light">Mix van alle grammatica (20 vragen)</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Finished: show score ──
  if (finished) {
    const correct = results.filter(Boolean).length;
    const total = results.length;
    const pct = Math.round((correct / total) * 100);
    const blockTitle = selectedBlock === "all"
      ? "Alle blokken"
      : `Blok ${selectedBlock}: ${gen?.GRAMMAR_BLOCKS.find(b => b.block === selectedBlock)?.title}`;

    return (
      <div>
        <Link href={backUrl} className="text-primary-light hover:underline text-sm mb-4 inline-block">
          &larr; Terug
        </Link>

        <div className="card p-8 max-w-lg mx-auto text-center">
          <div className="text-5xl mb-4">
            {pct >= 80 ? "🎉" : pct >= 60 ? "👍" : "💪"}
          </div>
          <h2 className="text-2xl font-bold text-text mb-1">{blockTitle}</h2>
          <p className="text-sm text-text-light mb-3">{modeLabels[mode]}</p>
          <p className="text-4xl font-bold mb-2" style={{ color: pct >= 60 ? "var(--color-success)" : "var(--color-error)" }}>
            {correct}/{total}
          </p>
          <p className="text-text-light mb-6">{pct}% goed</p>

          {/* Show all questions with answers */}
          <div className="text-left space-y-3 mb-6">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className="p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: results[i]
                    ? "rgba(39, 174, 96, 0.08)"
                    : "rgba(231, 76, 60, 0.08)",
                }}
              >
                <p className="text-text mb-1">{q.display.replace("___", results[i] ? q.answer : "___")}</p>
                <div>
                  {results[i] ? (
                    <span className="text-success font-medium">✓ {q.answer}</span>
                  ) : (
                    <span className="text-error">
                      ✗ Antwoord: <strong>{q.answer}</strong>
                      <span className="text-text-light text-xs ml-2">({q.explanation})</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => startExercise(selectedBlock)}
              className="py-2 px-6 rounded-lg text-white font-medium cursor-pointer"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Opnieuw (nieuwe zinnen)
            </button>
            <Link
              href={backUrl}
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
  const blockTitle = selectedBlock === "all"
    ? "Mix"
    : `Blok ${selectedBlock}`;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href={backUrl} className="text-primary-light hover:underline text-sm">
          &larr; Terug
        </Link>
        <h2 className="font-semibold text-text">{blockTitle} — {modeLabels[mode]}</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="h-2 rounded-full transition-all duration-300"
          style={{
            width: `${(currentIndex / questions.length) * 100}%`,
            backgroundColor: "var(--color-primary)",
          }}
        />
      </div>

      <div className="max-w-lg mx-auto">
        {/* Question card */}
        <div className="card p-8 text-center mb-6">
          <div className="text-sm text-text-light mb-3 font-medium">
            Vul in
          </div>
          <p className="text-xl sm:text-2xl font-medium text-text">
            {q.display}
          </p>
          {q.hint && !feedback && (
            <p className="text-sm text-accent mt-3">{q.hint}</p>
          )}
        </div>

        {/* Answer area */}
        {isMC ? (
          // Multiple choice
          <div className="grid grid-cols-2 gap-3 mb-4">
            {q.options.map((opt, i) => {
              let bg = "bg-white border border-gray-200 hover:bg-gray-50";
              if (feedback) {
                if (opt === q.answer || q.altAnswers.includes(opt)) {
                  bg = "border-2 font-semibold";
                }
              }
              return (
                <button
                  key={i}
                  onClick={() => !feedback && handleSubmit(opt)}
                  disabled={feedback !== null}
                  className={`p-4 rounded-lg text-lg text-center cursor-pointer transition-colors ${bg} disabled:cursor-not-allowed`}
                  style={
                    feedback
                      ? (opt === q.answer || q.altAnswers.includes(opt))
                        ? { borderColor: "var(--color-success)", backgroundColor: "rgba(39, 174, 96, 0.1)" }
                        : {}
                      : {}
                  }
                >
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
          // Fill-in
          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={feedback !== null}
              placeholder="Typ je antwoord..."
              className="w-full px-4 py-3 rounded-lg border-2 text-xl outline-none transition-colors text-center"
              style={{
                borderColor: feedback
                  ? feedback === "incorrect"
                    ? "var(--color-error)"
                    : "var(--color-success)"
                  : "var(--color-primary-light)",
              }}
              autoComplete="off"
            />
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
        )}

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
              <p className="text-xs text-text-light mt-2">{q.explanation}</p>
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
