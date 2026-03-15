"use client";

import { LeitnerBox } from "@/lib/types";

interface LeitnerBoxesProps {
  distribution: Record<LeitnerBox | 0, number>;
}

const BOX_LABELS: Record<number, string> = {
  0: "Nieuw",
  1: "Box 1",
  2: "Box 2",
  3: "Box 3",
  4: "Box 4",
  5: "Geleerd",
};

const BOX_COLORS: Record<number, string> = {
  0: "#95a5a6",
  1: "#e74c3c",
  2: "#e67e22",
  3: "#f1c40f",
  4: "#2980b9",
  5: "#27ae60",
};

const BOX_TOOLTIPS: Record<number, string> = {
  0: "Nog niet geoefend",
  1: "1x goed — komt meteen terug",
  2: "2x goed — komt morgen terug",
  3: "3x goed — komt over 3 dagen terug",
  4: "4x goed — komt over een week terug",
  5: "5x goed — herhaling over 2 weken",
};

export default function LeitnerBoxes({ distribution }: LeitnerBoxesProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 items-end h-24">
      {([0, 1, 2, 3, 4, 5] as const).map((box) => {
        const count = distribution[box] || 0;
        const heightPct = total > 0 ? Math.max((count / total) * 100, 4) : 4;

        return (
          <div key={box} className="flex flex-col items-center flex-1 group relative">
            <span className="text-xs font-medium mb-1">{count}</span>
            <div
              className="w-full rounded-t-md transition-all duration-300 cursor-help"
              style={{
                height: `${heightPct}%`,
                backgroundColor: BOX_COLORS[box],
                minHeight: "4px",
              }}
            />
            <span className="text-xs text-text-light mt-1">{BOX_LABELS[box]}</span>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 z-10">
              <div className="bg-gray-800 text-white text-xs rounded-lg px-3 py-1.5 whitespace-nowrap shadow-lg">
                {BOX_TOOLTIPS[box]}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
