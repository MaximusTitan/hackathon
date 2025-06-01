import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: "Missing event_id parameter" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = session.user.user_metadata?.role === 'admin' || 
                     session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get screening test for this event
    const { data, error } = await supabase
      .from('screening_tests')
      .select('*')
      .eq('event_id', event_id)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors when no record exists

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ screeningTest: data });
  } catch (error) {
    console.error("Error fetching screening test:", error);
    return NextResponse.json(
      { error: "Failed to fetch screening test" }, 
      { status: 500 }
    );
  }
}
