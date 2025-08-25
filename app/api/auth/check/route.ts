import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/utils/supabase/require-session";

export async function GET() {
  try {
    const result = await getSupabaseAndUser();
    if (!result.ok) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    const { user } = result;

    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
