"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/data/registry";
import { getListProgress, updateWordProgress, incrementSessionCount, saveSessionResult } from "@/lib/storage";
import { getWordsForSession, promoteWord, demoteWord, getInitialProgress } from "@/lib/leitner";
import { Word, WordList, ExerciseResult } from "@/lib/types";
import { getSmartOptions } from "@/lib/distractors";
import ProgressBar from "@/components/ProgressBar";
import SessionSummary from "@/components/SessionSummary";

export default function MeerkeuzePage() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<WordList | null>(null);
  const [sessionWords, setSessionWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [results, setResults] = useState<ExerciseResult[]>([]);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    const found = getListById(listId);
    if (found) {
      setList(found);
      const progress = getListProgress(listId);
      const words = getWordsForSession(found.words, progress);
      setSessionWords(words);
    }
  }, [listId]);

  const currentWord = sessionWords[currentIndex] ?? null;

  const options = useMemo(() => {
    if (!list || !currentWord) return [];
    return getSmartOptions(currentWord, list.words);
  }, [list, currentWord]);

  const handleSelect = (option: string) => {
    if (selected || !currentWord) return;

    setSelected(option);

    const isCorrect = option === currentWord.definition;
    const progress = getListProgress(listId);
    const wordProgress = progress?.wordProgress[currentWord.id] ?? getInitialProgress(currentWord.id, listId);
    const updated = isCorrect ? promoteWord(wordProgress) : demoteWord(wordProgress);
    updateWordProgress(listId, updated);

    setResults([
      ...results,
      {
        wordId: currentWord.id,
        correct: isCorrect,
        userAnswer: option,
        correctAnswer: currentWord.definition,
      },
    ]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= sessionWords.length) {
      const allResults = results;
      incrementSessionCount(listId);
      saveSessionResult({
        listId,
        mode: "meerkeuze",
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
      setSelected(null);
    }
  };

  const handlePracticeErrors = () => {
    const errorWordIds = results.filter((r) => !r.correct).map((r) => r.wordId);
    const errorWords = sessionWords.filter((w) => errorWordIds.includes(w.id));
    setSessionWords(errorWords);
    setCurrentIndex(0);
    setSelected(null);
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
          mode="meerkeuze"
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
        <h2 className="font-semibold text-text">{list.title} - Meerkeuze</h2>
        <span className="text-sm text-text-light">
          {currentIndex + 1}/{sessionWords.length}
        </span>
      </div>

      <ProgressBar current={currentIndex} total={sessionWords.length} />

      <div className="mt-8 max-w-md mx-auto">
        <div className="card p-8 text-center mb-6">
          <p className="text-sm text-text-light mb-2">Wat betekent:</p>
          <p className="text-3xl font-bold text-primary">{currentWord.term}</p>
          {currentWord.extra && (
            <p className="text-sm text-text-light mt-2">{currentWord.extra}</p>
          )}
        </div>

        <div className="space-y-3">
          {options.map((option, i) => {
            let bgColor = "white";
            let borderColor = "var(--color-primary-light)";
            let textColor = "var(--color-text)";

            if (selected) {
              if (option === currentWord.definition) {
                bgColor = "rgba(39, 174, 96, 0.1)";
                borderColor = "var(--color-success)";
              } else if (option === selected && option !== currentWord.definition) {
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
                onClick={() => handleSelect(option)}
                disabled={selected !== null}
                className="w-full p-4 rounded-lg border-2 text-left font-medium transition-all cursor-pointer disabled:cursor-default hover:shadow-md disabled:hover:shadow-none"
                style={{ backgroundColor: bgColor, borderColor, color: textColor }}
              >
                <span className="text-sm opacity-60 mr-2">{String.fromCharCode(65 + i)}</span>
                {option}
              </button>
            );
          })}
        </div>

        {selected && (
          <button
            onClick={handleNext}
            className="w-full mt-6 py-3 rounded-lg text-white font-medium cursor-pointer"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {currentIndex + 1 < sessionWords.length ? "Volgende" : "Bekijk resultaat"}
          </button>
        )}
      </div>
    </div>
  );
}
