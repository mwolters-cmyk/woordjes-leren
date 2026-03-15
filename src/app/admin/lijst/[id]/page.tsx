"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getListById } from "@/data/registry";
import {
  getAdminListData,
  saveListWords,
  exportListAsJson,
} from "@/lib/adminStorage";
import {
  WordList,
  Word,
  LANGUAGE_LABELS,
  LIST_TYPE_LABELS,
  type Language,
} from "@/lib/types";
import PhotoViewer from "@/components/PhotoViewer";
import BulkEntryForm from "@/components/BulkEntryForm";

export default function AdminListEditor() {
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<WordList | null>(null);
  const [words, setWords] = useState<Word[]>([]);
  const [newTerm, setNewTerm] = useState("");
  const [newDef, setNewDef] = useState("");
  const [newExtra, setNewExtra] = useState("");
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const found = getListById(listId);
    if (found) {
      setList(found);
      // Load admin words, or fall back to static words
      const adminData = getAdminListData(listId);
      if (adminData) {
        setWords(adminData.words);
      } else if (found.words.length > 0) {
        setWords([...found.words]);
      }
    }
  }, [listId]);

  const save = (updatedWords: Word[]) => {
    setWords(updatedWords);
    saveListWords(listId, updatedWords);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm.trim() || !newDef.trim()) return;
    const word: Word = {
      id: `${listId}-w${Date.now()}`,
      term: newTerm.trim(),
      definition: newDef.trim(),
      extra: newExtra.trim() || undefined,
    };
    save([...words, word]);
    setNewTerm("");
    setNewDef("");
    setNewExtra("");
  };

  const handleDelete = (index: number) => {
    save(words.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= words.length) return;
    const updated = [...words];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    save(updated);
  };

  const handleEditSave = (index: number, word: Word) => {
    const updated = [...words];
    updated[index] = word;
    save(updated);
    setEditIndex(null);
  };

  const handleBulkImport = (imported: Word[]) => {
    save([...words, ...imported]);
  };

  const handleExport = () => {
    const json = exportListAsJson(listId);
    if (!json) return;
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!list) {
    return <div className="text-center py-12 text-text-light">Laden...</div>;
  }

  const showExtra =
    list.listType === "grammar" || list.listType === "vocabulary";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/admin"
          className="text-primary-light hover:underline text-sm"
        >
          &larr; Terug naar dashboard
        </Link>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-success text-sm font-medium">Opgeslagen!</span>
          )}
          {words.length > 0 && (
            <button
              onClick={handleExport}
              className="text-xs px-3 py-1 rounded-lg text-white cursor-pointer"
              style={{ backgroundColor: "var(--color-accent)" }}
            >
              Export JSON
            </button>
          )}
        </div>
      </div>

      <div className="card p-4 mb-4">
        <h2 className="text-xl font-bold text-text">{list.title}</h2>
        <div className="flex gap-2 mt-1">
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-light">
            {LANGUAGE_LABELS[list.language.from as Language]}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-light">
            {LIST_TYPE_LABELS[list.listType]}
          </span>
          {list.source && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-light">
              {list.source}
            </span>
          )}
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-text-light">
            {words.length} woorden
          </span>
        </div>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Photo viewer */}
        <div className="card p-4" style={{ minHeight: "400px" }}>
          <PhotoViewer listId={listId} />
        </div>

        {/* Right: Word entry */}
        <div className="space-y-4">
          {/* Add word form */}
          <div className="card p-4">
            <h3 className="font-semibold text-sm mb-3">Woord toevoegen</h3>
            <form onSubmit={handleAdd} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="Term / Woord"
                  className="px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: "var(--color-primary-light)" }}
                />
                <input
                  type="text"
                  value={newDef}
                  onChange={(e) => setNewDef(e.target.value)}
                  placeholder="Vertaling / Definitie"
                  className="px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: "var(--color-primary-light)" }}
                />
              </div>
              {showExtra && (
                <input
                  type="text"
                  value={newExtra}
                  onChange={(e) => setNewExtra(e.target.value)}
                  placeholder="Extra info (optioneel: naamval, genus, etc.)"
                  className="w-full px-3 py-2 border rounded-lg text-sm outline-none"
                  style={{ borderColor: "var(--color-primary-light)" }}
                />
              )}
              <button
                type="submit"
                disabled={!newTerm.trim() || !newDef.trim()}
                className="px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                Toevoegen
              </button>
            </form>
          </div>

          {/* Bulk entry */}
          <BulkEntryForm
            onImport={handleBulkImport}
            listId={listId}
            existingCount={words.length}
          />

          {/* Word list */}
          {words.length > 0 && (
            <div className="card p-4">
              <h3 className="font-semibold text-sm mb-3">
                Woorden ({words.length})
              </h3>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {words.map((word, i) => (
                  <div
                    key={word.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm group"
                  >
                    <span className="text-xs text-text-light w-6 text-right">
                      {i + 1}
                    </span>

                    {editIndex === i ? (
                      <EditRow
                        word={word}
                        showExtra={showExtra}
                        onSave={(w) => handleEditSave(i, w)}
                        onCancel={() => setEditIndex(null)}
                      />
                    ) : (
                      <>
                        <span className="font-medium flex-1 truncate">
                          {word.term}
                        </span>
                        <span className="flex-1 truncate text-text-light">
                          {word.definition}
                        </span>
                        {showExtra && word.extra && (
                          <span className="text-xs text-text-light truncate max-w-24">
                            {word.extra}
                          </span>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMove(i, -1)}
                            disabled={i === 0}
                            className="text-xs px-1 text-text-light hover:text-text cursor-pointer disabled:opacity-30"
                          >
                            ^
                          </button>
                          <button
                            onClick={() => handleMove(i, 1)}
                            disabled={i === words.length - 1}
                            className="text-xs px-1 text-text-light hover:text-text cursor-pointer disabled:opacity-30"
                          >
                            v
                          </button>
                          <button
                            onClick={() => setEditIndex(i)}
                            className="text-xs px-1 text-primary-light hover:text-primary cursor-pointer"
                          >
                            edit
                          </button>
                          <button
                            onClick={() => handleDelete(i)}
                            className="text-xs px-1 text-error cursor-pointer"
                          >
                            x
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EditRow({
  word,
  showExtra,
  onSave,
  onCancel,
}: {
  word: Word;
  showExtra: boolean;
  onSave: (w: Word) => void;
  onCancel: () => void;
}) {
  const [term, setTerm] = useState(word.term);
  const [def, setDef] = useState(word.definition);
  const [extra, setExtra] = useState(word.extra ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...word,
          term: term.trim(),
          definition: def.trim(),
          extra: extra.trim() || undefined,
        });
      }}
      className="flex-1 flex items-center gap-1"
    >
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="flex-1 px-2 py-1 border rounded text-sm outline-none"
        style={{ borderColor: "var(--color-primary-light)" }}
      />
      <input
        type="text"
        value={def}
        onChange={(e) => setDef(e.target.value)}
        className="flex-1 px-2 py-1 border rounded text-sm outline-none"
        style={{ borderColor: "var(--color-primary-light)" }}
      />
      {showExtra && (
        <input
          type="text"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          className="w-24 px-2 py-1 border rounded text-sm outline-none"
          style={{ borderColor: "var(--color-primary-light)" }}
          placeholder="extra"
        />
      )}
      <button
        type="submit"
        className="text-xs px-2 py-1 rounded bg-success text-white cursor-pointer"
      >
        ok
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-xs px-2 py-1 rounded border cursor-pointer"
      >
        x
      </button>
    </form>
  );
}
