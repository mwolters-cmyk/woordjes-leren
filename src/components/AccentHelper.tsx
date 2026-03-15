"use client";

import { Language } from "@/lib/types";

const ACCENT_CHARS: Partial<Record<Language, string[]>> = {
  fr: ["é", "è", "ê", "ë", "à", "â", "ù", "û", "ô", "î", "ï", "ç", "œ", "æ"],
  de: ["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"],
  gr: ["ά", "έ", "ή", "ί", "ό", "ύ", "ώ", "ϊ", "ϋ"],
};

interface AccentHelperProps {
  language: Language;
  onInsert: (char: string) => void;
}

export default function AccentHelper({ language, onInsert }: AccentHelperProps) {
  const chars = ACCENT_CHARS[language];
  if (!chars || chars.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {chars.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onInsert(char)}
          className="w-9 h-9 rounded-lg bg-white border border-gray-300 text-lg font-medium
                     hover:bg-primary hover:text-white hover:border-primary
                     transition-colors cursor-pointer flex items-center justify-center"
        >
          {char}
        </button>
      ))}
    </div>
  );
}
