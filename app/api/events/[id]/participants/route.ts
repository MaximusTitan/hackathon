import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: eventId } = await params;

  const { data: participants, error } = await supabase
    .from("registrations")
    .select(`
      id,
      user_id,
      user_name,
      user_email,
      user_linkedin
    `)
    .eq("event_id", eventId)
    .order("registered_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch profile photos for all participants
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

  // Attach photo_url to each participant
  const participantsWithPhoto =
    participants?.map((p) => ({
      ...p,
      photo_url: photoMap[p.user_id] || null,
    })) || [];

  return NextResponse.json({ participants: participantsWithPhoto });
}
