import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/utils/supabase/require-session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { error: "Missing event_id parameter", registered: false, authenticated: false }, 
        { status: 400 }
      );
    }

    const result = await getSupabaseAndUser();
    if (!result.ok) {
      return NextResponse.json({ registered: false, authenticated: false });
    }
    const { supabase, user } = result;

    const userId = user.id;
      // Check if user is registered for this event and get attendance status
    const { data, error } = await supabase
      .from('registrations')
      .select('id, attended')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .single();

    return NextResponse.json({ 
      registered: !!data, 
      attended: data?.attended || false,
      authenticated: true,
      userId: userId
    });
  } catch (error) {
    console.error("Error checking registration:", error);
    return NextResponse.json(
      { error: "Failed to check registration status", registered: false, authenticated: false }, 
      { status: 500 }
    );
  }
}
