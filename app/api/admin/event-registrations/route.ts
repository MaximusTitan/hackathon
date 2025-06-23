import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

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
    }    // Get registrations with comprehensive member information
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        registered_at,
        user_id,
        event_id,
        user_name,
        user_email,
        user_linkedin,
        payment_id,
        order_id,
        amount_paid,
        attended,
        screening_status,
        screening_test_id,
        presentation_status,
        github_link,
        deployment_link,
        presentation_link,        presentation_notes,
        award_type,
        award_assigned_at,
        award_assigned_by,
        admin_notes,
        admin_score,
        qualification_status,
        qualification_remarks,
        qualified_at,
        qualified_by
      `)
      .eq('event_id', event_id);    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    // Get detailed test attempts for all registrations
    const registrationIds = data.map(reg => reg.id);
    const { data: testAttempts, error: attemptsError } = await supabase
      .from('user_test_attempts')
      .select(`
        id,
        user_id,
        registration_id,
        screening_test_id,
        started_at,
        submitted_at,
        score,
        total_questions,
        time_taken_seconds,
        status,
        tab_switches
      `)
      .in('registration_id', registrationIds);    // Get screening test details
    const screeningTestIds = Array.from(new Set(data.map(reg => reg.screening_test_id).filter(Boolean)));
    const { data: screeningTests, error: testsError } = await supabase
      .from('screening_tests')
      .select(`
        id,
        title,
        passing_score,
        timer_minutes,
        total_questions,
        mcq_link,
        deadline
      `)
      .in('id', screeningTestIds);

    // Get admin profiles for award assignees
    const awardAssignedByIds = Array.from(new Set(data.map(reg => reg.award_assigned_by).filter(Boolean)));
    const { data: adminProfiles, error: adminError } = await supabase
      .from('admin_profiles')
      .select(`
        id,
        name,
        email
      `)
      .in('id', awardAssignedByIds);

    // Create lookup maps
    const testAttemptsMap = new Map();
    testAttempts?.forEach(attempt => {
      if (!testAttemptsMap.has(attempt.registration_id)) {
        testAttemptsMap.set(attempt.registration_id, []);
      }
      testAttemptsMap.get(attempt.registration_id).push(attempt);
    });

    const screeningTestsMap = new Map();
    screeningTests?.forEach(test => {
      screeningTestsMap.set(test.id, test);
    });

    const adminProfilesMap = new Map();
    adminProfiles?.forEach(admin => {
      adminProfilesMap.set(admin.id, admin);
    });    // Format the data for the frontend with comprehensive member information
    const registrations = data.map(reg => {
      const userAttempts = testAttemptsMap.get(reg.id) || [];
      const screeningTest = reg.screening_test_id ? screeningTestsMap.get(reg.screening_test_id) : null;
      const awardAssignedByAdmin = reg.award_assigned_by ? adminProfilesMap.get(reg.award_assigned_by) : null;      // Get the latest/best test attempt
      const latestAttempt = userAttempts.length > 0 
        ? userAttempts.sort((a: any, b: any) => new Date(b.submitted_at || b.started_at).getTime() - new Date(a.submitted_at || a.started_at).getTime())[0]
        : null;      // Calculate test score percentage if available
      let testScorePercentage = null;
      let testPassed = null;
      if (latestAttempt && latestAttempt.total_questions > 0) {
        // Score is already stored as a percentage in the database
        testScorePercentage = latestAttempt.score;
        testPassed = screeningTest ? testScorePercentage >= (screeningTest.passing_score || 70) : null;
      }

      return {
        id: reg.id,
        registered_at: reg.registered_at,
        user_id: reg.user_id,
        payment_id: reg.payment_id,
        order_id: reg.order_id,
        amount_paid: reg.amount_paid,
        attended: reg.attended,
        screening_status: reg.screening_status,
        screening_test_id: reg.screening_test_id,
        presentation_status: reg.presentation_status,
        github_link: reg.github_link,
        deployment_link: reg.deployment_link,
        presentation_link: reg.presentation_link,        presentation_notes: reg.presentation_notes,
        award_type: reg.award_type,
        award_assigned_at: reg.award_assigned_at,
        admin_notes: reg.admin_notes,
        admin_score: reg.admin_score,
        qualification_status: reg.qualification_status,
        qualification_remarks: reg.qualification_remarks,
        qualified_at: reg.qualified_at,
        qualified_by: reg.qualified_by,
        user: {
          name: reg.user_name || 'Unknown',
          email: reg.user_email || 'Unknown',
          linkedin: reg.user_linkedin || null
        },
        // Enhanced screening test information
        screening_test: screeningTest ? {
          title: screeningTest.title,
          passing_score: screeningTest.passing_score,
          timer_minutes: screeningTest.timer_minutes,
          total_questions: screeningTest.total_questions,
          mcq_link: screeningTest.mcq_link,
          deadline: screeningTest.deadline
        } : null,
        // Latest test attempt details
        test_attempt: latestAttempt ? {
          id: latestAttempt.id,
          started_at: latestAttempt.started_at,
          submitted_at: latestAttempt.submitted_at,
          score: latestAttempt.score,
          total_questions: latestAttempt.total_questions,
          score_percentage: testScorePercentage,
          passed: testPassed,
          time_taken_seconds: latestAttempt.time_taken_seconds,
          status: latestAttempt.status,
          tab_switches: latestAttempt.tab_switches
        } : null,        // All test attempts for detailed view
        all_test_attempts: userAttempts.map((attempt: any) => ({
          id: attempt.id,
          started_at: attempt.started_at,
          submitted_at: attempt.submitted_at,
          score: attempt.score,
          total_questions: attempt.total_questions,
          score_percentage: attempt.score, // Score is already stored as percentage
          time_taken_seconds: attempt.time_taken_seconds,
          status: attempt.status,
          tab_switches: attempt.tab_switches
        })),
        // Award assignment details
        award_assigned_by_admin: awardAssignedByAdmin ? {
          name: awardAssignedByAdmin.name,
          email: awardAssignedByAdmin.email
        } : null
      };
    });

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch event registrations" }, 
      { status: 500 }
    );
  }
}
