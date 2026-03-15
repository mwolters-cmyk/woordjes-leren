"use client";

import { useState } from "react";
import { Word } from "@/lib/types";

interface FlashcardProps {
  word: Word;
  showDefinition?: boolean;
  onFlip?: () => void;
}

export default function Flashcard({ word, showDefinition = false, onFlip }: FlashcardProps) {
  const [flipped, setFlipped] = useState(showDefinition);

  const handleFlip = () => {
    setFlipped(!flipped);
    onFlip?.();
  };

  return (
    <div
      className="flashcard-flip w-full max-w-md mx-auto cursor-pointer select-none"
      onClick={handleFlip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          handleFlip();
        }
      }}
    >
      <div className={`flashcard-inner relative w-full ${flipped ? "flipped" : ""}`} style={{ minHeight: "220px" }}>
        {/* Front */}
        <div className="flashcard-front absolute inset-0 card flex flex-col items-center justify-center p-8">
          <p className="text-3xl font-bold text-primary text-center">{word.term}</p>
          {word.extra && (
            <p className="text-sm text-text-light mt-3 text-center">{word.extra}</p>
          )}
          <p className="text-xs text-text-light mt-6">klik om te draaien</p>
        </div>
        {/* Back */}
        <div className="flashcard-back absolute inset-0 card flex flex-col items-center justify-center p-8 bg-primary-light text-white" style={{ backgroundColor: "var(--color-primary)" }}>
          <p className="text-3xl font-bold text-center">{word.definition}</p>
          {word.hint && (
            <p className="text-sm mt-3 opacity-80 text-center">Hint: {word.hint}</p>
          )}
          <p className="text-xs mt-6 opacity-60">klik om terug te draaien</p>
        </div>
      </div>
    </div>
  );
}
