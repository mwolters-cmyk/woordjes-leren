"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllLists } from "@/data/registry";
import { getAdminWordCount, exportAllData } from "@/lib/adminStorage";
import {
  JAARLAAG_LABELS,
  LANGUAGE_LABELS,
  LANGUAGE_EMOJI,
  LIST_TYPE_LABELS,
  type Jaarlaag,
  type Language,
  type Module,
} from "@/lib/types";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allLists = getAllLists();

  // Group by jaarlaag then module
  const jaarlagen: Jaarlaag[] = [1, 2, 3, "bovenbouw"];
  const modules: Module[] = [1, 2, 3];

  const handleExport = () => {
    const json = exportAllData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `woordjes-admin-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-text">Lijsten beheren</h2>
        <button
          onClick={handleExport}
          className="px-4 py-2 rounded-lg text-white text-sm font-medium cursor-pointer"
          style={{ backgroundColor: "var(--color-accent)" }}
        >
          Export alle data (JSON)
        </button>
      </div>

      {jaarlagen.map((jaar) => {
        const jaarLists = allLists.filter((l) => l.jaarlaag === jaar);
        if (jaarLists.length === 0) return null;

        const isBovenbouw = jaar === "bovenbouw";

        return (
          <div key={String(jaar)} className="mb-8">
            <h3 className="text-lg font-bold text-primary mb-3">
              {JAARLAAG_LABELS[String(jaar)]}
            </h3>

            {isBovenbouw ? (
              <ListTable lists={jaarLists} mounted={mounted} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {modules.map((mod) => {
                  const modLists = jaarLists.filter((l) => l.module === mod);
                  if (modLists.length === 0) return null;
                  return (
                    <div key={mod} className="card p-4">
                      <h4 className="font-semibold text-text mb-2">
                        Module {mod}
                      </h4>
                      <ListTable lists={modLists} mounted={mounted} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ListTable({
  lists,
  mounted,
}: {
  lists: ReturnType<typeof getAllLists>;
  mounted: boolean;
}) {
  return (
    <div className="space-y-1">
      {lists.map((list) => {
        const staticWords = list.words.length;
        const adminWords = mounted ? getAdminWordCount(list.id) : 0;
        const totalWords = staticWords + adminWords;

        let statusColor = "#ccc"; // grijs = leeg
        if (totalWords > 0 && totalWords < 10) statusColor = "var(--color-accent)"; // oranje = gedeeltelijk
        if (totalWords >= 10) statusColor = "var(--color-success)"; // groen = gevuld

        return (
          <Link
            key={list.id}
            href={`/admin/lijst/${list.id}`}
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: statusColor }}
            />
            <span className="text-base mr-1">
              {LANGUAGE_EMOJI[list.language.from as Language]}
            </span>
            <span className="font-medium flex-1 truncate">{list.title}</span>
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-text-light">
              {LIST_TYPE_LABELS[list.listType]}
            </span>
            <span className="text-xs text-text-light w-12 text-right">
              {totalWords} w.
            </span>
          </Link>
        );
      })}
    </div>
  );
}
