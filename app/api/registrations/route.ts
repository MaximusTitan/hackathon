import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/utils/supabase/require-session";

export async function POST(request: Request) {
  try {
    const { event_id } = await request.json();
    
    if (!event_id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

  const result = await getSupabaseAndUser();
  if (!result.ok) return result.res;
  const { supabase, user } = result;

    const userId = user.id;
    
    // Check if already registered
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .single();
      
    if (existingReg) {
      return NextResponse.json({ message: "Already registered" });
    }

    // Get user profile data
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('name, email, linkedin')
      .eq('id', userId)
      .single();
    
    // Prepare user data for registration
    const userData = {
      name: userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: userProfile?.email || user.email,
      linkedin: userProfile?.linkedin || user.user_metadata?.linkedin || null
    };

    // Create registration record
    const { error: regError } = await supabase
      .from('registrations')
      .insert([
        { 
          user_id: userId, 
          event_id, 
          user_name: userData.name,
          user_email: userData.email,
          user_linkedin: userData.linkedin
        }
      ]);

    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
