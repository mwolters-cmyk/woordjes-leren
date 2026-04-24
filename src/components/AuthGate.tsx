"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./AuthProvider";

/**
 * Vereist login voor voortgangs-tracking.
 *
 * Visie (zie VISION.md): leerling = baas. Login is van/voor leerling
 * zelf — niemand anders ziet de data dankzij Supabase RLS-policies.
 * Login is dus geen pottenkijker maar een sleutel voor de eigenaar.
 *
 * Als Supabase niet geconfigureerd is (MVP-fase zonder credentials):
 * geen blokkade — alles werkt op localStorage. Zodra Supabase
 * geactiveerd wordt: login is vereist behalve op publieke routes.
 */

const PUBLIC_ROUTES = ["/login", "/register", "/landing"];

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, hasBackend } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = PUBLIC_ROUTES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (loading) return;
    if (!hasBackend) return; // MVP: geen blokkade zonder Supabase
    if (user) return; // ingelogd
    if (isPublicRoute) return; // login/register zelf
    router.replace(`/login?from=${encodeURIComponent(pathname || "/")}`);
  }, [loading, hasBackend, user, isPublicRoute, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-text-light text-sm">Laden...</div>
      </div>
    );
  }

  // MVP zonder backend: alles toegankelijk
  if (!hasBackend) return <>{children}</>;

  // Public routes altijd toegankelijk
  if (isPublicRoute) return <>{children}</>;

  // Ingelogd → toon kinderen
  if (user) return <>{children}</>;

  // Niet ingelogd, niet-publieke route → wacht op redirect
  return null;
}
