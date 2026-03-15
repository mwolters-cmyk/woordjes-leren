"use client";

import { useState } from "react";
import { Word } from "@/lib/types";

interface BulkEntryFormProps {
  onImport: (words: Word[]) => void;
  listId: string;
  existingCount: number;
}

export default function BulkEntryForm({
  onImport,
  listId,
  existingCount,
}: BulkEntryFormProps) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<Word[] | null>(null);

  const parse = () => {
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);
    const words: Word[] = lines.map((line, i) => {
      const parts = line.split("\t");
      return {
        id: `${listId}-w${existingCount + i + 1}`,
        term: parts[0]?.trim() ?? "",
        definition: parts[1]?.trim() ?? "",
        extra: parts[2]?.trim() || undefined,
      };
    });
    setPreview(words.filter((w) => w.term && w.definition));
  };

  const handleImport = () => {
    if (preview && preview.length > 0) {
      onImport(preview);
      setText("");
      setPreview(null);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-2">Bulk invoer</h4>
      <p className="text-xs text-text-light mb-2">
        Plak tab-gescheiden data (uit Excel). Format: term [tab] vertaling [tab]
        extra (optioneel)
      </p>

      {!preview ? (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={"bonjour\thallo\nen fait\teigenlijk\nmerci\tbedankt"}
            className="w-full border rounded-lg p-3 text-sm font-mono outline-none resize-y"
            style={{ borderColor: "var(--color-primary-light)" }}
          />
          <button
            onClick={parse}
            disabled={!text.trim()}
            className="mt-2 px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            Voorbeeld bekijken
          </button>
        </>
      ) : (
        <>
          <div className="max-h-60 overflow-y-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-2 font-medium text-text-light">
                    Term
                  </th>
                  <th className="text-left p-2 font-medium text-text-light">
                    Vertaling
                  </th>
                  <th className="text-left p-2 font-medium text-text-light">
                    Extra
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.map((w, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="p-2 font-medium">{w.term}</td>
                    <td className="p-2">{w.definition}</td>
                    <td className="p-2 text-text-light text-xs">
                      {w.extra ?? ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-text-light mt-2">
            {preview.length} woorden gevonden
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleImport}
              className="px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer"
              style={{ backgroundColor: "var(--color-success)" }}
            >
              Importeren
            </button>
            <button
              onClick={() => setPreview(null)}
              className="px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer"
            >
              Terug
            </button>
          </div>
        </>
      )}
    </div>
  );
}
