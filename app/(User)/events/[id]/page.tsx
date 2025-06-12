"use client";

import { useEffect, useState, lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, Clock, MapPin, ExternalLink, Video, Users, Trophy, Medal } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

// Lazy load heavy components
const PastEventGallery = lazy(() => import("@/components/PastEventGallery"));
const EventRecruitingPartners = lazy(() => import("@/components/EventRecruitingPartners"));
const InlineRecruitingPartnersAdmin = lazy(() => import("@/components/InlineRecruitingPartnersAdmin"));

type Participant = {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  user_linkedin?: string | null;
  photo_url?: string | null;
  award_type?: 'winner' | 'runner_up' | null;
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
  show_start_button?: boolean;
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function EventDetailsPage() {
  const params = useParams();
  const eventParam = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [registered, setRegistered] = useState(false);
  const [attended, setAttended] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [winners, setWinners] = useState<Participant[]>([]);
  const [runnersUp, setRunnersUp] = useState<Participant[]>([]);  const [winnersLoading, setWinnersLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [recruitingPartnersKey, setRecruitingPartnersKey] = useState(0);
  const router = useRouter();const supabase = createClientComponentClient();

  // Check if event is in the past
  const isEventPast = event && event.start_date ? 
    new Date(event.start_date) < new Date() : false;

  // Function to determine if param is an ID (UUID) or title slug
  const isUUID = (str: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };  // Load event data and auth data
  useEffect(() => {
    if (!eventParam) return;

    async function loadEventAndAuth() {
      const startTime = performance.now();
      
      try {
        setLoading(true);
        
        // Use the same API endpoint for both ID and title-based lookups
        const apiEndpoint = `/api/events/${encodeURIComponent(eventParam as string)}`;
        
        // Start both event and auth checks simultaneously
        const [eventRes, authRes] = await Promise.all([
          fetch(apiEndpoint),
          fetch('/api/auth/check')
        ]);

        // Handle event data first (show immediately)
        let loadedEvent = null;
        if (eventRes.ok) {
          const eventData = await eventRes.json();
          loadedEvent = eventData.event;
          setEvent(loadedEvent);
        }
        
        const eventLoadTime = performance.now();
        console.log(`Event data loaded in ${Math.round(eventLoadTime - startTime)}ms`);
        
        setLoading(false); // Show event details immediately

        // Handle auth data
        const authData = await authRes.json();
        if (authData.authenticated) {
          setUser(authData.user);
          // Check if user is admin
          setIsAdmin(authData.user?.user_metadata?.role === 'admin' || authData.user?.email === 'admin@hackon.com');

          // Check registration status if event is loaded
          if (loadedEvent?.id) {
            try {
              const regRes = await fetch(`/api/registrations/check?event_id=${loadedEvent.id}`);
              if (regRes.ok) {
                const regData = await regRes.json();
                setRegistered(regData.registered);
                setAttended(regData.attended || false);
              }
            } catch (error) {
              console.error("Error checking registration:", error);
            }

            // Handle payment flow
            if (typeof window !== 'undefined') {
              const paymentIntent = window.sessionStorage.getItem('register_payment_intent');
              if (paymentIntent === loadedEvent.id) {
                window.sessionStorage.removeItem('register_payment_intent');
                // Process payment after a short delay
                setTimeout(() => {
                  if (loadedEvent.is_paid && loadedEvent.price && !registered) {
                    processPayment();
                  }
                }, 100);
              }
            }
          }
        }
        setCheckingAuth(false);
        
        const totalTime = performance.now();
        console.log(`Total page initialization: ${Math.round(totalTime - startTime)}ms`);

      } catch (error) {
        console.error("Error loading event and auth:", error);
        setLoading(false);
        setCheckingAuth(false);
      }
    }

    loadEventAndAuth();
  }, [eventParam]);

  // Load participants and winners after event is loaded
  useEffect(() => {
    if (!event?.id) return;

    const timeouts: NodeJS.Timeout[] = [];

    // Load participants in background
    setParticipantsLoading(true);
    const participantsTimeout = setTimeout(async () => {
      try {
        const partRes = await fetch(`/api/events/${event.id}/participants`);
        if (partRes.ok) {
          const partData = await partRes.json();
          setParticipants(partData.participants || []);
        }
      } catch (error) {
        console.error("Error loading participants:", error);
      } finally {
        setParticipantsLoading(false);
      }
    }, 100);
    timeouts.push(participantsTimeout);

    // Load winners and runners-up
    setWinnersLoading(true);
    const winnersTimeout = setTimeout(async () => {
      try {
        const winnersRes = await fetch(`/api/events/${event.id}/winners`);
        if (winnersRes.ok) {
          const winnersData = await winnersRes.json();
          setWinners(winnersData.winners || []);
          setRunnersUp(winnersData.runnersUp || []);
        }
      } catch (error) {
        console.error("Error loading winners:", error);
      } finally {
        setWinnersLoading(false);
      }
    }, 150);
    timeouts.push(winnersTimeout);

    // Cleanup function
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [event?.id]);

  async function handleRegister() {
    try {
      // Check current auth state from server
      const authRes = await fetch('/api/auth/check');
      const authData = await authRes.json();

      const safeEventId = event?.id || "";

      if (!authData.authenticated) {
        const returnUrl = `/events/${eventParam}`;
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
        body: JSON.stringify({ event_id: event?.id }),
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
          event_id: event.id,
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
          event_id: event.id,
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
          event_id: event?.id,
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

  const handleBackClick = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      router.push('/'); // Fallback to home if no history
    }
  };  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        {/* Back button skeleton */}
        <div className="mb-6">
          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Event details skeleton - optimized for faster perceived loading */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="w-full h-80 md:h-96 lg:h-[500px] bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse"></div>
          <div className="p-6 md:p-8">
            <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              </div>
              <div className="space-y-3">
                <div className="h-12 bg-gray-100 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>
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
          onClick={handleBackClick}
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
          <div className="relative w-full h-80 md:h-96 lg:h-[500px]">
            <Image
              src={event.image_url}
              alt={event.title}
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1200px"
            />
          </div>
        )}

        <div className="p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">{event.title} <span className="text-rose-600 font-bold">| Hackon</span></h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">              <div className="flex items-start">
                <CalendarIcon className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-gray-900">Date</h3>
                  <p className="text-gray-700">
                    {event.date_tba ? (
                      <span className="text-blue-600 font-medium">Date To Be Announced</span>
                    ) : (
                      <>
                        {formatDate(event.start_date)}
                        {event.end_date && event.start_date !== event.end_date && (
                          <>
                            <br />
                            <span>to {formatDate(event.end_date)}</span>
                          </>
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>{(event.start_time || event.end_time || event.time_tba) && (
                <div className="flex items-start">
                  <Clock className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Time</h3>
                    <p className="text-gray-700">
                      {event.time_tba ? (
                        <span className="text-blue-600 font-medium">To Be Announced</span>
                      ) : (
                        <>
                          {event.start_time ? event.start_time : "TBD"}
                          {event.end_time && ` - ${event.end_time}`}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>            <div className="space-y-4">
              {event.event_type === "offline" ? (
                <div className="flex items-start">
                  <MapPin className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">Location</h3>
                    {event.venue_tba ? (
                      <p className="text-blue-600 font-medium">Venue To Be Announced</p>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start">
                  <Video className="w-5 h-5 text-rose-600 mt-1 mr-3 flex-shrink-0" />
                  <div>                    <h3 className="font-medium text-gray-900">Virtual Event</h3>
                    <p className="text-gray-700">This event will be held online</p>

                    {event.meeting_link && !isEventPast && (
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
          </div>          {event.description && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-rose-600 mb-4">About This Event</h2>
              <div 
                className="prose prose-gray max-w-none text-gray-700 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2 [&_h1]:mt-6 [&_h1:first-child]:mt-0 [&_h1]:text-gray-800 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_h2]:mt-4 [&_h2:first-child]:mt-0 [&_h2]:text-gray-800 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3:first-child]:mt-0 [&_h3]:text-gray-800 [&_p]:mb-1 [&_p]:leading-normal [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-2 [&_ul]:space-y-0 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-2 [&_ol]:space-y-0 [&_li]:pl-1 [&_li]:leading-normal [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 [&_br]:block [&_br]:h-1"
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}          {/* Recruiting Partners Section */}
          <Suspense fallback={<div className="mb-8 h-32 bg-gray-100 rounded-lg animate-pulse"></div>}>
            {event && <EventRecruitingPartners key={recruitingPartnersKey} eventId={event.id} />}
          </Suspense>

          {/* Admin: Inline Recruiting Partners Management */}
          <Suspense fallback={isAdmin ? <div className="mb-8 h-24 bg-gray-100 rounded-lg animate-pulse"></div> : null}>
            {event && (
              <InlineRecruitingPartnersAdmin 
                eventId={event.id} 
                isAdmin={isAdmin}
                onPartnersUpdate={() => setRecruitingPartnersKey(prev => prev + 1)}
              />
            )}
          </Suspense>

          {/* Registration Button */}
          {!isEventPast && (
            <div className="mt-8 mb-8">
              {!user ? (
                <button
                  className="bg-rose-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors font-medium"
                  onClick={() => router.push(`/sign-in?returnUrl=${encodeURIComponent(`/events/${eventParam}`)}`)}
                >
                  Sign in to Register
                </button>              ) : registered ? (
                <div className="flex gap-3">
                  <button
                    className="bg-rose-600 text-white py-3 px-6 rounded-lg font-medium cursor-not-allowed"
                    disabled
                  >
                    Registered
                  </button>                  {attended && event?.show_start_button !== false && (
                    <Link
                      href={`/event-workflow/${event?.id}`}
                      className="bg-rose-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg transition-colors font-medium inline-flex items-center gap-2"
                    >
                      Enter Event
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ) : (
                <button
                  className={`${
                    event?.is_paid ? "bg-rose-600 hover:bg-green-700" : "bg-rose-600 hover:bg-rose-700"
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
          )}          {/* Past Event Gallery - Always show to all users, admin controls only for admins */}
          <Suspense fallback={<div className="mb-8 h-48 bg-gray-100 rounded-lg animate-pulse"></div>}>
            <PastEventGallery eventId={event?.id || ""} isAdmin={isAdmin} />
          </Suspense>

          {/* Winners and Runners-up Section - Moved before participants */}
          {(winners.length > 0 || runnersUp.length > 0) && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Event Winners
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Winners */}
                {winners.length > 0 && (
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                      <h3 className="text-lg font-semibold text-yellow-800">Winner</h3>
                    </div>
                    <div className="space-y-3">
                      {winners.map((winner) => (
                        <div key={winner.id} className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                          {winner.photo_url ? (
                            <Link
                              href={`/profile/${winner.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={winner.photo_url}
                                alt={winner.user_name || "Winner"}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover border-2 border-yellow-300"
                                loading="lazy"
                              />
                            </Link>
                          ) : (
                            <Link
                              href={`/profile/${winner.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-100 text-yellow-600 font-bold text-lg border-2 border-yellow-300">
                                {winner.user_name?.charAt(0).toUpperCase() || "W"}
                              </span>
                            </Link>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{winner.user_name || "Unknown Winner"}</p>
                            <p className="text-sm text-gray-600">{winner.user_email}</p>
                          </div>
                          {winner.user_linkedin && (
                            <a
                              href={winner.user_linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Runners-up */}
                {runnersUp.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg p-6 border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                      <Medal className="w-6 h-6 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-800">Runner-up</h3>
                    </div>
                    <div className="space-y-3">
                      {runnersUp.map((runnerUp) => (
                        <div key={runnerUp.id} className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                          {runnerUp.photo_url ? (
                            <Link
                              href={`/profile/${runnerUp.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={runnerUp.photo_url}
                                alt={runnerUp.user_name || "Runner-up"}
                                width={48}
                                height={48}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
                                loading="lazy"
                              />
                            </Link>
                          ) : (
                            <Link
                              href={`/profile/${runnerUp.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 text-gray-600 font-bold text-lg border-2 border-gray-300">
                                {runnerUp.user_name?.charAt(0).toUpperCase() || "R"}
                              </span>
                            </Link>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{runnerUp.user_name || "Unknown Runner-up"}</p>
                            <p className="text-sm text-gray-600">{runnerUp.user_email}</p>
                          </div>
                          {runnerUp.user_linkedin && (
                            <a
                              href={runnerUp.user_linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Participants Table - now shown after winners */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-rose-600" />
              Registered Participants
              <span className="ml-2 text-base text-gray-500 font-normal">
                {participantsLoading ? (
                  <span className="inline-flex items-center gap-1">
                    <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </span>
                ) : (
                  `(${participants.length})`
                )}
              </span>
            </h2>
            
            {participantsLoading ? (
              <div className="space-y-3">
                {/* Participant loading skeletons */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : participants.length === 0 ? (
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
                            <Link
                              href={`/profile/${p.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <Image
                                src={p.photo_url}
                                alt={p.user_name || "Profile"}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover border hover:border-rose-300"
                                loading="lazy"
                              />
                            </Link>
                          ) : (
                            <Link
                              href={`/profile/${p.user_id}`}
                              className="cursor-pointer hover:opacity-80 transition-opacity"
                            >
                              <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-400 font-bold hover:bg-gray-200">
                                {p.user_name?.charAt(0).toUpperCase() || "U"}
                              </span>
                            </Link>
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
