"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "./AuthProvider";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-sm hover:opacity-80 transition-opacity"
      >
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold uppercase">
          {user.username[0]}
        </span>
        <span className="hidden sm:inline">{user.username}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-text">{user.username}</p>
            <p className="text-xs text-text-light">Ingelogd</p>
          </div>
          <button
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            Uitloggen
          </button>
        </div>
      )}
    </div>
  );
}
