import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');
    
    // Server-side pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const sort = searchParams.get('sort') || 'registered_at';
    const order = searchParams.get('order') || 'desc';
    const isExport = searchParams.get('export') === 'true';
    
    const offset = (page - 1) * limit;

    if (!event_id) {
      return NextResponse.json(
        { error: "Missing event_id parameter" }, 
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

    // Build query with filters and search
    let query = supabase
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
        presentation_link,
        presentation_notes,
        award_type,
        award_assigned_at,
        award_assigned_by,
        admin_notes,
        admin_score,
        qualification_status,
        qualification_remarks,
        qualified_at,
        qualified_by
      `, { count: 'exact' })
      .eq('event_id', event_id);

    // Apply search filter
    if (search) {
      query = query.or(`user_name.ilike.%${search}%,user_email.ilike.%${search}%`);
    }

    // Apply status filters
    switch (filter) {
      case 'attended':
        query = query.eq('attended', true);
        break;
      case 'not_attended':
        query = query.eq('attended', false);
        break;
      case 'screening_completed':
        query = query.eq('screening_status', 'completed');
        break;
      case 'screening_pending':
        query = query.in('screening_status', ['pending', null]);
        break;
      case 'screening_passed':
        // Will be handled after fetching test attempts
        break;
      case 'screening_failed':
        // Will be handled after fetching test attempts
        break;
      case 'presentation_submitted':
        query = query.in('presentation_status', ['submitted', 'reviewed']);
        break;
      case 'qualified':
        query = query.eq('qualification_status', 'qualified');
        break;
      case 'rejected':
        query = query.eq('qualification_status', 'rejected');
        break;
      case 'qualification_pending':
        query = query.eq('presentation_status', 'submitted').is('qualification_status', null);
        break;
      case 'winners':
        query = query.eq('award_type', 'winner');
        break;
      case 'runners_up':
        query = query.eq('award_type', 'runner_up');
        break;
      case 'high_score':
        query = query.gte('admin_score', 80);
        break;
      case 'no_admin_score':
        query = query.is('admin_score', null);
        break;
      // 'all' and default case - no additional filter
    }

    // Apply sorting
    const ascending = order === 'asc';
    const needsTestScoreSorting = sort === 'test_score';
    
    switch (sort) {
      case 'name':
        query = query.order('user_name', { ascending });
        break;
      case 'email':
        query = query.order('user_email', { ascending });
        break;
      case 'registered_at':
        query = query.order('registered_at', { ascending });
        break;
      case 'attended':
        query = query.order('attended', { ascending });
        break;
      case 'admin_score':
        query = query.order('admin_score', { ascending, nullsFirst: !ascending });
        break;
      case 'test_score':
        // Test score sorting will be handled after data processing
        // For now, just order by registered_at to have consistent ordering
        query = query.order('registered_at', { ascending: false });
        break;
      default:
        query = query.order('registered_at', { ascending: false });
        break;
    }

    // Apply pagination (except for screening passed/failed filters and test_score sorting which need post-processing, or when exporting)
    const needsPostProcessingFilter = filter === 'screening_passed' || filter === 'screening_failed' || needsTestScoreSorting;
    if (!needsPostProcessingFilter && !isExport) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    // Get detailed test attempts for current page registrations only
    const registrationIds = data?.map(reg => reg.id) || [];
    let testAttempts: any[] = [];
    let screeningTests: any[] = [];
    let adminProfiles: any[] = [];

    if (registrationIds.length > 0) {
      // Build queries
      const testAttemptsPromise = supabase
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
        .in('registration_id', registrationIds);

      const screeningTestIds = Array.from(new Set(data.map((reg: any) => reg.screening_test_id).filter(Boolean)));
      const screeningTestsPromise = screeningTestIds.length > 0
        ? supabase
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
            .in('id', screeningTestIds)
        : Promise.resolve({ data: [] as any[] });

      const awardAssignedByIds = Array.from(new Set(data.map((reg: any) => reg.award_assigned_by).filter(Boolean)));
      const adminProfilesPromise = awardAssignedByIds.length > 0
        ? supabase
            .from('admin_profiles')
            .select(`
              id,
              name,
              email
            `)
            .in('id', awardAssignedByIds)
        : Promise.resolve({ data: [] as any[] });

      const [testAttemptsRes, screeningTestsRes, adminProfilesRes] = await Promise.all([
        testAttemptsPromise,
        screeningTestsPromise,
        adminProfilesPromise,
      ]);

      testAttempts = (testAttemptsRes as any).data || [];
      screeningTests = (screeningTestsRes as any).data || [];
      adminProfiles = (adminProfilesRes as any).data || [];
    }

    // Create lookup maps
    const testAttemptsMap = new Map();
    testAttempts.forEach(attempt => {
      if (!testAttemptsMap.has(attempt.registration_id)) {
        testAttemptsMap.set(attempt.registration_id, []);
      }
      testAttemptsMap.get(attempt.registration_id).push(attempt);
    });

    const screeningTestsMap = new Map();
    screeningTests.forEach(test => {
      screeningTestsMap.set(test.id, test);
    });

    const adminProfilesMap = new Map();
    adminProfiles.forEach(admin => {
      adminProfilesMap.set(admin.id, admin);
    });    // Format the data for the frontend with comprehensive member information
    const registrations = (data || []).map(reg => {
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

    // Apply post-processing filters for screening passed/failed
    let filteredRegistrations = registrations;
    let finalCount = count || 0;

    if (filter === 'screening_passed') {
      filteredRegistrations = registrations.filter(reg => 
        reg.test_attempt && reg.test_attempt.passed === true
      );
      finalCount = filteredRegistrations.length;
    } else if (filter === 'screening_failed') {
      filteredRegistrations = registrations.filter(reg => 
        reg.test_attempt && reg.test_attempt.passed === false
      );
      finalCount = filteredRegistrations.length;
    }

    // Apply test score sorting if requested
    if (needsTestScoreSorting) {
      filteredRegistrations.sort((a, b) => {
        const scoreA = a.test_attempt?.score_percentage || -1; // Use -1 for no score to sort them last
        const scoreB = b.test_attempt?.score_percentage || -1;
        
        if (ascending) {
          return scoreA - scoreB;
        } else {
          return scoreB - scoreA;
        }
      });
      
      // Update finalCount if we're also filtering
      if (filter === 'all') {
        finalCount = filteredRegistrations.length;
      }
    }

    // Apply pagination for post-processed filters
    if (needsPostProcessingFilter) {
      const startIndex = offset;
      const endIndex = offset + limit;
      filteredRegistrations = filteredRegistrations.slice(startIndex, endIndex);
    }

    return NextResponse.json({ 
      registrations: filteredRegistrations, 
      totalCount: finalCount,
      currentPage: page,
      itemsPerPage: limit 
    });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch event registrations" }, 
      { status: 500 }
    );
  }
}
