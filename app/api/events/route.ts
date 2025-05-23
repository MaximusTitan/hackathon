import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Check if user is admin
  const { data: { session } } = await supabase.auth.getSession();
  const isAdmin = session?.user?.user_metadata?.role === 'admin' || session?.user?.user_metadata?.role === null;

  // If admin, get all events, if not, only get public events
  const query = supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: true });

  if (!isAdmin) {
    query.eq('is_public', true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ events: [] }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();

  const { error } = await supabase.from("events").insert([
    {
      ...body,
      is_public: body.is_public ?? true, // Add is_public field
    },
  ]);

  if (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
