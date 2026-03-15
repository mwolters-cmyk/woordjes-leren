"use client";

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-sm text-text-light mb-1">
          <span>{label}</span>
          <span>{current}/{total} ({pct}%)</span>
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className="h-3 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            backgroundColor:
              pct >= 80 ? "var(--color-success)" :
              pct >= 40 ? "var(--color-accent)" :
              "var(--color-primary-light)",
          }}
        />
      </div>
    </div>
  );
}
