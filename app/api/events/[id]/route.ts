import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ event: null }, { status: 404 });
  }
  return NextResponse.json({ event: data });
}

// Add PUT method to update an event
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const body = await req.json();

  // Extract all fields from the request body
  const {
    title,
    description,
    start_date,
    end_date,
    start_time,
    end_time,
    event_type,
    meeting_link,
    location,
    location_link,
    venue_name,
    address_line1,
    city,
    postal_code,
    image_url,
  } = body;

  const { error } = await supabase
    .from("events")
    .update({
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      event_type,
      meeting_link,
      location,
      location_link,
      venue_name,
      address_line1,
      city,
      postal_code,
      image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id);

  if (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// Add DELETE method to remove an event
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", params.id);

  if (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
