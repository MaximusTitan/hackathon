import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const auth = await getSupabaseAndSession();
  if (!auth.ok) return auth.res;
  const { session } = auth;
  try {
    const { imageId } = await params;
    const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.email === 'admin@hackon.com';
    if (!isAdmin) return NextResponse.json({ error: 'Admin access required' }, { status: 403 });

    const { data: image, error: fetchError } = await supabaseAdmin
      .from('past_event_images')
      .select('image_url')
      .eq('id', imageId)
      .single();
    if (fetchError || !image) return NextResponse.json({ error: 'Image not found' }, { status: 404 });

    const url = new URL(image.image_url);
    const filePath = url.pathname.split('/storage/v1/object/public/past-event-images/')[1];
    if (filePath) {
      const { error: storageError } = await supabaseAdmin.storage
        .from('past-event-images')
        .remove([filePath]);
      if (storageError) console.error('Storage deletion error:', storageError.message);
    }
    const { error: dbError } = await supabaseAdmin
      .from('past_event_images')
      .delete()
      .eq('id', imageId);
    if (dbError) return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
    return NextResponse.json({ message: 'Image deleted successfully' });
  } catch (err) {
    console.error('Past image delete failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
