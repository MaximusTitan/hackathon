import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  context: { searchParams: URLSearchParams; params: Promise<Record<string, string>> }
) {
  const supabase = await createClient();
  const user_id = context.searchParams.get("user_id");
  const event_id = context.searchParams.get("event_id");

  if (!user_id || !event_id) {
    return NextResponse.json({ error: "Missing user_id or event_id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", user_id)
    .eq("event_id", event_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ registered: false });
  }

  return NextResponse.json({ registered: true });
}
