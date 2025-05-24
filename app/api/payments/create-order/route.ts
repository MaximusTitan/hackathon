import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { event_id, amount } = await request.json();
    
    if (!event_id || !amount) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Use getUser for secure authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "User authentication failed" }, { status: 401 });
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!event.is_paid) {
      return NextResponse.json({ error: "This is not a paid event" }, { status: 400 });
    }

    // Verify Razorpay credentials are available
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json({ error: "Payment gateway misconfigured" }, { status: 500 });
    }

    // Initialize Razorpay with actual credentials
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create a real receipt ID for tracking
    let rawReceipt = `event_${event_id}_user_${user.id}_${Date.now()}`;
    // Hash and truncate to ensure <= 40 chars
    const receipt = crypto.createHash("sha256").update(rawReceipt).digest("hex").slice(0, 40);
    
    try {
      // Create a real Razorpay order using the API
      const order = await razorpay.orders.create({
        amount: amount,
        currency: "INR",
        receipt: receipt,
        notes: {
          event_id: event_id,
          user_id: user.id
        }
      });
      
      // Store order details in database
      const { error: orderError } = await supabase.from("payment_orders").insert({
        order_id: order.id,
        user_id: user.id,
        event_id: event_id,
        amount: amount / 100, // Convert from paise to rupees
        receipt: receipt,
        status: "created"
      });
      
      if (orderError) {
        console.error("Database error:", orderError);
        // Continue anyway since the order was created in Razorpay
      }
      
      // Return order data with key_id for the client
      return NextResponse.json({
        ...order,
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      });
      
    } catch (razorpayError: any) {
      console.error("Razorpay error:", razorpayError);
      return NextResponse.json({ 
        error: razorpayError.message || "Failed to create payment order",
        details: razorpayError
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" }, 
      { status: 500 }
    );
  }
}
