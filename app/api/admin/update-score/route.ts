import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { registration_id, admin_score } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: "Missing registration_id" }, 
        { status: 400 }
      );
    }

    if (admin_score < 0 || admin_score > 100) {
      return NextResponse.json(
        { error: "Score must be between 0 and 100" }, 
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

    // Update admin score
    const { error } = await supabase
      .from('registrations')
      .update({ 
        admin_score: admin_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', registration_id);

    if (error) {
      console.error('Error updating admin score:', error);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "Admin score updated successfully" 
    });
  } catch (error) {
    console.error("Error updating admin score:", error);
    return NextResponse.json(
      { error: "Failed to update admin score" }, 
      { status: 500 }
    );
  }
}
