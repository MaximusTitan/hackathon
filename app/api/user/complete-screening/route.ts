import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: "Missing event_id" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Update workflow table
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
