"use client";

import { useAuth } from "./AuthProvider";
import AuthScreen from "./AuthScreen";

/**
 * Shows auth screen if not logged in, otherwise renders children.
 * Admin pages bypass this (they have their own PIN auth).
 */
export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-text-light text-sm">Laden...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <>{children}</>;
}
