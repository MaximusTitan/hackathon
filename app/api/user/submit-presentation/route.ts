import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { 
      event_id, 
      github_link, 
      deployment_link, 
      presentation_link, 
      presentation_notes, 
      video_link, 
      sales_presentation_link,
      event_category 
    } = await request.json();

    if (!event_id) {
      return NextResponse.json(
        { error: "Event ID is required" }, 
        { status: 400 }
      );
    }

    // Validate required fields based on event category
    if (event_category === "sales") {
      if (!video_link || !sales_presentation_link) {
        return NextResponse.json(
          { error: "Video link and presentation link are required for sales events" }, 
          { status: 400 }
        );
      }
    } else {
      // Default hackathon validation
      if (!github_link) {
        return NextResponse.json(
          { error: "GitHub link is required for hackathon events" }, 
          { status: 400 }
        );
      }
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

    // Prepare update data based on event category
    const updateData = {
      presentation_status: 'submitted'
    } as any;

    if (event_category === "sales") {
      updateData.video_link = video_link;
      updateData.sales_presentation_link = sales_presentation_link;
      updateData.presentation_notes = presentation_notes || null;
    } else {
      // Hackathon event
      updateData.github_link = github_link;
      updateData.deployment_link = deployment_link || null;
      updateData.presentation_link = presentation_link || null;
      updateData.presentation_notes = presentation_notes || null;
    }

    // Update user's registration with presentation data
    const { error } = await supabase
      .from('registrations')
      .update(updateData)
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
