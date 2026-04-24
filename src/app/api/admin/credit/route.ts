/**
 * POST /api/admin/credit
 *
 * Server-side endpoint waarmee admins handmatig saldo kunnen
 * bijschrijven na ontvangst van een Tikkie. Gebruikt de service
 * role key zodat RLS bypassed wordt — maar checkt EXPLICIET dat
 * de huidige user in de admins-tabel staat.
 *
 * Body:
 *   { username: string, eurAmount: number, description?: string,
 *     externalRef?: string }
 */

import { NextResponse } from "next/server";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();

    // 1. Wie is de huidige user?
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Niet ingelogd" }, { status: 401 });
    }

    // 2. Is deze user een admin?
    const { data: adminCheck } = await supabase
      .from("admins")
      .select("student_id")
      .eq("student_id", user.id)
      .maybeSingle();

    if (!adminCheck) {
      return NextResponse.json({ error: "Geen admin-rechten" }, { status: 403 });
    }

    // 3. Parse body
    const body = await request.json();
    const username = String(body.username || "").trim().toLowerCase();
    const eurAmount = Number(body.eurAmount);
    const description = body.description ? String(body.description) : null;
    const externalRef = body.externalRef ? String(body.externalRef) : null;
    const reason = body.reason ? String(body.reason) : "tikkie";

    if (!username) {
      return NextResponse.json({ error: "Username vereist" }, { status: 400 });
    }
    if (!Number.isFinite(eurAmount) || eurAmount === 0) {
      return NextResponse.json(
        { error: "eurAmount moet een geldig bedrag zijn (niet 0)" },
        { status: 400 }
      );
    }

    const deltaCents = Math.round(eurAmount * 100);

    // 4. Vind student via service-role (RLS staat anonieme lookup van
    //    andere students niet toe)
    const admin = getSupabaseAdmin();
    const { data: student, error: studentErr } = await admin
      .from("students")
      .select("id, username, credits_cents")
      .eq("username", username)
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json(
        { error: `Student '${username}' niet gevonden` },
        { status: 404 }
      );
    }

    // 5. Insert transactie (trigger update credits_cents)
    const { error: txErr } = await admin
      .from("balance_transactions")
      .insert({
        student_id: student.id,
        delta_cents: deltaCents,
        reason,
        description,
        external_ref: externalRef,
        created_by: user.id,
      });

    if (txErr) {
      return NextResponse.json({ error: txErr.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      student: { username: student.username, id: student.id },
      newBalanceCents: student.credits_cents + deltaCents,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Onbekende fout" },
      { status: 500 }
    );
  }
}
