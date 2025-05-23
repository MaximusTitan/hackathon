import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ 
      authenticated: false,
      user: null 
    });
  }

  return NextResponse.json({ 
    authenticated: true,
    user: session.user 
  });
}
