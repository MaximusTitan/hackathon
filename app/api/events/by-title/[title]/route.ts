import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ title: string }> }
) {
  try {
    const { title } = await params;
    // Decode and convert slug back to approximate title for search
    const decodedTitle = decodeURIComponent(title).replace(/-/g, ' ');
    
    const supabase = await createClient();
    
    // First try exact match (case insensitive)
    let { data, error } = await supabase
      .from("events")
      .select("*")
      .ilike("title", decodedTitle)
      .single();

    // If no exact match, try partial match
    if (error || !data) {
      const { data: partialData, error: partialError } = await supabase
        .from("events")
        .select("*")
        .ilike("title", `%${decodedTitle}%`)
        .limit(1)
        .single();
      
      data = partialData;
      error = partialError;
    }

    if (error || !data) {
      return NextResponse.json({ event: null }, { status: 404 });
    }
    
    return NextResponse.json({ event: data });
  } catch (error) {
    console.error("Error fetching event by title:", error);
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 });
  }
}
