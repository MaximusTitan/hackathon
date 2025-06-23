import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const isAdmin = session.user.user_metadata?.role === 'admin' || 
                     session.user.user_metadata?.role === null;
                     
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { registration_id, qualification_status, qualification_remarks } = body;

    if (!registration_id || !qualification_status) {
      return NextResponse.json({ 
        error: 'Missing required fields: registration_id and qualification_status' 
      }, { status: 400 });
    }

    if (!['qualified', 'rejected'].includes(qualification_status)) {
      return NextResponse.json({ 
        error: 'Invalid qualification_status. Must be either "qualified" or "rejected"' 
      }, { status: 400 });
    }

    // Update the registration with qualification decision
    const { data, error } = await supabase
      .from('registrations')
      .update({
        qualification_status,
        qualification_remarks,
        qualified_at: new Date().toISOString(),
        qualified_by: session.user.id
      })
      .eq('id', registration_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating qualification status:', error);
      return NextResponse.json({ 
        error: 'Failed to update qualification status',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      registration: data,
      message: `Participant marked as ${qualification_status} successfully`
    });

  } catch (error) {
    console.error('Error in qualification decision API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
