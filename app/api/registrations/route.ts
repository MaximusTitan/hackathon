import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/utils/supabase/require-session";
import { sendEventRegistrationEmail } from "@/utils/email-service";

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

    // Fetch event details for email
    const { data: eventData } = await supabase
      .from('events')
      .select('id,title,description,start_date,end_date,start_time,end_time,event_type,meeting_link,location,venue_name,address_line1,city,postal_code,is_paid,price')
      .eq('id', event_id)
      .single();

    let emailResult: any = null;
  if (eventData && userData.email) {
      try {
        emailResult = await sendEventRegistrationEmail({
          to: userData.email,
            userName: userData.name,
            event: eventData
        });
    // email result processed
      } catch (err) {
        emailResult = { ok: false, exception: (err as Error).message };
      }
    }

  return NextResponse.json({ success: true, emailSent: !!emailResult?.ok, emailSkipped: emailResult?.skipped || false, emailError: (!emailResult?.ok && !emailResult?.skipped) ? (emailResult?.error || emailResult?.exception) : undefined, emailDebug: process.env.NODE_ENV !== 'production' ? emailResult : undefined });
  } catch (error) {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
