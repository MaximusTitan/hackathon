import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { 
      event_id,
      title,
      instructions, 
      timer_minutes, 
      passing_score, 
      questions,
      deadline 
    } = await request.json();

    if (!event_id || !questions || !Array.isArray(questions)) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "At least one question is required" }, 
        { status: 400 }
      );
    }

    const { supabase, session } = (await getSupabaseAndSession()) as any;
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if screening test already exists for this event
    const { data: existingTest, error: checkError } = await supabase
      .from('screening_tests')
      .select('id')
      .eq('event_id', event_id)
      .eq('is_active', true)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: `Error checking existing test: ${checkError.message}` }, 
        { status: 500 }
      );
    }    const testData = {
      title: title || 'Screening Test',
      questions: JSON.stringify(questions),
      instructions: instructions || 'Please answer all questions carefully. You have limited time to complete this test.',
      timer_minutes: timer_minutes || 30,
      total_questions: questions.length,
      passing_score: passing_score || 70,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      mcq_link: null, // Clear any existing external link when saving internal MCQ test
      updated_at: new Date().toISOString()
    };

    let screeningTestId;

    if (existingTest) {
      // Update existing screening test
      const { data: updatedTest, error: updateError } = await supabase
        .from('screening_tests')
        .update(testData)
        .eq('id', existingTest.id)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: `Failed to update screening test: ${updateError.message}` }, 
          { status: 500 }
        );
      }
      screeningTestId = updatedTest.id;
    } else {
      // Create new screening test
      const { data: newTest, error: createError } = await supabase
        .from('screening_tests')
        .insert({
          event_id,
          ...testData,
          created_by: session.user.id,
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: `Failed to create screening test: ${createError.message}` }, 
          { status: 500 }
        );
      }
      screeningTestId = newTest.id;
    }

    return NextResponse.json({ 
      success: true, 
      message: `MCQ test ${existingTest ? 'updated' : 'created'} successfully`,
      test_id: screeningTestId
    });
  } catch (error) {
    console.error("Error saving MCQ test:", error);
    return NextResponse.json(
      { error: "Failed to save MCQ test" }, 
      { status: 500 }
    );
  }
}
