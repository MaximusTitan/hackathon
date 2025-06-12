import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET - Fetch recruiting partners for a specific event (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: partners, error } = await supabase
      .from('event_recruiting_partners')
      .select('id, event_id, name, logo_url, website_url')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching recruiting partners:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ partners: partners || [] });
  } catch (error) {
    console.error("Error in recruiting partners GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
