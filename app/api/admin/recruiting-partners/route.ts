import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET - Fetch recruiting partners for a specific event
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
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching recruiting partners:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ partners });
  } catch (error) {
    console.error("Error in recruiting partners GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Add new recruiting partner for an event
export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === null;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { event_id, name, logo_url, website_url } = await request.json();

    if (!event_id?.trim() || !name?.trim() || !logo_url?.trim() || !website_url?.trim()) {
      return NextResponse.json(
        { error: "Event ID, name, logo URL, and website URL are required" },
        { status: 400 }
      );
    }

    const { data: partner, error } = await supabase
      .from('event_recruiting_partners')
      .insert([
        {
          event_id: event_id.trim(),
          name: name.trim(),
          logo_url: logo_url.trim(),
          website_url: website_url.trim()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating recruiting partner:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ partner });
  } catch (error) {
    console.error("Error in recruiting partners POST:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
