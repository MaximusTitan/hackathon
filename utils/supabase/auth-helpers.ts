import { cookies } from "next/headers";

/**
 * Fast, SSR-aware check for presence of a Supabase auth session cookie.
 *
 * Context:
 * - With the new @supabase/ssr package, auth tokens are stored under a key like
 *   `sb-<project-ref>-auth-token` (and may be chunked as `sb-<ref>-auth-token.0`, `.1`, ...).
 * - Older auth-helpers stored tokens in separate cookies like `sb-access-token` and
 *   `sb-refresh-token` (optionally prefixed with `__Secure-`).
 *
 * This helper detects both the new SSR cookie naming and the legacy names to remain
 * backward-compatible. Use getUser() to truly validate a session; this is only a
 * quick short-circuit to avoid unnecessary client creation for clearly anonymous traffic.
 */
export async function hasSupabaseSessionCookie(): Promise<boolean> {
  const store = await cookies();

  // Collect all cookie names once
  const names = store.getAll().map((c) => c.name);

  // New @supabase/ssr storage: sb-<project-ref>-auth-token with optional chunk suffix
  // and optional __Secure- prefix when using secure cookies.
  const ssrAuthCookieRegex = /^(?:__Secure-)?sb-[A-Za-z0-9_-]+-auth-token(?:\.[0-9]+)?$/;

  // Legacy names from older helpers (keep for safety during migration)
  const legacyNames = new Set([
    "sb-access-token",
    "sb-refresh-token",
    "__Secure-sb-access-token",
    "__Secure-sb-refresh-token",
  ]);

  // Match either new SSR cookie pattern or legacy cookie names
  return names.some((name) => ssrAuthCookieRegex.test(name) || legacyNames.has(name));
}
