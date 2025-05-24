import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Use getUser for secure authentication instead of getSession
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return NextResponse.json({ 
        authenticated: false,
        user: null 
      });
    }

    return NextResponse.json({ 
      authenticated: true,
      user: user 
    });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ 
      authenticated: false,
      user: null 
    });
  }
}
