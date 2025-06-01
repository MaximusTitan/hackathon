import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const supabase = await createClient();

    // Get winners and runners-up for this event with user profile data
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        user_id,
        user_name,
        user_email,
        user_linkedin,
        award_type,
        award_assigned_at
      `)
      .eq('event_id', eventId)
      .in('award_type', ['winner', 'runner_up'])
      .order('award_assigned_at', { ascending: true });

    if (error) {
      console.error("Error fetching winners:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Get user profile photos for all winners and runners-up
    const userIds = (data || []).map(p => p.user_id).filter(Boolean);
    let userProfiles: { [key: string]: string } = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, photo_url')
        .in('user_id', userIds);

      // Create a mapping of user_id to photo_url
      if (profiles) {
        profiles.forEach(profile => {
          if (profile.user_id && profile.photo_url) {
            userProfiles[profile.user_id] = profile.photo_url;
          }
        });
      }
    }

    // Separate winners and runners-up and add photo URLs
    const winners = (data || [])
      .filter(participant => participant.award_type === 'winner')
      .map(p => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_name,
        user_email: p.user_email,
        user_linkedin: p.user_linkedin,
        award_type: p.award_type,
        photo_url: userProfiles[p.user_id] || null
      }));

    const runnersUp = (data || [])
      .filter(participant => participant.award_type === 'runner_up')
      .map(p => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_name,
        user_email: p.user_email,
        user_linkedin: p.user_linkedin,
        award_type: p.award_type,
        photo_url: userProfiles[p.user_id] || null
      }));

    return NextResponse.json({
      winners,
      runnersUp
    });
  } catch (error) {
    console.error("Error fetching event winners:", error);
    return NextResponse.json(
      { error: "Failed to fetch event winners" },
      { status: 500 }
    );
  }
}
