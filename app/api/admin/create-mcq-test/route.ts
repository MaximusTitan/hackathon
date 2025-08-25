import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { 
      event_id, 
      registration_ids, 
      instructions, 
      timer_minutes, 
      passing_score, 
      questions,
      deadline 
    } = await request.json();

    if (!event_id || !registration_ids || !Array.isArray(registration_ids) || !questions || !Array.isArray(questions)) {
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

  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;
    
    const isAdmin = session.user.user_metadata?.role === 'admin' || 
                     session.user.user_metadata?.role === null;
                     
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
    }

    let screeningTestId;

    const testData = {
      questions: JSON.stringify(questions),
      instructions: instructions || 'Please answer all questions carefully. You have limited time to complete this test.',
      timer_minutes: timer_minutes || 30,
      total_questions: questions.length,
      passing_score: passing_score || 70,
      deadline: deadline ? new Date(deadline).toISOString() : null,
      updated_at: new Date().toISOString()
    };

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

    // Update registrations with screening test info
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        screening_status: 'sent',
        screening_test_id: screeningTestId
      })
      .in('id', registration_ids);

    if (updateError) {
      return NextResponse.json(
        { error: `Failed to update registrations: ${updateError.message}` }, 
        { status: 500 }
      );
    }

    // Get user_ids for the registrations to create workflow entries
    const { data: registrations, error: regError } = await supabase
      .from('registrations')
      .select('id, user_id')
      .in('id', registration_ids);

    if (regError) {
      console.error('Error fetching registrations for workflow:', regError);
    } else if (registrations && registrations.length > 0) {
      const upserts = registrations.map((reg) =>
        supabase
          .from('user_event_workflow')
          .upsert({
            registration_id: reg.id,
            user_id: reg.user_id,
            event_id,
            screening_test_id: screeningTestId
          }, {
            onConflict: 'user_id,event_id',
            ignoreDuplicates: false
          })
          .then(({ error }) => { if (error) console.error(`Error creating workflow entry for user ${reg.user_id}:`, error); })
      );
      await Promise.allSettled(upserts);
    }

    return NextResponse.json({ 
      success: true, 
      message: `MCQ test created and sent to ${registration_ids.length} attendees`,
      test_id: screeningTestId
    });
  } catch (error) {
    console.error("Error creating MCQ test:", error);
    return NextResponse.json(
      { error: "Failed to create MCQ test" }, 
      { status: 500 }
    );
  }
}
