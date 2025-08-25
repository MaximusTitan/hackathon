import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function GET() {
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*, contact_number, github, education, years_of_experience, programming_languages, expertise, role')
    .eq('id', session.user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile });
}

export async function PUT(request: Request) {
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

  const updates = await request.json();

  // Ensure photo_url is included in the update if present in the request
  const updateData: any = {
    name: updates.name,
    linkedin: updates.linkedin,
    contact_number: updates.contact_number,
    github: updates.github,
    education: updates.education,
    years_of_experience: updates.years_of_experience,
    programming_languages: updates.programming_languages,
    expertise: updates.expertise,
    role: updates.role,
    updated_at: new Date().toISOString(),
  };
  if (typeof updates.photo_url === "string" && updates.photo_url.length > 0) {
    updateData.photo_url = updates.photo_url;
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also update auth metadata
  await supabase.auth.updateUser({
    data: { name: updates.name }
  });

  return NextResponse.json({ success: true });
}
