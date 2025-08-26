import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";
import { v4 as uuidv4 } from "uuid";

// Service role client for privileged storage ops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Require an authenticated user (no admin requirement)
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { session } = result;

  try {
    const form = await request.formData();
    const file = form.get("image");
    const folder = (form.get("folder") as string) || "profile-photos";

    // Only allow uploading to the profile-photos bucket from this route
    if (folder !== "profile-photos") {
      return NextResponse.json({ error: "Invalid folder" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Generate a deterministic path under the user's namespace to avoid collisions
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${uuidv4()}.${ext}`;
    const filePath = `users/${session.user.id}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from(folder)
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(folder)
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Upload failed" }, { status: 500 });
  }
}
