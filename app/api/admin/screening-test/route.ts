import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

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

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;
    
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

    // Parse questions if they exist and are stored as JSON string
    let parsedScreeningTest = null;
    if (data) {
      parsedScreeningTest = {
        ...data,
        questions: data.questions ? 
          (typeof data.questions === 'string' ? 
            JSON.parse(data.questions) : 
            data.questions) : []
      };
    }

    return NextResponse.json({ screeningTest: parsedScreeningTest });
  } catch (error) {
    console.error("Error fetching screening test:", error);
    return NextResponse.json(
      { error: "Failed to fetch screening test" }, 
      { status: 500 }
    );
  }
}