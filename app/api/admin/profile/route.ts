import { NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

export async function POST(req: Request) {
  try {
    const result = await getSupabaseAndSession();
    if (!result.ok) return result.res;
    const { supabase, session } = result;

    const { name, email } = await req.json();

    // Insert into admin_profiles
    const { error } = await supabase
      .from('admin_profiles')
      .insert([
        {
          id: session.user.id,
          name,
          email
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create admin profile" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { supabase, session } = result;

  // Verify admin role
  const isAdmin = session.user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: profile, error } = await supabase
    .from('admin_profiles')
    .select('*')
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

  // Verify admin role
  const isAdmin = session.user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates = await request.json();
  
  const { error } = await supabase
    .from('admin_profiles')
    .update({
      name: updates.name,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update auth metadata
  await supabase.auth.updateUser({
    data: { name: updates.name }
  });

  return NextResponse.json({ success: true });
}
