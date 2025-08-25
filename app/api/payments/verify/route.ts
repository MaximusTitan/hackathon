import { NextResponse } from "next/server";
import { getSupabaseAndUser } from "@/utils/supabase/require-session";
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

    const result = await getSupabaseAndUser();
    if (!result.ok) return result.res;
    const { supabase, user } = result;

    // Verify Razorpay signature (order_id|payment_id signed with key_secret)
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json({ error: "Payment gateway misconfigured" }, { status: 500 });
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // Validate the order exists and belongs to this user & event
    const { data: orderRec, error: orderErr } = await supabase
      .from("payment_orders")
      .select("id,user_id,event_id,amount,status")
      .eq("order_id", razorpay_order_id)
      .single();

    if (orderErr || !orderRec) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (orderRec.user_id !== user.id || orderRec.event_id !== event_id) {
      return NextResponse.json({ error: "Order does not match user or event" }, { status: 403 });
    }

    // Get event details (price etc.)
    const { data: event } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Idempotency: if already registered, return success
    const { data: existingRegistration } = await supabase
      .from("registrations")
      .select("id")
      .eq("user_id", user.id)
      .eq("event_id", event_id)
      .maybeSingle?.() ?? { data: null } as any;
    if (existingRegistration) {
      // Ensure order marked completed for consistency
      await supabase
        .from("payment_orders")
        .update({ status: "completed", payment_id: razorpay_payment_id, updated_at: new Date().toISOString() })
        .eq("order_id", razorpay_order_id);
      return NextResponse.json({ success: true, message: "Already registered" });
    }

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
          user_name: user.user_metadata?.name || user.email?.split("@")[0] || "Unknown",
          user_email: user.email,
          user_linkedin: user.user_metadata?.linkedin || null,
        },
      ]);
    if (regError) {
      console.error("Registration error:", regError);
      return NextResponse.json({ error: "Registration failed" }, { status: 500 });
    }

    // Update payment order status -> completed
    await supabase
      .from("payment_orders")
      .update({
        status: "completed",
        payment_id: razorpay_payment_id,
        updated_at: new Date().toISOString(),
      })
      .eq("order_id", razorpay_order_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 500 });
  }
}
