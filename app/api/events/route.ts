import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  
  // Check if user is admin using getUser instead of getSession
  let isAdmin = false;
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (user) {
      isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.role === null;
    }
  } catch (error) {
    console.error("Error authenticating user:", error);
  }

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
    }

    const { error } = await supabase.from("events").insert([
      {
        ...eventData,
        is_public: eventData.is_public ?? true,
        is_paid: eventData.is_paid || false,
        price: eventData.price || 0,
        razorpay_key_id: eventData.razorpay_key_id || null,
      },
    ]);

    if (error) {
      console.error("Error creating event:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
