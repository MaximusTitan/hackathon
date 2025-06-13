import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if an event with this exact title already exists
    const { data, error } = await supabase
      .from("events")
      .select("id")
      .ilike("title", title.trim())
      .limit(1);

    if (error) {
      console.error("Error checking title uniqueness:", error);
      return NextResponse.json({ error: "Failed to check title" }, { status: 500 });
    }

    // Return whether the title exists
    return NextResponse.json({ 
      exists: data && data.length > 0,
      title: title.trim()
    });
    
  } catch (error) {
    console.error("Error in check-title endpoint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
