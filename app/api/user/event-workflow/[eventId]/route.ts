import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, title')
      .eq('id', eventId)
      .single();

    if (eventError) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get user's registration for this event
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select(`
        id,
        attended,
        screening_status,
        screening_test_id,
        presentation_status,
        github_link,
        deployment_link,
        presentation_link,
        presentation_notes
      `)
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .single();

    if (regError) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }    // Get screening test if applicable
    let screening_test = null;
    let test_result = null;
    
    if (registration.screening_test_id) {
      const { data: testData } = await supabase
        .from('screening_tests')
        .select('id, mcq_link, instructions, deadline')
        .eq('id', registration.screening_test_id)
        .single();
      
      screening_test = testData;

      // Get test result if user has completed the test
      if (registration.screening_status === 'completed') {
        const { data: attemptData } = await supabase
          .from('user_test_attempts')
          .select('score, total_questions, submitted_at')
          .eq('user_id', session.user.id)
          .eq('screening_test_id', registration.screening_test_id)
          .eq('status', 'submitted')
          .order('submitted_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (attemptData && testData) {
          // Get the passing score from screening test
          const { data: fullTestData } = await supabase
            .from('screening_tests')
            .select('passing_score')
            .eq('id', registration.screening_test_id)
            .single();          const passingScore = fullTestData?.passing_score || 70;
          // Score is already stored as a percentage in the database
          const scorePercentage = attemptData.score;

          test_result = {
            score: attemptData.score,
            total_questions: attemptData.total_questions,
            passing_score: passingScore,
            passed: scorePercentage >= passingScore,
            submitted_at: attemptData.submitted_at
          };
        }
      }
    }

    return NextResponse.json({
      event,
      registration,
      screening_test,
      test_result
    });
  } catch (error) {
    console.error("Error fetching workflow data:", error);
    return NextResponse.json(
      { error: "Failed to fetch workflow data" }, 
      { status: 500 }
    );
  }
}
