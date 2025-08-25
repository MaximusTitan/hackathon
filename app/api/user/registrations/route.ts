import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET() {
  try {
    const result = await getSupabaseAndSession();
    if (!result.ok) return result.res;
    const { supabase, session } = result;

    // Fetch user's registrations with event details
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        registered_at,
        events (
          id,
          title,
          start_date,
          end_date,
          start_time,
          end_time,
          event_type,
          location,
          venue_name,
          image_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('registered_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

  return NextResponse.json({ registrations: data });
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
