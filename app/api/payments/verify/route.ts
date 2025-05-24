import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const {
      event_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = await request.json();

    if (!event_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Use getUser instead of getSession
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "User authentication failed" }, { status: 401 });
    }

    // Get event details
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if payment has already been processed
    const { data: existingRegistration } = await supabase
      .from("registrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", event_id)
      .single();

    if (existingRegistration) {
      return NextResponse.json({ success: true, message: "Already registered" });
    }

    // Update payment order status
    await supabase
      .from("payment_orders")
      .update({ 
        status: "completed",
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq("order_id", razorpay_order_id);

    // Get user profile data
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('name, email, linkedin')
      .eq('id', user.id)
      .single();

    const userData = {
      name: userProfile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Unknown',
      email: userProfile?.email || user.email,
      linkedin: userProfile?.linkedin || user.user_metadata?.linkedin || null
    };

    // Create registration record
    const { error: regError } = await supabase
      .from("registrations")
      .insert([
        {
          user_id: user.id,
          event_id,
          payment_id: razorpay_payment_id,
          order_id: razorpay_order_id,
          amount_paid: event.price,
          user_name: userData.name,
          user_email: userData.email,
          user_linkedin: userData.linkedin,
        },
      ]);

    if (regError) {
      console.error("Registration error:", regError);
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
