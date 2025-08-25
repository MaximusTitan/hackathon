import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

// DELETE - Remove recruiting partner
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;
  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === null;
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }    const { error } = await supabase
      .from('event_recruiting_partners')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting recruiting partner:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in recruiting partners DELETE:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
