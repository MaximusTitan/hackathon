import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  
  const { id: profileUserId } = await params;

  if (!profileUserId) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }

  // Fetch the profile data for the specified user
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', profileUserId)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ profile });
}
