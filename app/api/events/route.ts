import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (error) {
    return NextResponse.json({ events: [] }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
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

  // Insert event with all fields
  const { error } = await supabase.from("events").insert([
    {
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
    },
  ]);

  if (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
