import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET(request: Request) {
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { session } = result;

  return NextResponse.json({ bucket: "event-images", user_id: session.user.id });
}
