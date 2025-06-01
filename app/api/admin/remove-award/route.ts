import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { registration_id } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: "Missing registration_id" }, 
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

    // Remove the award from the registration
    const { error } = await supabase
      .from('registrations')
      .update({
        award_type: null,
        award_assigned_at: null,
        award_assigned_by: null
      })
      .eq('id', registration_id);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: "Award removed successfully"
    });
  } catch (error) {
    console.error("Error removing award:", error);
    return NextResponse.json(
      { error: "Failed to remove award" }, 
      { status: 500 }
    );
  }
}
