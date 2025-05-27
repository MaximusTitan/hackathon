import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Use the correct type for the context argument in Next.js API routes
export async function GET(request: Request, context: any) {
  const supabase = await createClient();
  const eventId = context.params.id;

  const { data: participants, error } = await supabase
    .from("registrations")
    .select("id, user_name, user_email, user_linkedin")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ participants });
}
