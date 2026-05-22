/** Path internal aman untuk redirect setelah login/register. */
export function safeReturnPath(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  const path = raw.trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/login") || path.startsWith("/register")) return fallback;
  return path;
}
