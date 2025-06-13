import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // Function to determine if param is an ID (UUID) or title slug
    const isUUID = (str: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(str);
    };

    let data, error;

    if (isUUID(id)) {
      // Handle UUID lookup
      const result = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      data = result.data;
      error = result.error;    } else {
      // Handle title slug lookup
      const decodedTitle = decodeURIComponent(id).replace(/-/g, ' ');
      
      // Try exact match only (case insensitive)
      const result = await supabase
        .from("events")
        .select("*")
        .ilike("title", decodedTitle)
        .single();
      
      data = result.data;
      error = result.error;
    }

    if (error || !data) {
      return NextResponse.json({ event: null }, { status: 404 });
    }
    return NextResponse.json({ event: data });
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const supabase = await createClient();

    // Check if user is admin using getUser instead of getSession
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === null;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }    // Prepare update data with proper handling for TBA fields
    const processedUpdateData = {
      ...body,
      updated_at: new Date().toISOString(),
      
      // Handle TBA fields - set to NULL if TBA is true or if value is empty string
      start_date: body.date_tba || !body.start_date ? null : body.start_date,
      end_date: body.date_tba || !body.end_date ? null : body.end_date,
      start_time: body.time_tba || !body.start_time ? null : body.start_time,
      end_time: body.time_tba || !body.end_time ? null : body.end_time,
      
      // Venue/location fields
      venue_name: body.venue_tba || !body.venue_name ? null : body.venue_name,
      address_line1: body.venue_tba || !body.address_line1 ? null : body.address_line1,
      city: body.venue_tba || !body.city ? null : body.city,
      postal_code: body.venue_tba || !body.postal_code ? null : body.postal_code,
      location: body.venue_tba || !body.location ? null : body.location,
      location_link: body.venue_tba || !body.location_link ? null : body.location_link,
      
      // Ensure TBA fields are boolean if they exist
      ...(body.hasOwnProperty('date_tba') && { date_tba: !!body.date_tba }),
      ...(body.hasOwnProperty('time_tba') && { time_tba: !!body.time_tba }),
      ...(body.hasOwnProperty('venue_tba') && { venue_tba: !!body.venue_tba }),
    };    const { error } = await supabase
      .from("events")
      .update(processedUpdateData)
      .eq("id", id);

    if (error) {
      console.error("Error updating event:", error);
      
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
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 });
  }
}