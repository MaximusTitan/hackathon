import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { event_id, github_link, deployment_link, presentation_link, presentation_notes } = await request.json();

    if (!event_id || !github_link) {
      return NextResponse.json(
        { error: "Missing required fields" }, 
        { status: 400 }
      );
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

    // Update user's registration with presentation data
    const { error } = await supabase
      .from('registrations')
      .update({
        github_link,
        deployment_link: deployment_link || null,
        presentation_link: presentation_link || null,
        presentation_notes: presentation_notes || null,
        presentation_status: 'submitted'
      })
      .eq('event_id', event_id)
      .eq('user_id', session.user.id);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

  // Update workflow table (non-critical: preserve original behavior by not failing request on error)
  await supabase
      .from('user_event_workflow')
      .update({
        presentation_submitted_at: new Date().toISOString()
      })
      .eq('event_id', event_id)
      .eq('user_id', session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error submitting presentation:", error);
    return NextResponse.json(
      { error: "Failed to submit presentation" }, 
      { status: 500 }
    );
  }
}
