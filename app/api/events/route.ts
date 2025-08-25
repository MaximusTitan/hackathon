import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const withCount = url.searchParams.get("with_participant_count");

  // Try to get session; if not available, proceed anonymously.
  const sessionResult = await getSupabaseAndSession();
  const isSession = sessionResult.ok;
  const isAdmin = isSession && (sessionResult as any).session.user.user_metadata?.role === 'admin';
  // Use supabase from session when available, else create a public client
  const supabase = isSession ? (sessionResult as any).supabase : await createClient();

  // If admin, get all events, if not, only get public events
  const query = supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    query.eq('is_public', true);
  }

  const { data: events, error } = await query;

  if (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { events: [] },
      { status: 500, headers: { "Cache-Control": "s-maxage=30" } }
    );
  }

  if (withCount) {
    // Fetch all registrations (only event_id)
    const { data: registrations, error: regError } = await supabase
      .from("registrations")
      .select("event_id");

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }

    // Count participants per event_id
    const countMap: Record<string, number> = {};
    (registrations || []).forEach((row: any) => {
      countMap[row.event_id] = (countMap[row.event_id] || 0) + 1;
    });

    // Attach participant_count to each event
    const eventsWithCount = (events || []).map((event: any) => ({
      ...event,
      participant_count: countMap[event.id] || 0,
    }));

    // Add cache headers only for public responses
    const headers = !isAdmin
      ? { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" }
      : undefined as any;
    return NextResponse.json({ events: eventsWithCount }, { headers });
  }

  const headers = !isAdmin
    ? { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" }
    : undefined as any;
  return NextResponse.json({ events }, { headers });
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const eventData = await request.json();

    // Check if user is admin using getUser instead of getSession
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === null;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }    // Prepare event data with proper handling for TBA fields
    const processedEventData = {
      ...eventData,
      is_public: eventData.is_public ?? true,
      is_paid: eventData.is_paid || false,
      price: eventData.price || 0,
      razorpay_key_id: eventData.razorpay_key_id || null,
      
      // Handle TBA fields - set to NULL if TBA is true or if value is empty string
      start_date: eventData.date_tba || !eventData.start_date ? null : eventData.start_date,
      end_date: eventData.date_tba || !eventData.end_date ? null : eventData.end_date,
      start_time: eventData.time_tba || !eventData.start_time ? null : eventData.start_time,
      end_time: eventData.time_tba || !eventData.end_time ? null : eventData.end_time,
      
      // Venue/location fields
      venue_name: eventData.venue_tba || !eventData.venue_name ? null : eventData.venue_name,
      address_line1: eventData.venue_tba || !eventData.address_line1 ? null : eventData.address_line1,
      city: eventData.venue_tba || !eventData.city ? null : eventData.city,
      postal_code: eventData.venue_tba || !eventData.postal_code ? null : eventData.postal_code,
      location: eventData.venue_tba || !eventData.location ? null : eventData.location,
      location_link: eventData.venue_tba || !eventData.location_link ? null : eventData.location_link,
      
      // Ensure TBA fields are boolean
      date_tba: !!eventData.date_tba,
      time_tba: !!eventData.time_tba,
      venue_tba: !!eventData.venue_tba,
    };    const { error } = await supabase.from("events").insert([processedEventData]);

    if (error) {
      console.error("Error creating event:", error);
      
      // Handle unique constraint violation for title
      if (error.code === '23505' && error.message.includes('events_title_key')) {
        return NextResponse.json({ 
          error: "An event with this title already exists. Please choose a different title." 
        }, { status: 409 });
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
