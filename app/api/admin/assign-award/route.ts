import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { registration_id, award_type } = await request.json();

    if (!registration_id || !award_type) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

    if (!['winner', 'runner_up'].includes(award_type)) {
      return NextResponse.json(
        { error: "Invalid award type" }, 
        { status: 400 }
      );
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;
  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }    // Get the registration to validate it exists and get event info
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, event_id, user_name, attended, presentation_status, qualification_status')
      .eq('id', registration_id)
      .single();

    if (regError || !registration) {
      return NextResponse.json(
        { error: "Registration not found" }, 
        { status: 404 }
      );
    }

    // Validate that the participant is eligible for awards
    if (!registration.attended) {
      return NextResponse.json(
        { error: "Participant must have attended the event" }, 
        { status: 400 }
      );
    }

    if (registration.presentation_status !== 'submitted') {
      return NextResponse.json(
        { error: "Participant must have submitted their project" }, 
        { status: 400 }
      );
    }

    // Check if the participant is qualified
    if (registration.qualification_status !== 'qualified') {
      return NextResponse.json(
        { error: "Awards can only be assigned to qualified participants" }, 
        { status: 400 }
      );
    }

    // Check if there's already a winner for this event (if trying to assign winner)
    if (award_type === 'winner') {
      const { data: existingWinner } = await supabase
        .from('registrations')
        .select('id, user_name')
        .eq('event_id', registration.event_id)
        .eq('award_type', 'winner')
        .neq('id', registration_id)
        .single();

      if (existingWinner) {
        return NextResponse.json(
          { error: `There is already a winner: ${existingWinner.user_name}` }, 
          { status: 400 }
        );
      }
    }

    // Update the registration with award info
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        award_type,
        award_assigned_at: new Date().toISOString(),
        award_assigned_by: session.user.id
      })
      .eq('id', registration_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 500 }
      );
    }    return NextResponse.json({ 
      success: true, 
      message: `${award_type === 'winner' ? 'Winner' : 'Runner-up'} assigned successfully`
    });
  } catch (error) {
    console.error("Error assigning award:", error);
    return NextResponse.json(
      { error: "Failed to assign award" }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { registration_id } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: "Missing required parameter: registration_id" }, 
        { status: 400 }
      );
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;
  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Remove the award from the registration
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        award_type: null,
        award_assigned_at: null,
        award_assigned_by: null
      })
      .eq('id', registration_id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Award removed successfully`
    });
  } catch (error) {
    console.error("Error removing award:", error);
    return NextResponse.json(
      { error: "Failed to remove award" }, 
      { status: 500 }
    );
  }
}
