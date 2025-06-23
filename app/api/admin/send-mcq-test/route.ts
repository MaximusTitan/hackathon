import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { 
      event_id,
      registration_ids,
      test_id
    } = await request.json();

    if (!event_id || !registration_ids || !Array.isArray(registration_ids) || !test_id) {
      return NextResponse.json(
        { error: "Missing required parameters" }, 
        { status: 400 }
      );
    }

    if (registration_ids.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one participant" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = session.user.user_metadata?.role === 'admin' || 
                     session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Verify the test exists and belongs to this event
    const { data: testData, error: testError } = await supabase
      .from('screening_tests')
      .select('id, questions, total_questions')
      .eq('id', test_id)
      .eq('event_id', event_id)
      .eq('is_active', true)
      .single();

    if (testError) {
      return NextResponse.json(
        { error: "Test not found or invalid" }, 
        { status: 404 }
      );
    }

    // Verify the test has questions
    let questions = [];
    try {
      questions = JSON.parse(testData.questions || '[]');
    } catch (parseError) {
      return NextResponse.json(
        { error: "Invalid test data" }, 
        { status: 400 }
      );
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Cannot send test with no questions" }, 
        { status: 400 }
      );
    }

    // Update registrations with screening test info
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        screening_status: 'sent',
        screening_test_id: test_id
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
      // Create or update workflow entries for each registration
      for (const reg of registrations) {
        try {
          await supabase
            .from('user_event_workflow')
            .upsert({
              registration_id: reg.id,
              user_id: reg.user_id,
              event_id,
              screening_test_id: test_id
            }, {
              onConflict: 'user_id,event_id',
              ignoreDuplicates: false
            });
        } catch (workflowError) {
          console.error(`Error creating workflow entry for user ${reg.user_id}:`, workflowError);
          // Continue with other users even if one fails
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `MCQ test sent to ${registration_ids.length} participants`,
      test_id: test_id
    });
  } catch (error) {
    console.error("Error sending MCQ test:", error);
    return NextResponse.json(
      { error: "Failed to send MCQ test" }, 
      { status: 500 }
    );
  }
}
