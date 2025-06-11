import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Create a service role client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Create a regular client for auth operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  try {
    const { id: eventId } = await params;

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
    }

    // Check admin role
    const isAdmin = user.user_metadata?.role === 'admin' || user.email === 'admin@hackon.com';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const images = formData.getAll('images') as File[];
    
    if (images.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    const uploadedImages = [];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const caption = formData.get(`caption_${i}`) as string;
      
      // Upload image to Supabase Storage
      const fileExt = image.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}_${i}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('past-event-images')
        .upload(fileName, image);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('past-event-images')
        .getPublicUrl(fileName);

      // Save to database
      const { data: dbData, error: dbError } = await supabaseAdmin
        .from('past_event_images')
        .insert({
          event_id: eventId,
          image_url: publicUrl,
          caption: caption || null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (!dbError && dbData) {
        uploadedImages.push(dbData);
      }
    }

    return NextResponse.json({ 
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages 
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
