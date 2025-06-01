import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { attended } = await request.json();
    const { id: registrationId } = await params;

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

    // Update attendance status
    const { error } = await supabase
      .from('registrations')
      .update({ attended })
      .eq('id', registrationId);

    if (error) {
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating attendance:", error);
    return NextResponse.json(
      { error: "Failed to update attendance" }, 
      { status: 500 }
    );
  }
}
