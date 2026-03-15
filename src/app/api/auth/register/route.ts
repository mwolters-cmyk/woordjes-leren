import { NextResponse } from "next/server";
import { createUser, findUserByUsername, ensureSchema } from "@/lib/db";
import { hashPassword, createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    // Validatie
    if (!username || typeof username !== "string") {
      return NextResponse.json(
        { error: "Gebruikersnaam is verplicht" },
        { status: 400 }
      );
    }

    const trimmed = username.trim().toLowerCase();

    if (trimmed.length < 2 || trimmed.length > 30) {
      return NextResponse.json(
        { error: "Gebruikersnaam moet 2-30 tekens zijn" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9._-]+$/.test(trimmed)) {
      return NextResponse.json(
        { error: "Alleen letters, cijfers, punten, streepjes en underscores" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 4) {
      return NextResponse.json(
        { error: "Wachtwoord moet minimaal 4 tekens zijn" },
        { status: 400 }
      );
    }

    // Ensure tables exist
    await ensureSchema();

    // Check of gebruiker al bestaat
    const existing = await findUserByUsername(trimmed);
    if (existing) {
      return NextResponse.json(
        { error: "Deze gebruikersnaam is al bezet" },
        { status: 409 }
      );
    }

    // Maak account aan
    const hash = await hashPassword(password);
    const user = await createUser(trimmed, hash);

    // Genereer token
    const token = await createToken({
      userId: user.id as number,
      username: user.username as string,
    });

    return NextResponse.json({
      token,
      user: { id: user.id, username: user.username },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het registreren" },
      { status: 500 }
    );
  }
}
