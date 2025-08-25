import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// GET /api/events/participants/preview-batch?ids=<comma-separated event ids>
export async function GET(request: Request) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const idsParam = url.searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  const eventIds = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (eventIds.length === 0) {
    return NextResponse.json({ results: {} });
  }

  try {
    // 1) Get all registration event_ids for the visible events and count in code
    const { data: registrations, error: countsError } = await supabase
      .from("registrations")
      .select("event_id")
      .in("event_id", eventIds);

    if (countsError) {
      console.error("Error getting participant counts:", countsError);
    }

    const countsMap = new Map<string, number>();
    (registrations || []).forEach((row: any) => {
      countsMap.set(row.event_id, (countsMap.get(row.event_id) || 0) + 1);
    });

    // 2) Fetch up to 6 participants per event in parallel
    const participantPromises = eventIds.map((eventId) =>
      supabase
        .from("registrations")
        .select("id, user_id, user_name, event_id")
        .eq("event_id", eventId)
        .order("registered_at", { ascending: true })
        .limit(6)
    );

    const participantsRes = await Promise.all(participantPromises);
    const allParticipants = participantsRes
      .map((res) => res.data || [])
      .flat();

    // 3) Fetch all corresponding user profile photos in one query
    const userIds = Array.from(new Set(allParticipants.map((p: any) => p.user_id).filter(Boolean)));
    let photoMap: Record<string, string | null> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("user_profiles")
        .select("id, photo_url")
        .in("id", userIds);

      if (profiles) {
        photoMap = profiles.reduce((acc: Record<string, string | null>, curr: any) => {
          acc[curr.id] = curr.photo_url || null;
          return acc;
        }, {});
      }
    }

    // 4) Group participants by event and attach photos
    const results: Record<string, { count: number; participants: Array<{ id: string; user_id: string; user_name: string | null; photo_url: string | null }> }> = {};

    for (const eventId of eventIds) {
      const listForEvent = allParticipants.filter((p: any) => p.event_id === eventId);
      results[eventId] = {
        count: countsMap.get(eventId) || 0,
        participants: listForEvent.map((p: any) => ({
          id: p.id,
          user_id: p.user_id,
          user_name: p.user_name,
          photo_url: photoMap[p.user_id] || null,
        })),
      };
    }

    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=600" } }
    );
  } catch (error) {
    console.error("Error in preview-batch:", error);
    return NextResponse.json(
      { results: {} },
      { headers: { "Cache-Control": "s-maxage=30" } }
    );
  }
}
