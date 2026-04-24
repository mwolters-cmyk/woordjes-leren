import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomein-routing voor overhoorme.nl
 *
 * - overhoorme.nl                  → /landing (chooser)
 * - woordjes.overhoorme.nl/*       → / (root, geen rewrite — bestaande app)
 * - mondelingen.overhoorme.nl/*    → /mondelingen/* (rewrite)
 *
 * In dev (localhost): geen rewrite, alle routes direct toegankelijk.
 *
 * Bookmarks-redirect: wie nog overhoorme.nl/klas/2 bezoekt, wordt
 * doorgestuurd naar woordjes.overhoorme.nl/klas/2 (één keer 301).
 */

const KNOWN_VOCAB_PATHS = [
  "/klas",
  "/lijst",
  "/admin",
  "/login",
  "/register",
  "/api",
];

export function middleware(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").toLowerCase();
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Localhost / dev: geen subdomein-routing
  if (
    hostname.startsWith("localhost") ||
    hostname.startsWith("127.0.0.1") ||
    hostname.includes("vercel.app")
  ) {
    return NextResponse.next();
  }

  // mondelingen.overhoorme.nl → rewrite naar /mondelingen
  if (hostname.startsWith("mondelingen.")) {
    if (!pathname.startsWith("/mondelingen")) {
      url.pathname = `/mondelingen${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // woordjes.overhoorme.nl → root (geen rewrite, bestaande app)
  if (hostname.startsWith("woordjes.")) {
    return NextResponse.next();
  }

  // Bare overhoorme.nl
  if (hostname === "overhoorme.nl" || hostname === "www.overhoorme.nl") {
    // Bekende vocab-paths → redirect naar woordjes-subdomein
    if (KNOWN_VOCAB_PATHS.some((p) => pathname.startsWith(p))) {
      const redirectUrl = new URL(
        `https://woordjes.overhoorme.nl${pathname}${url.search}`
      );
      return NextResponse.redirect(redirectUrl, 301);
    }
    // Root → landing chooser
    if (pathname === "/" || pathname === "") {
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico
     * - static files (images, fonts)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)).*)",
  ],
};
