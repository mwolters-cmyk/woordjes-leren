"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/data/registry";
import { getListProgress, updateWordProgress, incrementSessionCount, saveSessionResult } from "@/lib/storage";
import { getWordsForSession, promoteWord, demoteWord, getInitialProgress } from "@/lib/leitner";
import { Word, WordList, ExerciseResult } from "@/lib/types";
import { parseDirection, applyDirectionToWords } from "@/lib/direction";
import Flashcard from "@/components/Flashcard";
import ProgressBar from "@/components/ProgressBar";
import SessionSummary from "@/components/SessionSummary";

export default function FlashcardsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const listId = params.id as string;
  const direction = parseDirection(searchParams.get("richting"));
  const [list, setList] = useState<WordList | null>(null);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const found = getListById(listId);
    if (found) {
      setList(found);
      const progress = getListProgress(listId);
      const words = getWordsForSession(found.words, progress);
      setSessionWords(applyDirectionToWords(words, direction));
    }
  }, [listId]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      if (!list || currentIndex >= sessionWords.length) return;

      const word = sessionWords[currentIndex];
      const progress = getListProgress(listId);
      const wordProgress = progress?.wordProgress[word.id] ?? getInitialProgress(word.id, listId);

      const updated = correct ? promoteWord(wordProgress) : demoteWord(wordProgress);
      updateWordProgress(listId, updated);

      const result: ExerciseResult = {
        wordId: word.id,
        correct,
        correctAnswer: word.definition,
      };

      const newResults = [...results, result];
      setResults(newResults);

      if (currentIndex + 1 >= sessionWords.length) {
        incrementSessionCount(listId);
        saveSessionResult({
          listId,
          mode: "flashcards",
          date: new Date().toISOString(),
          results: newResults,
          score: Math.round(
            (newResults.filter((r) => r.correct).length / newResults.length) * 100
          ),
          duration: Math.round((Date.now() - startTime) / 1000),
        });
        setFinished(true);
      } else {
        setCurrentIndex(currentIndex + 1);
        setFlipped(false);
      }
    },
    [list, currentIndex, sessionWords, results, listId, startTime]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowRight" && flipped) {
        handleAnswer(true);
      } else if (e.key === "ArrowLeft" && flipped) {
        handleAnswer(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flipped, finished, handleAnswer]);

  const handlePracticeErrors = () => {
    const errorWordIds = results.filter((r) => !r.correct).map((r) => r.wordId);
    const errorWords = sessionWords.filter((w) => errorWordIds.includes(w.id));
    setSessionWords(errorWords);
    setCurrentIndex(0);
    setResults([]);
    setFinished(false);
    setFlipped(false);
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
          mode="flashcards"
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
        <Link
          href={`/lijst/${listId}`}
          className="text-primary-light hover:underline text-sm"
        >
          &larr; Terug
        </Link>
        <h2 className="font-semibold text-text">{list.title} - Flashcards</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{sessionWords.length}
        </span>
      </div>

      <ProgressBar current={currentIndex} total={sessionWords.length} />

      <div className="mt-8 mb-8">
        <Flashcard
          key={currentWord.id}
          word={currentWord}
          showDefinition={flipped}
          onFlip={() => setFlipped(!flipped)}
        />
      </div>

      {flipped && (
        <div className="flex justify-center gap-6 mt-6">
          <button
            onClick={() => handleAnswer(false)}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium text-lg cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--color-error)" }}
          >
            <span>&larr;</span> Ken ik niet
          </button>
          <button
            onClick={() => handleAnswer(true)}
            className="flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium text-lg cursor-pointer transition-transform hover:scale-105"
            style={{ backgroundColor: "var(--color-success)" }}
          >
            Ken ik <span>&rarr;</span>
          </button>
        </div>
      )}

      <div className="text-center mt-8 text-sm text-text-light">
        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Spatie</kbd> = draaien
        {flipped && (
          <>
            {" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono ml-2">&larr;</kbd> = niet
            {" "}
            <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono ml-2">&rarr;</kbd> = ken ik
          </>
        )}
      </div>
    </div>
  );
}
