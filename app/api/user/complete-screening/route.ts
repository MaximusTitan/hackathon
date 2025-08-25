import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: "Missing event_id" }, 
        { status: 400 }
      );
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

    // Update user's registration to mark screening as completed
    const { error } = await supabase
      .from('registrations')
      .update({
        screening_status: 'completed'
      })
      .eq('event_id', event_id)
      .eq('user_id', session.user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

  // Update workflow table (non-critical)
  await supabase
      .from('user_event_workflow')
      .update({
        screening_submitted_at: new Date().toISOString()
      })
      .eq('event_id', event_id)
      .eq('user_id', session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing screening:", error);
    return NextResponse.json(
      { error: "Failed to complete screening" }, 
      { status: 500 }
    );
  }
}
