import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";
import { v4 as uuidv4 } from "uuid";

// Service role client for privileged storage ops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Ensure authenticated admin user
  const result = await getSupabaseAndSession();
  if (!result.ok) return result.res;
  const { session } = result;
  const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.user_metadata?.role === null;
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("logo");
    const eventId = form.get("eventId");

    console.log('Upload logo request - File:', file?.constructor.name, 'EventId:', eventId);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No logo image provided" }, { status: 400 });
    }

    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate file size (2MB limit)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 2MB" }, { status: 400 });
    }

    console.log('Uploading logo - File size:', file.size, 'Type:', file.type, 'Name:', file.name);

    // Generate path and upload to event-images bucket (same as events)
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `recruiting-logos/${eventId}/${uuidv4()}.${ext}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('event-images') // Use existing event-images bucket
      .upload(fileName, file, { upsert: false });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('event-images')
      .getPublicUrl(fileName);

    console.log('Logo uploaded successfully:', publicUrl);

    return NextResponse.json({ publicUrl });
  } catch (err: any) {
    console.error('Recruiting partner logo upload error:', err);
    return NextResponse.json({ error: err?.message || "Logo upload failed" }, { status: 500 });
  }
}
