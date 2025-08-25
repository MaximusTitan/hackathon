import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { screening_test_id, event_id } = await request.json();

    if (!screening_test_id || !event_id) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

    // Get user's registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id, screening_status')
      .eq('user_id', session.user.id)
      .eq('event_id', event_id)
      .eq('screening_test_id', screening_test_id)
      .single();

    if (regError || registration.screening_status !== 'sent') {
      return NextResponse.json(
        { error: "Test not available or already completed" }, 
        { status: 400 }
      );
    }

    // Check if user already has an attempt
    const { data: existingAttempt, error: attemptError } = await supabase
      .from('user_test_attempts')
      .select('id, status')
      .eq('user_id', session.user.id)
      .eq('screening_test_id', screening_test_id)
      .maybeSingle();

    if (attemptError && attemptError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Error checking existing attempt: ${attemptError.message}` }, 
        { status: 500 }
      );
    }

    if (existingAttempt) {
      if (existingAttempt.status === 'in_progress') {
        return NextResponse.json({
          success: true,
          message: "Test session resumed",
          attempt_id: existingAttempt.id
        });
      } else {
        return NextResponse.json(
          { error: "Test already completed" }, 
          { status: 400 }
        );
      }
    }

    // Create new test attempt
    const { data: newAttempt, error: createError } = await supabase
      .from('user_test_attempts')
      .insert({
        user_id: session.user.id,
        screening_test_id,
        registration_id: registration.id,
        event_id,
        started_at: new Date().toISOString(),
        status: 'in_progress'
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json(
        { error: `Failed to start test: ${createError.message}` }, 
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test started successfully",
      attempt_id: newAttempt.id
    });
  } catch (error) {
    console.error("Error starting test:", error);
    return NextResponse.json(
      { error: "Failed to start test" }, 
      { status: 500 }
    );
  }
}
