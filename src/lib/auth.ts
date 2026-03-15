import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const BCRYPT_ROUNDS = 10;

/** Hash a plaintext password */
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/** Compare plaintext password against hash */
export function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT secret — must be set in environment
function getJwtSecret() {
  const secret = process.env.WOORDJES_JWT_SECRET;
  if (!secret) throw new Error("WOORDJES_JWT_SECRET is niet ingesteld");
  return new TextEncoder().encode(secret);
}

export interface JwtPayload {
  userId: number;
  username: string;
}

/** Create a JWT token (30 days expiry) */
export async function createToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getJwtSecret());
}

/** Verify and decode a JWT token */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.userId as number,
      username: payload.username as string,
    };
  } catch {
    return null;
  }
}

/** Extract token from Authorization header */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}
