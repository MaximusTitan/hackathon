import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

    // Get event details and the user's registration in parallel
    const [eventRes, regRes] = await Promise.all([
      supabase
        .from('events')
        .select('id, title, project_instructions, show_start_button, event_category')
        .eq('id', eventId)
        .single(),
      supabase
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
          presentation_notes,
          video_link,
          sales_presentation_link
        `)
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .single(),
    ]);

    const { data: event, error: eventError } = eventRes as any;
    const { data: registration, error: regError } = regRes as any;

    if (eventError) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (regError) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    // Get screening test if applicable
    let screening_test = null;
    let test_result = null;
    
    if ((registration as any).screening_test_id) {
      const [testDataRes, attemptDataRes] = await Promise.all([
        supabase
          .from('screening_tests')
          .select('id, mcq_link, instructions, deadline, passing_score')
          .eq('id', (registration as any).screening_test_id)
          .single(),
        (registration as any).screening_status === 'completed'
          ? supabase
              .from('user_test_attempts')
              .select('score, total_questions, submitted_at')
              .eq('user_id', (session as any).user.id)
              .eq('screening_test_id', (registration as any).screening_test_id)
              .eq('status', 'submitted')
              .order('submitted_at', { ascending: false })
              .limit(1)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ]);

      const testData = (testDataRes as any).data;
      screening_test = testData;

      const attemptData = (attemptDataRes as any).data as
        | { score: number; total_questions: number; submitted_at: string }
        | null;

      if (attemptData && testData) {
        const passingScore = testData?.passing_score ?? 70;
        const scorePercentage = attemptData.score;

        test_result = {
          score: attemptData.score,
          total_questions: attemptData.total_questions,
          passing_score: passingScore,
          passed: scorePercentage >= passingScore,
          submitted_at: attemptData.submitted_at,
        };
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
