import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id: eventId } = await params;
  
  // Get pagination parameters from URL
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  // Get total count first
  const { count, error: countError } = await supabase
    .from("registrations")
    .select("*", { count: 'exact', head: true })
    .eq("event_id", eventId);

  if (countError) {
    return NextResponse.json(
      { error: countError.message },
      { status: 500, headers: { "Cache-Control": "s-maxage=30" } }
    );
  }

  // Get paginated participants
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
    .order("registered_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500, headers: { "Cache-Control": "s-maxage=30" } }
    );
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

  // Attach photo_url and ensure user_id is included
  const participantsWithPhoto =
    participants?.map((p) => ({
      id: p.id,
      user_id: p.user_id, // Ensure user_id is included
      user_name: p.user_name,
      user_email: p.user_email,
      user_linkedin: p.user_linkedin,
      photo_url: photoMap[p.user_id] || null,
    })) || [];

  return NextResponse.json(
    { 
      participants: participantsWithPhoto,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    },
    { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=300" } }
  );
}
