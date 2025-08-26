import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;

  try {
    const { publicUrl } = await request.json();
    if (!publicUrl || typeof publicUrl !== 'string') {
      return NextResponse.json({ error: 'publicUrl is required' }, { status: 400 });
    }

    // Expecting a URL like: https://.../storage/v1/object/public/profile-photos/<path>
    const marker = "/storage/v1/object/public/profile-photos/";
    const idx = publicUrl.indexOf(marker);
    if (idx === -1) {
      return NextResponse.json({ error: 'Invalid publicUrl for profile-photos' }, { status: 400 });
    }
    const objectPath = publicUrl.substring(idx + marker.length);
    if (!objectPath) {
      return NextResponse.json({ error: 'Invalid object path' }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage
      .from('profile-photos')
      .remove([objectPath]);

    if (error) {
      // Return 200 anyway but include warning so UI can proceed clearing DB
      return NextResponse.json({ warning: error.message });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to delete image' }, { status: 500 });
  }
}
