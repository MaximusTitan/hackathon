import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { hasSupabaseSessionCookie } from "@/utils/supabase/auth-helpers";

/**
 * Centralized helper: ensures a Supabase client and a valid session are present.
 * Returns a discriminated union so callers can early-return the provided response.
 * No behavior change vs in-route checks; just centralized to reduce duplication.
 */
export async function getSupabaseAndSession(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; session: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getSession"]>>["data"]["session"]> }
  | { ok: false; res: NextResponse }
> {
  if (!(await hasSupabaseSessionCookie())) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true, supabase, session } as const;
}

/**
 * Variant that uses getUser() to validate and returns the user object.
 * Prefer this when you need the user and want stronger validation in sensitive routes.
 */
export async function getSupabaseAndUser(): Promise<
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; user: NonNullable<Awaited<ReturnType<Awaited<ReturnType<typeof createClient>>["auth"]["getUser"]>>["data"]["user"]> }
  | { ok: false; res: NextResponse }
> {
  if (!(await hasSupabaseSessionCookie())) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { ok: true, supabase, user } as const;
}
