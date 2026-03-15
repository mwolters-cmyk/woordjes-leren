"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { verifyPin, isAuthenticated } from "@/lib/adminAuth";

export default function AdminAuthGuard({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [error, setError] = useState("");
  const [digits, setDigits] = useState(["", "", "", ""]);
  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  useEffect(() => {
    if (isAuthenticated()) {
      setAuthed(true);
    } else {
      refs[0].current?.focus();
    }
  }, []);

  if (authed) return <>{children}</>;

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    setError("");

    if (value && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
    }
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const pin = digits.join("");
    if (pin.length < 4) {
      setError("Voer 4 cijfers in");
      return;
    }
    const ok = await verifyPin(pin);
    if (ok) {
      setAuthed(true);
    } else {
      setError("Onjuiste pincode");
      setDigits(["", "", "", ""]);
      refs[0].current?.focus();
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <h2 className="text-2xl font-bold text-text mb-2">Admin</h2>
        <p className="text-text-light mb-6">
          Voer de pincode in om door te gaan
        </p>

        <div className="flex justify-center gap-3 mb-4">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-14 h-14 text-center text-2xl border-2 rounded-lg outline-none transition-colors"
              style={{
                borderColor: error
                  ? "var(--color-error)"
                  : "var(--color-primary-light)",
              }}
              autoComplete="off"
            />
          ))}
        </div>

        {error && (
          <p className="text-error text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          className="w-full py-3 rounded-lg text-white font-medium cursor-pointer"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          Openen
        </button>
      </div>
    </div>
  );
}
