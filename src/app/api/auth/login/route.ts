import { NextResponse } from "next/server";
import { findUserByUsername, ensureSchema } from "@/lib/db";
import { verifyPassword, createToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Gebruikersnaam en wachtwoord zijn verplicht" },
        { status: 400 }
      );
    }

    const trimmed = username.trim().toLowerCase();

    // Ensure tables exist
    await ensureSchema();

    // Zoek gebruiker
    const user = await findUserByUsername(trimmed);
    if (!user) {
      return NextResponse.json(
        { error: "Gebruikersnaam of wachtwoord klopt niet" },
        { status: 401 }
      );
    }

    // Check wachtwoord
    const valid = await verifyPassword(password, user.password_hash as string);
    if (!valid) {
      return NextResponse.json(
        { error: "Gebruikersnaam of wachtwoord klopt niet" },
        { status: 401 }
      );
    }

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis bij het inloggen" },
      { status: 500 }
    );
  }
}
