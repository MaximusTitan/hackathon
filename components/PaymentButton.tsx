"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PaymentButtonProps {
  eventId: string;
  amount: number;
  razorpayKeyId: string;
  eventTitle: string;
  onPaymentSuccess: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentButton({
  eventId,
  amount,
  razorpayKeyId,
  eventTitle,
  onPaymentSuccess,
  disabled = false
}: PaymentButtonProps) {
  const [processing, setProcessing] = useState(false);

  const handlePayment = async () => {
    try {
      setProcessing(true);

      // Create order on backend
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount * 100, // Convert to paise
          event_id: eventId,
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Initialize Razorpay payment
      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: "INR",
        name: "Event Registration",
        description: `Registration for ${eventTitle}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                event_id: eventId,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyRes.ok && verifyData.success) {
              toast.success("Payment successful! You are now registered for the event.");
              onPaymentSuccess();
            } else {
              throw new Error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#e11d48", // Rose color to match theme
        },
      };

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        throw new Error("Razorpay SDK not loaded");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || processing}
      className="bg-rose-600 hover:bg-rose-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
    >
      {processing ? "Processing..." : `Pay ₹${amount} & Register`}
    </Button>
  );
}
