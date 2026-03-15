const SESSION_KEY = "woordjes-admin-auth";

// SHA-256 hash of the 4-digit PIN (same as Toetsdruk)
const PIN_HASH =
  "cb46cf928f8527e2c433c2ce8b0a4a400fad8e136904a54aa2d7bc4d891ed4b1";

async function sha256(msg: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(msg)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPin(pin: string): Promise<boolean> {
  const hash = await sha256(pin);
  if (hash === PIN_HASH) {
    sessionStorage.setItem(SESSION_KEY, "ok");
    return true;
  }
  return false;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === "ok";
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
