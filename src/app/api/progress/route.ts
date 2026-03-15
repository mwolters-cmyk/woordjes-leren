import { NextResponse } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { getProgress, saveProgress, ensureSchema } from "@/lib/db";

/** GET /api/progress — haal voortgang op voor ingelogde user */
export async function GET(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Sessie verlopen" }, { status: 401 });
    }

    await ensureSchema();

    const row = await getProgress(payload.userId);
    return NextResponse.json({
      progress: row?.data ?? {},
      sessions: row?.sessions ?? [],
    });
  } catch (error) {
    console.error("Get progress error:", error);
    return NextResponse.json(
      { error: "Kon voortgang niet ophalen" },
      { status: 500 }
    );
  }
}

/** POST /api/progress — voor sendBeacon (beforeunload), token via query param */
export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Sessie verlopen" }, { status: 401 });
    }

    const { progress, sessions } = await request.json();
    if (!progress || typeof progress !== "object") {
      return NextResponse.json(
        { error: "Ongeldige voortgangsdata" },
        { status: 400 }
      );
    }

    await ensureSchema();
    await saveProgress(payload.userId, progress, sessions ?? []);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Beacon progress error:", error);
    return NextResponse.json(
      { error: "Kon voortgang niet opslaan" },
      { status: 500 }
    );
  }
}

/** PUT /api/progress — sla voortgang op voor ingelogde user */
export async function PUT(request: Request) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Sessie verlopen" }, { status: 401 });
    }

    const { progress, sessions } = await request.json();

    if (!progress || typeof progress !== "object") {
      return NextResponse.json(
        { error: "Ongeldige voortgangsdata" },
        { status: 400 }
      );
    }

    await ensureSchema();
    await saveProgress(payload.userId, progress, sessions ?? []);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Save progress error:", error);
    return NextResponse.json(
      { error: "Kon voortgang niet opslaan" },
      { status: 500 }
    );
  }
}
