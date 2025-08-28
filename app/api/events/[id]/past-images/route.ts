import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAndSession } from "@/utils/supabase/require-session";
import { v4 as uuidv4 } from "uuid";

// Service role client for privileged storage ops
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    const { data: images, error } = await supabaseAdmin
      .from('past_event_images')
      .select('*')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching past event images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getSupabaseAndSession();
  if (!auth.ok) {
    
    return auth.res;
  }
  const { session } = auth;
  
  
  try {
    const { id: eventId } = await params;
    

    // Ensure admin
    const isAdmin = session.user.user_metadata?.role === 'admin' || session.user.email === 'admin@hackon.com';
    if (!isAdmin) {
      
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images').filter(f => f instanceof File) as File[];
    
    
    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const uploaded: any[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const caption = (formData.get(`caption_${i}`) as string) || null;
      
      
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${eventId}/${uuidv4()}_${i}.${ext}`;
      
      
      const { error: uploadError } = await supabaseAdmin.storage
        .from('past-event-images')
        .upload(fileName, file, { upsert: false });
        
      if (uploadError) {
        console.error('Storage upload error:', uploadError.message);
        continue;
      }
      
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('past-event-images')
        .getPublicUrl(fileName);
        
      
      const { data, error: dbError } = await supabaseAdmin
        .from('past_event_images')
        .insert({ event_id: eventId, image_url: publicUrl, caption, uploaded_by: session.user.id })
        .select()
        .single();
        
      if (!dbError && data) {
        uploaded.push(data);
        
      } else {
        console.error('Database error:', dbError?.message);
      }
    }
    
    
    return NextResponse.json({ message: `${uploaded.length} images uploaded`, images: uploaded });
  } catch (err) {
    console.error('Past images upload failed:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
