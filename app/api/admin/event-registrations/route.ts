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
    }

    // Get registrations with user details and payment details from our updated schema
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
        presentation_link,
        presentation_notes,
        award_type,
        award_assigned_at
      `)
      .eq('event_id', event_id);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    // Format the data for the frontend
    const registrations = data.map(reg => ({
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
      presentation_link: reg.presentation_link,
      presentation_notes: reg.presentation_notes,
      award_type: reg.award_type,
      award_assigned_at: reg.award_assigned_at,
      user: {
        name: reg.user_name || 'Unknown',
        email: reg.user_email || 'Unknown',
        linkedin: reg.user_linkedin || null
      }
    }));

    return NextResponse.json({ registrations });
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch event registrations" }, 
      { status: 500 }
    );
  }
}
