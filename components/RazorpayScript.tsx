"use client";

import { useEffect, useState } from "react";

export default function RazorpayScript() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only load if not already loaded
    if (window.Razorpay) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    
    script.onload = () => setLoaded(true);
    
    document.body.appendChild(script);

    return () => {
      // Cleanup function if needed
    };
  }, []);

  return null; // This component doesn't render anything
}
