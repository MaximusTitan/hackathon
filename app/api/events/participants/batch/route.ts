import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  try {
    const { eventIds } = await request.json();
    
    if (!eventIds || !Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({});
    }

    // Get participant counts for all events in one query
    const { data: countData, error: countError } = await supabase
      .from("registrations")
      .select("event_id")
      .in("event_id", eventIds);

    if (countError) {
      console.error("Error getting participant counts:", countError);
      return NextResponse.json({});
    }

    // Count participants per event
    const countMap = countData.reduce((acc: Record<string, number>, curr: any) => {
      acc[curr.event_id] = (acc[curr.event_id] || 0) + 1;
      return acc;
    }, {});

    // Get preview participants (first 6) for each event
    const participantPromises = eventIds.map(async (eventId) => {
      const { data: participants } = await supabase
        .from("registrations")
        .select(`
          id,
          user_id,
          user_name
        `)
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(6);

      return {
        eventId,
        participants: participants || []
      };
    });

    const participantResults = await Promise.all(participantPromises);

    // Get all unique user IDs to fetch photos
    const allUserIds = participantResults
      .flatMap(result => result.participants.map(p => p.user_id))
      .filter((id, index, arr) => arr.indexOf(id) === index);

    // Fetch profile photos for all users at once
    let photoMap: Record<string, string | null> = {};
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, photo_url")
        .in("id", allUserIds);

      if (profiles) {
        photoMap = profiles.reduce(
          (acc: Record<string, string | null>, curr: any) => {
            acc[curr.id] = curr.photo_url || null;
            return acc;
          },
          {}
        );
      }
    }

    // Build response with participant data for each event
    const response: Record<string, { count: number; participants: any[] }> = {};
    
    participantResults.forEach(({ eventId, participants }) => {
      response[eventId] = {
        count: countMap[eventId] || 0,
        participants: participants.map(p => ({
          id: p.id,
          user_id: p.user_id,
          user_name: p.user_name,
          photo_url: photoMap[p.user_id] || null,
        }))
      };
    });

    // Ensure all requested events have entries (even if empty)
    eventIds.forEach(eventId => {
      if (!response[eventId]) {
        response[eventId] = {
          count: 0,
          participants: []
        };
      }
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in batch participants:", error);
    return NextResponse.json({});
  }
}
