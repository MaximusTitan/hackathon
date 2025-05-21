import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("events").select("*").order("date", { ascending: true });
  if (error) {
    return NextResponse.json({ events: [] }, { status: 500 });
  }
  return NextResponse.json({ events: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const body = await req.json();
  const { title, date, location, image_url } = body;
  const { error } = await supabase.from("events").insert([{ title, date, location, image_url }]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
