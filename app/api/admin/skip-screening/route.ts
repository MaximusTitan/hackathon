import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { registration_ids } = await request.json();

    if (!registration_ids || !Array.isArray(registration_ids)) {
      return NextResponse.json(
        { error: "Missing or invalid registration_ids" }, 
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

    // Update registrations to skip screening
    const { error } = await supabase
      .from('registrations')
      .update({
        screening_status: 'skipped',
        presentation_status: 'pending' // Move to next stage
      })
      .in('id', registration_ids);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Screening skipped for ${registration_ids.length} attendees` 
    });
  } catch (error) {
    console.error("Error skipping screening:", error);
    return NextResponse.json(
      { error: "Failed to skip screening" }, 
      { status: 500 }
    );
  }
}
