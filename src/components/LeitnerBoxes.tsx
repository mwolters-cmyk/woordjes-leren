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

export default function LeitnerBoxes({ distribution }: LeitnerBoxesProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);

  return (
    <div className="flex gap-2 items-end h-24">
      {([0, 1, 2, 3, 4, 5] as const).map((box) => {
        const count = distribution[box] || 0;
        const heightPct = total > 0 ? Math.max((count / total) * 100, 4) : 4;

        return (
          <div key={box} className="flex flex-col items-center flex-1">
            <span className="text-xs font-medium mb-1">{count}</span>
            <div
              className="w-full rounded-t-md transition-all duration-300"
              style={{
                height: `${heightPct}%`,
                backgroundColor: BOX_COLORS[box],
                minHeight: "4px",
              }}
            />
            <span className="text-xs text-text-light mt-1">{BOX_LABELS[box]}</span>
          </div>
        );
      })}
    </div>
  );
}
