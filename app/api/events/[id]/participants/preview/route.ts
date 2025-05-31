import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: eventId } = await params;

  try {
    // Get total count first
    const { count, error: countError } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (countError) {
      console.error("Error getting participant count:", countError);
      return NextResponse.json({ count: 0, participants: [] });
    }

    // Get first 6 participants with basic info for preview
    const { data: participants, error } = await supabase
      .from("registrations")
      .select(`
        id,
        user_id,
        user_name
      `)
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true })
      .limit(6);

    if (error) {
      console.error("Error getting participants:", error);
      return NextResponse.json({ count: count || 0, participants: [] });
    }

    // Fetch profile photos for these participants
    const userIds = participants?.map((p) => p.user_id) || [];
    let photoMap: Record<string, string | null> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, photo_url")
        .in("id", userIds);

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

    // Attach photo_url to participants
    const participantsWithPhoto =
      participants?.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        user_name: p.user_name,
        photo_url: photoMap[p.user_id] || null,
      })) || [];

    return NextResponse.json({ 
      count: count || 0, 
      participants: participantsWithPhoto 
    });
  } catch (error) {
    console.error("Error in participants preview:", error);
    return NextResponse.json({ count: 0, participants: [] });
  }
}
