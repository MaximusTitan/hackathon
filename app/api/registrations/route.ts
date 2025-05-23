import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    
    if (!event_id) {
      return NextResponse.json({ error: "Missing event_id" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Check if already registered
    const { data: existing } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .maybeSingle();
      
    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: "Already registered" 
      });
    }

    // Get user information
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('name, email, linkedin')
      .eq('id', userId)
      .maybeSingle();
    
    // Fall back to auth user data if no profile exists
    const name = userProfile?.name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Unknown';
    const email = userProfile?.email || session.user.email;
    const linkedin = userProfile?.linkedin || session.user.user_metadata?.linkedin || null;
    
    // Insert registration
    const { error } = await supabase
      .from('registrations')
      .insert([
        { 
          user_id: userId, 
          event_id, 
          user_name: name,
          user_email: email,
          user_linkedin: linkedin
        }
      ]);
    
    if (error) {
      console.error("Registration error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
