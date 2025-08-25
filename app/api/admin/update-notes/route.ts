import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { registration_id, admin_notes } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: "Missing registration_id" }, 
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

    // Update admin notes
    const { error } = await supabase
      .from('registrations')
      .update({ 
        admin_notes: admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', registration_id);

    if (error) {
      console.error('Error updating admin notes:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Admin notes updated successfully" 
    });
  } catch (error) {
    console.error("Error updating admin notes:", error);
    return NextResponse.json(
      { error: "Failed to update admin notes" }, 
      { status: 500 }
    );
  }
}
