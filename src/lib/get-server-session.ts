import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME, parseSessionValue, type SessionPayload } from "@/lib/auth";

export async function getServerSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return parseSessionValue(cookieStore.get(AUTH_COOKIE_NAME)?.value);
}
