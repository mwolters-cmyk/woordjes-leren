import { neon } from "@neondatabase/serverless";

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is niet ingesteld");
  return neon(url);
}

/** Run the schema migration (idempotent) */
export async function ensureSchema() {
  const sql = getDb();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id          SERIAL PRIMARY KEY,
      username    VARCHAR(30) UNIQUE NOT NULL,
      password_hash VARCHAR(72) NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS progress (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      data        JSONB NOT NULL DEFAULT '{}',
      sessions    JSONB NOT NULL DEFAULT '[]',
      updated_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/** Find user by username */
export async function findUserByUsername(username: string) {
  const sql = getDb();
  const rows = await sql`
    SELECT id, username, password_hash FROM users WHERE username = ${username}
  `;
  return rows[0] ?? null;
}

/** Create a new user, returns the user row */
export async function createUser(username: string, passwordHash: string) {
  const sql = getDb();
  const rows = await sql`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id, username
  `;
  return rows[0];
}

/** Get progress data for a user */
export async function getProgress(userId: number) {
  const sql = getDb();
  const rows = await sql`
    SELECT data, sessions FROM progress WHERE user_id = ${userId}
  `;
  return rows[0] ?? null;
}

/** Upsert progress data for a user */
export async function saveProgress(
  userId: number,
  data: Record<string, unknown>,
  sessions: unknown[]
) {
  const sql = getDb();
  await sql`
    INSERT INTO progress (user_id, data, sessions, updated_at)
    VALUES (${userId}, ${JSON.stringify(data)}, ${JSON.stringify(sessions)}, NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      data = ${JSON.stringify(data)},
      sessions = ${JSON.stringify(sessions)},
      updated_at = NOW()
  `;
}
