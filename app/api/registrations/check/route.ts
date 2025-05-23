import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    // Get current user's session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ registered: false });
    }

    // Check if user is registered
    const { data, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('event_id', event_id)
      .single();

    if (error) {
      return NextResponse.json({ registered: false });
    }

    return NextResponse.json({ registered: !!data });
  } catch (error) {
    return NextResponse.json({ registered: false });
  }
}
