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
  // Get user's registration and associated screening test
    // First get the registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        screening_status,
        screening_test_id,
        attended
      `)
      .eq('user_id', session.user.id)
      .eq('event_id', event_id)
      .single();

    if (regError) {
      console.error('Registration query error:', regError);
      return NextResponse.json(
        { error: "Registration not found or you haven't attended the event" }, 
        { status: 404 }
      );
    }

    // Check if user attended
    if (!registration.attended) {
      return NextResponse.json(
        { error: "You must attend the event before taking the screening test" }, 
        { status: 403 }
      );
    }

    if (!registration.screening_test_id) {
      return NextResponse.json(
        { error: "No screening test assigned" }, 
        { status: 404 }
      );
    }

    if (registration.screening_status !== 'sent') {
      return NextResponse.json(
        { error: "Screening test not available or already completed" }, 
        { status: 400 }
      );
    }

    // Now get the screening test separately
    const { data: screeningTest, error: testError } = await supabase
      .from('screening_tests')
      .select(`
        id,
        instructions,
        timer_minutes,
        total_questions,
        passing_score,
        questions,
        deadline,
        is_active
      `)
      .eq('id', registration.screening_test_id)
      .eq('is_active', true)
      .single();

    if (testError) {
      console.error('Screening test query error:', testError);
      return NextResponse.json(
        { error: "Screening test not found" }, 
        { status: 404 }
      );
    }    // Check if user has already attempted this test
    const { data: existingAttempt, error: attemptError } = await supabase
      .from('user_test_attempts')
      .select('id, status, score, submitted_at')
      .eq('user_id', session.user.id)
      .eq('screening_test_id', registration.screening_test_id)
      .maybeSingle();

    if (attemptError && attemptError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Error checking test attempt: ${attemptError.message}` }, 
        { status: 500 }
      );
    }

    if (existingAttempt && existingAttempt.status !== 'in_progress') {
      return NextResponse.json(
        { 
          error: "Test already completed",
          attempt: existingAttempt
        }, 
        { status: 400 }
      );
    }
    
    // Parse questions from JSON
    let questions = [];
    try {
      questions = JSON.parse(screeningTest.questions || '[]');
    } catch (parseError) {
      console.error('Error parsing questions:', parseError);
      return NextResponse.json(
        { error: "Invalid test data" }, 
        { status: 500 }
      );
    }

    // Check if test deadline has passed
    if (screeningTest.deadline && new Date(screeningTest.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Test deadline has passed" }, 
        { status: 400 }
      );
    }

    return NextResponse.json({
      test: {
        id: screeningTest.id,
        instructions: screeningTest.instructions,
        timer_minutes: screeningTest.timer_minutes,
        total_questions: screeningTest.total_questions,
        passing_score: screeningTest.passing_score,
        deadline: screeningTest.deadline,
        questions: questions
      },
      registration_id: registration.id,
      existing_attempt: existingAttempt
    });
  } catch (error) {
    console.error("Error fetching screening test:", error);
    return NextResponse.json(
      { error: "Failed to fetch screening test" }, 
      { status: 500 }
    );
  }
}
