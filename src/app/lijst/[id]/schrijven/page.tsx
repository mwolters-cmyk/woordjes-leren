"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/data/registry";
import { getListProgress, updateWordProgress, incrementSessionCount, saveSessionResult } from "@/lib/storage";
import { getWordsForSession, promoteWord, demoteWord, getInitialProgress } from "@/lib/leitner";
import { Word, WordList, ExerciseResult } from "@/lib/types";
import { checkAnswer } from "@/lib/fuzzyMatch";
import { parseDirection, applyDirectionToWords } from "@/lib/direction";
import AccentHelper from "@/components/AccentHelper";
import ProgressBar from "@/components/ProgressBar";
import SessionSummary from "@/components/SessionSummary";

export default function SchrijvenPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = params.id as string;
  const direction = parseDirection(searchParams.get("richting"));
  const [list, setList] = useState<WordList | null>(null);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "close" | "incorrect" | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const found = getListById(listId);
    if (found) {
      setList(found);
      const progress = getListProgress(listId);
      const words = getWordsForSession(found.words, progress);
      setSessionWords(applyDirectionToWords(words, direction));
    }
  }, [listId]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!list || feedback) return;

    const word = sessionWords[currentIndex];
    const result = checkAnswer(answer, word.definition);

    setFeedback(result);

    const isCorrect = result === "correct" || result === "close";
    const progress = getListProgress(listId);
    const wordProgress = progress?.wordProgress[word.id] ?? getInitialProgress(word.id, listId);
    const updated = isCorrect ? promoteWord(wordProgress) : demoteWord(wordProgress);
    updateWordProgress(listId, updated);

    setResults([
      ...results,
      {
        wordId: word.id,
        correct: isCorrect,
        userAnswer: answer,
        correctAnswer: word.definition,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= sessionWords.length) {
      const allResults = results;
      incrementSessionCount(listId);
      saveSessionResult({
        listId,
        mode: "schrijven",
        date: new Date().toISOString(),
        results: allResults,
        score: Math.round(
          (allResults.filter((r) => r.correct).length / allResults.length) * 100
        ),
        duration: Math.round((Date.now() - startTime) / 1000),
      });
      setFinished(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setAnswer("");
      setFeedback(null);
    }
  };

  const handleOverrideCorrect = () => {
    if (!feedback || feedback === "correct") return;
    const word = sessionWords[currentIndex];

    // Update Leitner: undo demote, apply promote instead
    const progress = getListProgress(listId);
    const wordProgress = progress?.wordProgress[word.id] ?? getInitialProgress(word.id, listId);
    const updated = promoteWord(promoteWord(wordProgress)); // undo demote + promote
    updateWordProgress(listId, updated);

    // Update result to correct
    setResults((prev) =>
      prev.map((r, i) =>
        i === prev.length - 1 ? { ...r, correct: true } : r
      )
    );
    handleNext();
  };

  const handleInsertAccent = (char: string) => {
    setAnswer((prev) => prev + char);
    inputRef.current?.focus();
  };

  const handlePracticeErrors = () => {
    const errorWordIds = results.filter((r) => !r.correct).map((r) => r.wordId);
    const errorWords = sessionWords.filter((w) => errorWordIds.includes(w.id));
    setSessionWords(errorWords);
    setCurrentIndex(0);
    setAnswer("");
    setFeedback(null);
    setResults([]);
    setFinished(false);
  };

  if (!list) {
    return <div className="text-center py-12 text-text-light">Laden...</div>;
  }

  if (sessionWords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-text-light mb-4">
          Alle woorden zijn geleerd! Kom later terug voor herhaling.
        </p>
        <Link href={`/lijst/${listId}`} className="text-primary-light underline">
          Terug naar lijst
        </Link>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="py-8">
        <SessionSummary
          results={results}
          words={sessionWords}
          listId={listId}
          mode="schrijven"
          onPracticeErrors={
            results.some((r) => !r.correct) ? handlePracticeErrors : undefined
          }
        />
      </div>
    );
  }

  const currentWord = sessionWords[currentIndex];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href={`/lijst/${listId}`} className="text-primary-light hover:underline text-sm">
          &larr; Terug
        </Link>
        <h2 className="font-semibold text-text">{list.title} - Schrijven</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{sessionWords.length}
        </span>
      </div>

      <ProgressBar current={currentIndex} total={sessionWords.length} />

      <div className="mt-8 max-w-md mx-auto">
        <div className="card p-8 text-center mb-6">
          <p className="text-sm text-text-light mb-2">Vertaal dit woord:</p>
          <p className="text-3xl font-bold text-primary">{currentWord.term}</p>
          {currentWord.extra && (
            <p className="text-sm text-text-light mt-2">{currentWord.extra}</p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={feedback !== null}
            placeholder="Typ je antwoord..."
            className="w-full px-4 py-3 rounded-lg border-2 text-lg outline-none transition-colors"
            style={{
              borderColor: feedback
                ? feedback === "incorrect"
                  ? "var(--color-error)"
                  : "var(--color-success)"
                : "var(--color-primary-light)",
            }}
            autoComplete="off"
            autoCapitalize="off"
          />

          <AccentHelper language={list.language.from} onInsert={handleInsertAccent} />

          {!feedback && (
            <button
              type="submit"
              disabled={!answer.trim()}
              className="w-full mt-4 py-3 rounded-lg text-white font-medium text-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              Controleer
            </button>
          )}
        </form>

        {feedback && (
          <div className="mt-4">
            <div
              className="p-4 rounded-lg text-center mb-4"
              style={{
                backgroundColor:
                  feedback === "incorrect"
                    ? "rgba(231, 76, 60, 0.1)"
                    : "rgba(39, 174, 96, 0.1)",
              }}
            >
              {feedback === "correct" && (
                <p className="text-success font-semibold text-lg">Goed!</p>
              )}
              {feedback === "close" && (
                <div>
                  <p className="text-success font-semibold text-lg">Bijna goed!</p>
                  <p className="text-sm text-text-light mt-1">
                    Juiste antwoord: <strong>{currentWord.definition}</strong>
                  </p>
                </div>
              )}
              {feedback === "incorrect" && (
                <div>
                  <p className="text-error font-semibold text-lg">Helaas!</p>
                  <p className="text-sm text-text-light mt-1">
                    Juiste antwoord: <strong>{currentWord.definition}</strong>
                  </p>
                  <button
                    onClick={handleOverrideCorrect}
                    className="mt-2 text-xs text-text-light underline hover:text-text cursor-pointer"
                  >
                    Toch goed rekenen
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={handleNext}
              className="w-full py-3 rounded-lg text-white font-medium cursor-pointer"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {currentIndex + 1 < sessionWords.length ? "Volgende" : "Bekijk resultaat"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
