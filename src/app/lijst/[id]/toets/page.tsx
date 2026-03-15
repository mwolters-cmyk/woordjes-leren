"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/data/registry";
import { getListProgress, updateWordProgress, incrementSessionCount, saveSessionResult } from "@/lib/storage";
import { getWordsForSession, promoteWord, demoteWord, getInitialProgress } from "@/lib/leitner";
import { Word, WordList, ExerciseResult } from "@/lib/types";
import { checkAnswer } from "@/lib/fuzzyMatch";
import AccentHelper from "@/components/AccentHelper";
import ProgressBar from "@/components/ProgressBar";
import SessionSummary from "@/components/SessionSummary";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type QuestionType = "schrijven" | "meerkeuze";

interface Question {
  word: Word;
  type: QuestionType;
  options?: string[]; // only for meerkeuze
}

function buildQuestions(sessionWords: Word[], allWords: Word[]): Question[] {
  return sessionWords.map((word, i) => {
    // Alternate between schrijven and meerkeuze
    const type: QuestionType = i % 2 === 0 ? "schrijven" : "meerkeuze";

    if (type === "meerkeuze") {
      const others = allWords
        .filter((w) => w.id !== word.id)
        .map((w) => w.definition);
      const shuffledOthers = shuffle(others).slice(0, 3);
      const options = shuffle([word.definition, ...shuffledOthers]);
      return { word, type, options };
    }

    return { word, type };
  });
}

export default function ToetsPage() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<WordList | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
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
      const qs = buildQuestions(words, found.words);
      setQuestions(qs);
    }
  }, [listId]);

  useEffect(() => {
    if (questions[currentIndex]?.type === "schrijven") {
      inputRef.current?.focus();
    }
  }, [currentIndex, questions]);

  const currentQ = questions[currentIndex] ?? null;

  const handleSchrijvenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQ || feedback) return;

    const result = checkAnswer(answer, currentQ.word.definition);
    setFeedback(result);

    const isCorrect = result === "correct" || result === "close";
    recordResult(isCorrect, answer);
  };

  const handleMeerkeuzeSelect = (option: string) => {
    if (selected || !currentQ) return;
    setSelected(option);

    const isCorrect = option === currentQ.word.definition;
    setFeedback(isCorrect ? "correct" : "incorrect");
    recordResult(isCorrect, option);
  };

  const recordResult = (isCorrect: boolean, userAnswer: string) => {
    if (!currentQ) return;
    const progress = getListProgress(listId);
    const wordProgress = progress?.wordProgress[currentQ.word.id] ?? getInitialProgress(currentQ.word.id, listId);
    const updated = isCorrect ? promoteWord(wordProgress) : demoteWord(wordProgress);
    updateWordProgress(listId, updated);

    setResults([
      ...results,
      {
        wordId: currentQ.word.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: currentQ.word.definition,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      const allResults = results;
      incrementSessionCount(listId);
      saveSessionResult({
        listId,
        mode: "toets",
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
      setSelected(null);
      setFeedback(null);
    }
  };

  const handleInsertAccent = (char: string) => {
    setAnswer((prev) => prev + char);
    inputRef.current?.focus();
  };

  const handlePracticeErrors = () => {
    if (!list) return;
    const errorWordIds = results.filter((r) => !r.correct).map((r) => r.wordId);
    const errorWords = questions
      .filter((q) => errorWordIds.includes(q.word.id))
      .map((q) => q.word);
    const qs = buildQuestions(errorWords, list.words);
    setQuestions(qs);
    setCurrentIndex(0);
    setAnswer("");
    setSelected(null);
    setFeedback(null);
    setResults([]);
    setFinished(false);
  };

  if (!list) {
    return <div className="text-center py-12 text-text-light">Laden...</div>;
  }

  if (questions.length === 0) {
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
          words={questions.map((q) => q.word)}
          listId={listId}
          mode="toets"
          onPracticeErrors={
            results.some((r) => !r.correct) ? handlePracticeErrors : undefined
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <Link href={`/lijst/${listId}`} className="text-primary-light hover:underline text-sm">
          &larr; Terug
        </Link>
        <h2 className="font-semibold text-text">{list.title} - Toets</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{questions.length}
        </span>
      </div>

      <ProgressBar current={currentIndex} total={questions.length} />

      <div className="mt-8 max-w-md mx-auto">
        <div className="card p-8 text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-light">
              {currentQ.type === "schrijven" ? "Schrijven" : "Meerkeuze"}
            </span>
          </div>
          <p className="text-sm text-text-light mb-2">Wat betekent:</p>
          <p className="text-3xl font-bold text-primary">{currentQ.word.term}</p>
          {currentQ.word.extra && (
            <p className="text-sm text-text-light mt-2">{currentQ.word.extra}</p>
          )}
        </div>

        {currentQ.type === "schrijven" ? (
          <div>
            <form onSubmit={handleSchrijvenSubmit}>
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
                  className="w-full mt-4 py-3 rounded-lg text-white font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "var(--color-primary)" }}
                >
                  Controleer
                </button>
              )}
            </form>

            {feedback && (
              <div
                className="mt-4 p-4 rounded-lg text-center"
                style={{
                  backgroundColor:
                    feedback === "incorrect"
                      ? "rgba(231, 76, 60, 0.1)"
                      : "rgba(39, 174, 96, 0.1)",
                }}
              >
                {feedback === "correct" && <p className="text-success font-semibold">Goed!</p>}
                {feedback === "close" && (
                  <div>
                    <p className="text-success font-semibold">Bijna goed!</p>
                    <p className="text-sm text-text-light mt-1">
                      Juiste antwoord: <strong>{currentQ.word.definition}</strong>
                    </p>
                  </div>
                )}
                {feedback === "incorrect" && (
                  <div>
                    <p className="text-error font-semibold">Helaas!</p>
                    <p className="text-sm text-text-light mt-1">
                      Juiste antwoord: <strong>{currentQ.word.definition}</strong>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {currentQ.options?.map((option, i) => {
              let bgColor = "white";
              let borderColor = "var(--color-primary-light)";
              let textColor = "var(--color-text)";

              if (selected) {
                if (option === currentQ.word.definition) {
                  bgColor = "rgba(39, 174, 96, 0.1)";
                  borderColor = "var(--color-success)";
                } else if (option === selected && option !== currentQ.word.definition) {
                  bgColor = "rgba(231, 76, 60, 0.1)";
                  borderColor = "var(--color-error)";
                } else {
                  borderColor = "#ddd";
                  textColor = "#999";
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleMeerkeuzeSelect(option)}
                  disabled={selected !== null}
                  className="w-full p-4 rounded-lg border-2 text-left font-medium transition-all cursor-pointer disabled:cursor-default"
                  style={{ backgroundColor: bgColor, borderColor, color: textColor }}
                >
                  <span className="text-sm opacity-60 mr-2">{String.fromCharCode(65 + i)}</span>
                  {option}
                </button>
              );
            })}
          </div>
        )}

        {feedback && (
          <button
            onClick={handleNext}
            className="w-full mt-6 py-3 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {currentIndex + 1 < questions.length ? "Volgende" : "Bekijk resultaat"}
          </button>
        )}
      </div>
    </div>
  );
}
