import bcrypt from "bcryptjs";

export const AUTH_COOKIE_NAME = "b2b_session";
export type SessionRole = "pelanggan" | "admin";

export type SessionPayload = {
  userId: number;
  email: string;
  role: SessionRole;
  ts: number;
};

export async function hashPassword(rawPassword: string) {
  return bcrypt.hash(rawPassword, 10);
}

export async function verifyPassword(rawPassword: string, storedPassword: string) {
  // Backward compatibility for seed/plain password rows.
  if (!storedPassword.startsWith("$2")) {
    return rawPassword === storedPassword;
  }
  return bcrypt.compare(rawPassword, storedPassword);
}

export function buildSessionValue(userId: number, email: string, role: SessionRole) {
  return Buffer.from(JSON.stringify({ userId, email, role, ts: Date.now() })).toString("base64url");
}

export function parseSessionValue(value: string | undefined | null): SessionPayload | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as SessionPayload;
    if (!parsed?.email || !parsed?.role || !parsed?.userId) return null;
    return parsed;
  } catch {
    return null;
  }
}
