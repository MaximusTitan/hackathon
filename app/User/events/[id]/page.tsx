"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarIcon, Clock, MapPin, ExternalLink, Video, Users } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

type Participant = {
  id: string;
  user_name: string | null;
  user_email: string | null;
  user_linkedin?: string | null;
  photo_url?: string | null; // Add photo_url
};

type Event = {
  id: string;
  title: string;
  description?: string | null;
  start_date: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  event_type: "virtual" | "offline" | null;
  meeting_link?: string | null;
  location?: string | null;
  location_link?: string | null;
  venue_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  image_url: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_paid?: boolean;
  price?: number;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registered, setRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initPage = async () => {
      try {
        // Fetch event details
        if (eventId) {
          const res = await fetch(`/api/events/${eventId}`);
          if (res.ok) {
            const data = await res.json();
            setEvent(data.event);
          }
        }

        // Check authentication status from the server
        const authRes = await fetch('/api/auth/check');
        const authData = await authRes.json();

        if (authData.authenticated) {
          setUser(authData.user);
          // Only check registration if user is authenticated
          const regRes = await fetch(`/api/registrations/check?event_id=${eventId}`);
          if (regRes.ok) {
            const regData = await regRes.json();
            setRegistered(regData.registered);
          }

          // --- Payment flow fix for post-sign-in ---
          if (typeof window !== 'undefined') {
            const paymentIntent = window.sessionStorage.getItem('register_payment_intent');
            if (paymentIntent === eventId) {
              window.sessionStorage.removeItem('register_payment_intent');
              if (event?.is_paid && event?.price && !registered) {
                // Wait for event to be set
                setTimeout(() => {
                  processPayment();
                }, 100);
              }
            }
          }
          // --- End payment flow fix ---
        } else {
          setUser(null);
          setRegistered(false);
        }

        // Fetch participants for this event
        if (eventId) {
          const partRes = await fetch(`/api/events/${eventId}/participants`);
          if (partRes.ok) {
            const partData = await partRes.json();
            setParticipants(partData.participants || []);
          }
        }
      } catch (error) {
        console.error("Error initializing page:", error);
      } finally {
        setCheckingAuth(false);
        setLoading(false);
      }
    };

    initPage();
  }, [eventId]);

  async function handleRegister() {
    try {
      // Check current auth state from server
      const authRes = await fetch('/api/auth/check');
      const authData = await authRes.json();

      const safeEventId = eventId || "";

      if (!authData.authenticated) {
        const returnUrl = `/User/events/${safeEventId}`;
        // --- Store payment intent if paid event ---
        if (event?.is_paid && event?.price && event.price > 0 && typeof window !== 'undefined') {
          window.sessionStorage.setItem('register_payment_intent', safeEventId);
        }
        router.push(`/sign-in?returnUrl=${encodeURIComponent(returnUrl)}`);
        return;
      }

      // Check if this is a paid event
      if (event?.is_paid && event?.price && event.price > 0) {
        await processPayment();
      } else {
        // Free event - direct registration
        await processRegistration();
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Error registering for event");
    }
  }

  async function processRegistration() {
    try {
      setRegistering(true);
      const res = await fetch("/api/registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (res.ok) {
        setRegistered(true);
        toast.success("Successfully registered for event!");
      } else {
        const errorData = await res.json();
        console.error("Registration failed:", errorData.error);
        toast.error(errorData.error || "Failed to register for event. Please try again.");
      }
    } catch (error) {
      console.error("Error registering:", error);
      toast.error("Error registering for event");
    } finally {
      setRegistering(false);
    }
  }

  async function processPayment() {
    if (!event?.is_paid || !event.price) {
      toast.error("Payment configuration error");
      return;
    }

    try {
      setRegistering(true);

      // Create payment order
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          amount: event.price * 100, // Convert to paise
        }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        console.error("Order creation failed:", errorData);
        toast.error(errorData.error || "Failed to create payment order");
        setRegistering(false);
        return;
      }

      const orderData = await orderRes.json();
      
      // Load Razorpay script dynamically
      if (!window.Razorpay) {
        await loadRazorpayScript();
      }

      // Create Razorpay options with verified order ID
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount.toString(),
        currency: orderData.currency,
        name: "Hackon",
        description: `Registration for ${event.title}`,
        order_id: orderData.id,
        prefill: {
          name: user?.user_metadata?.name || "",
          email: user?.email || "",
        },
        notes: {
          event_id: eventId,
        },
        theme: {
          color: "#e11d48",
        },
        handler: async function (response: any) {
          await verifyPayment(response);
        },
        modal: {
          ondismiss: function() {
            setRegistering(false);
            toast.error("Payment cancelled");
          }
        }
      };
      
      // Initialize payment
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function(response: any) {
        console.error('Payment failed:', response.error);
        toast.error(`Payment failed: ${response.error.description}`);
        setRegistering(false);
      });
      
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to process payment. Please try again.");
      setRegistering(false);
    }
  }

  async function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      
      document.body.appendChild(script);
    });
  }

  async function verifyPayment(paymentResponse: any) {
    try {
      // Verify payment on backend and complete registration
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        }),
      });

      if (verifyRes.ok) {
        setRegistered(true);
        toast.success("Payment successful! You are registered for the event.");
      } else {
        const error = await verifyRes.json();
        throw new Error(error.error || "Payment verification failed");
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      toast.error("Payment verification failed. Please contact support.");
    } finally {
      setRegistering(false);
    }
  }

  const getFullAddress = () => {
    if (!event) return "";
    const parts = [];
    if (event.venue_name) parts.push(event.venue_name);
    if (event.address_line1) parts.push(event.address_line1);
    const cityPostal = [];
    if (event.city) cityPostal.push(event.city);
    if (event.postal_code) cityPostal.push(event.postal_code);
    if (cityPostal.length > 0) {
      parts.push(cityPostal.join(" "));
    }
    return parts.length > 0 ? parts.join(", ") : event.location || "Location TBD";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center text-gray-500">
        Loading event details...
      </div>
    );
  }

  if (!event) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center text-gray-500">
        Event not found.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-rose-600 hover:underline text-sm flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            ></path>
          </svg>
          Back
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-64 md:h-80 object-cover"
          />
        )}

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{event.title} <span className="text-rose-600 font-bold">| Hackon</span></h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-start">
                <CalendarIcon className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Date</h3>
                  <p className="text-gray-700">
                    {formatDate(event.start_date)}
                    {event.end_date && event.start_date !== event.end_date && (
                      <>
                        <br />
                        <span>to {formatDate(event.end_date)}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {(event.start_time || event.end_time) && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Time</h3>
                    <p className="text-gray-700">
                      {event.start_time ? event.start_time : "TBD"}
                      {event.end_time && ` - ${event.end_time}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {event.event_type === "offline" ? (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Location</h3>
                    <p className="text-gray-700">{getFullAddress()}</p>

                    {event.location_link && (
                      <a
                        href={event.location_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:underline inline-flex items-center text-sm mt-1"
                      >
                        View on map
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <Video className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Virtual Event</h3>
                    <p className="text-gray-700">This event will be held online</p>

                    {event.meeting_link && (
                      <a
                        href={event.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-rose-600 hover:underline inline-flex items-center text-sm mt-1"
                      >
                        Join meeting
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">About this event</h2>
              <div className="prose text-gray-700 max-w-none">
                <p>{event.description}</p>
              </div>
            </div>
          )}

          {/* Registration Button */}
          <div className="mt-8 mb-8">
            {!user ? (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
                onClick={() => router.push(`/sign-in?returnUrl=${encodeURIComponent(`/User/events/${eventId}`)}`)}
              >
                Sign in to Register
              </button>
            ) : registered ? (
              <button
                className="bg-green-600 text-white py-3 px-6 rounded-lg font-medium cursor-not-allowed"
                disabled
              >
                Registered
              </button>
            ) : (
              <button
                className={`${
                  event?.is_paid ? "bg-green-600 hover:bg-green-700" : "bg-rose-600 hover:bg-rose-700"
                } text-white py-3 px-6 rounded-lg transition-colors font-medium ${
                  registering ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleRegister}
                disabled={registering}
              >
                {registering 
                  ? "Processing..." 
                  : event?.is_paid && event?.price
                    ? `Pay ₹${event.price} & Register`
                    : "Register for Event"
                }
              </button>
            )}
          </div>

          {/* Participants Table */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              Registered Participants
              <span className="ml-2 text-base text-gray-500 font-normal">
                ({participants.length})
              </span>
            </h2>
            {participants.length === 0 ? (
              <div className="text-gray-500">No participants registered yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Photo</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Name</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700 border-b">LinkedIn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participants.map((p) => (
                      <tr key={p.id} className="border-b last:border-b-0">
                        <td className="px-4 py-2">
                          {p.photo_url ? (
                            <img
                              src={p.photo_url}
                              alt={p.user_name || "Profile"}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 font-bold">
                              {p.user_name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-900">{p.user_name || "Unknown"}</td>
                        <td className="px-4 py-2 text-gray-700">{p.user_email}</td>
                        <td className="px-4 py-2">
                          {p.user_linkedin ? (
                            <a
                              href={p.user_linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              LinkedIn
                            </a>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
