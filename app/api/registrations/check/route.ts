import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const event_id = searchParams.get('event_id');

    if (!event_id) {
      return NextResponse.json(
        { registered: false, authenticated: false, error: "Missing event_id parameter" }, 
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ registered: false, authenticated: false });
    }

    const userId = session.user.id;
    
    // Check if user is registered for this event
    const { data, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .maybeSingle();

    if (error) {
      console.error("Error checking registration:", error);
      return NextResponse.json({ 
        error: error.message, 
        registered: false, 
        authenticated: true 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      registered: !!data, 
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
