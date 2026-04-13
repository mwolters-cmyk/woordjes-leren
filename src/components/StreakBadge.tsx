"use client";

import { useEffect, useState } from "react";
import { getStreak } from "@/lib/storage";

export default function StreakBadge() {
  const [streak, setStreak] = useState<{
    current: number;
    longest: number;
    todayDone: boolean;
  } | null>(null);

  useEffect(() => {
    setStreak(getStreak());
  }, []);

  if (!streak || streak.current === 0) return null;

  const fire = streak.current >= 7 ? "🔥🔥" : "🔥";
  const label =
    streak.current === 1
      ? "1 dag"
      : `${streak.current} dagen`;

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-sm">
      <span>{fire}</span>
      <span className="font-semibold text-orange-700">{label} streak</span>
      {!streak.todayDone && (
        <span className="text-xs text-orange-500 ml-1">— oefen vandaag!</span>
      )}
    </div>
  );
}
