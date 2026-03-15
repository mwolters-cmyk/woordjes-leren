"use client";

import { useState } from "react";
import type { ReadinessResult } from "@/lib/readiness";

interface Props {
  readiness: ReadinessResult;
}

export default function ToetsklaarMeter({ readiness }: Props) {
  const [showInfo, setShowInfo] = useState(false);
  const { score, label, color, advice, practiceDays } = readiness;

  // CSS conic-gradient for ring gauge
  const ringStyle = {
    background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb ${score * 3.6}deg)`,
  };

  return (
    <div>
      <p className="text-sm text-text-light mb-2">Toetsklaar</p>

      <div className="flex items-center gap-4">
        {/* Ring gauge */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <div className="w-full h-full rounded-full" style={ringStyle} />
          <div className="absolute inset-2 rounded-full bg-white flex items-center justify-center">
            <span className="text-lg font-bold" style={{ color }}>
              {score}%
            </span>
          </div>
        </div>

        {/* Label + advice */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color }}>
            {label}
          </p>
          <p className="text-xs text-text-light mt-0.5">{advice}</p>
          <p className="text-xs text-text-light mt-1">
            {practiceDays} oefen{practiceDays === 1 ? "dag" : "dagen"}
          </p>
        </div>
      </div>

      {/* Info toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="text-xs text-primary-light hover:underline mt-2"
      >
        {showInfo ? "Verberg uitleg" : "Hoe werkt dit?"}
      </button>

      {showInfo && (
        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-xs text-text-light space-y-1">
          <p>
            <strong>Box-score (40%)</strong>: hoe ver je woorden in het
            Leitner-systeem zijn gevorderd.
          </p>
          <p>
            <strong>Dagenspreiding (35%)</strong>: op hoeveel verschillende
            dagen je elk woord goed had (doel: 3 dagen).
          </p>
          <p>
            <strong>Retentie (25%)</strong>: hoeveel van je gevorderde woorden
            je nog steeds kent (niet overdue).
          </p>
          <p className="pt-1 border-t border-gray-200">
            Tip: oefen verspreid over meerdere dagen voor het beste resultaat.
            Alles in 1 avond stampen werkt minder goed!
          </p>
        </div>
      )}
    </div>
  );
}
