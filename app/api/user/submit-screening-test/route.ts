import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { 
      screening_test_id, 
      event_id, 
      answers, 
      time_taken_seconds, 
      tab_switches, 
      status 
    } = await request.json();

    if (!screening_test_id || !event_id || !answers || status === undefined) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the screening test to calculate score
    const { data: screeningTest, error: testError } = await supabase
      .from('screening_tests')
      .select('questions, total_questions, passing_score')
      .eq('id', screening_test_id)
      .single();

    if (testError) {
      return NextResponse.json(
        { error: `Failed to get test data: ${testError.message}` }, 
        { status: 500 }
      );
    }

    // Parse questions and calculate score
    let questions = [];
    let score = 0;
    let totalPoints = 0;
    
    try {
      questions = JSON.parse(screeningTest.questions || '[]');
      
      // Calculate score based on correct answers
      for (const question of questions) {
        totalPoints += question.points || 1;
        const userAnswer = answers[question.id];
        if (userAnswer !== undefined && userAnswer === question.correctAnswer) {
          score += question.points || 1;
        }
      }
      
      // Convert to percentage
      score = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    } catch (parseError) {
      console.error('Error parsing questions for scoring:', parseError);
      return NextResponse.json(
        { error: "Invalid test data" }, 
        { status: 500 }
      );
    }

    // Get user's registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', event_id)
      .single();

    if (regError) {
      return NextResponse.json(
        { error: "Registration not found" }, 
        { status: 404 }
      );
    }

    // Update or create test attempt
    const { data: attempt, error: attemptError } = await supabase
      .from('user_test_attempts')
      .upsert({
        user_id: session.user.id,
        screening_test_id,
        registration_id: registration.id,
        event_id,
        submitted_at: new Date().toISOString(),
        answers: JSON.stringify(answers),
        score,
        total_questions: questions.length,
        time_taken_seconds: time_taken_seconds || 0,
        tab_switches: tab_switches || 0,
        status
      }, {
        onConflict: 'user_id,screening_test_id'
      })
      .select()
      .single();

    if (attemptError) {
      return NextResponse.json(
        { error: `Failed to submit test: ${attemptError.message}` }, 
        { status: 500 }
      );
    }

    // Update registration status
    const newScreeningStatus = score >= screeningTest.passing_score ? 'completed' : 'completed';
    
    const { error: updateRegError } = await supabase
      .from('registrations')
      .update({
        screening_status: newScreeningStatus
      })
      .eq('id', registration.id);

    if (updateRegError) {
      console.error('Error updating registration status:', updateRegError);
      // Don't fail the entire request for this
    }

    // Update workflow
    const { error: workflowError } = await supabase
      .from('user_event_workflow')
      .update({
        screening_submitted_at: new Date().toISOString()
      })
      .eq('user_id', session.user.id)
      .eq('event_id', event_id);

    if (workflowError) {
      console.error('Error updating workflow:', workflowError);
      // Don't fail the entire request for this
    }

    const passed = score >= screeningTest.passing_score;

    return NextResponse.json({
      success: true,
      message: "Test submitted successfully",
      result: {
        score,
        total_questions: questions.length,
        passing_score: screeningTest.passing_score,
        passed,
        time_taken_seconds: time_taken_seconds || 0,
        tab_switches: tab_switches || 0,
        status,
        submitted_at: attempt.submitted_at
      }
    });
  } catch (error) {
    console.error("Error submitting test:", error);
    return NextResponse.json(
      { error: "Failed to submit test" }, 
      { status: 500 }
    );
  }
}
