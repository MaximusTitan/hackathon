"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import { Facepile } from "@/components/ui/facepile";

type Participant = {
  id: string;
  user_name: string | null;
  photo_url?: string | null;
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
  is_paid: boolean;
  price: number;
  is_public: boolean;
  participant_count?: number;
  participants?: Participant[];
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events?with_participant_count=1");
        let data: any = {};
        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }

        // Filter out past events and sort by created_at
        const currentDate = new Date();
        const upcomingEvents = (data.events || [])
          .filter((event: Event) => {
            const eventDate = new Date(event.start_date || "");
            return eventDate >= currentDate;
          })
          .sort((a: Event, b: Event) => {
            const dateA = new Date(a.created_at || "");
            const dateB = new Date(b.created_at || "");
            return dateB.getTime() - dateA.getTime();
          });

        // Fetch participants for each event
        interface ParticipantResponse {
          participants: Participant[];
        }

        const eventsWithParticipants: Event[] = await Promise.all(
          upcomingEvents.map(async (event: Event) => {
            try {
              const partRes: Response = await fetch(
          `/api/events/${event.id}/participants`
              );
              if (partRes.ok) {
          const partData: ParticipantResponse = await partRes.json();
          return {
            ...event,
            participants: partData.participants || [],
          };
              }
            } catch (error: unknown) {
              console.error(
          `Error fetching participants for event ${event.id}:`,
          error
              );
            }
            return { ...event, participants: [] };
          })
        );

        setEvents(eventsWithParticipants);
      } catch (error) {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  // Format the date display for consistency
  const formatDateRange = (
    start_date: string | null,
    end_date: string | null
  ) => {
    if (!start_date) return "Date TBD";

    // Format the start date
    const startDate = new Date(start_date);
    const startFormatted = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    // If no end date or end date is same as start date, just return start date
    if (!end_date || start_date === end_date) return startFormatted;

    // Format end date
    const endDate = new Date(end_date);
    const endFormatted = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return `${startFormatted} - ${endFormatted}`;
  };

  // Format time display
  const formatTimeRange = (start_time: string | null, end_time: string | null) => {
    if (!start_time) return "";
    return end_time ? `${start_time} - ${end_time}` : start_time;
  };

  // Handle location display based on event type
  const getLocationDisplay = (event: Event) => {
    if (event.event_type === "virtual") {
      return "Virtual Event";
    } else if (event.location) {
      return event.location;
    } else if (event.venue_name) {
      const cityPart = event.city ? `, ${event.city}` : "";
      return `${event.venue_name}${cityPart}`;
    }
    return "Location TBD";
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to Hackon
        </h1>
        <p className="text-gray-600 text-lg">Discover and join amazing events.</p>
      </header>

      <section>
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No events found.</div>
        ) : (
          <div className="w-full grid grid-cols-1 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="w-full bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row overflow-hidden relative hover:scale-[1.02] h-80 md:h-72"
              >
                <div className="md:w-2/5 w-full h-72 md:h-full relative flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = "/placeholder-event.png";
                        img.className = "w-4/5 h-4/5 object-contain opacity-50";
                      }}
                    />
                  ) : (
                    <span className="text-8xl font-bold text-gray-200/60 select-none transform -rotate-12 scale-150">
                      {event.title.charAt(0)}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                <div className="flex-1 p-8 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50/50 min-h-0">
                  <div className="flex-1 overflow-hidden">
                    <div className="space-y-3">
                      <h3 className="font-bold text-2xl text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-gray-600">
                        <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <CalendarIcon className="w-4 h-4 text-rose-500" />
                          <span className="text-sm">
                            {event.start_date}
                            {event.end_date && event.end_date !== event.start_date && (
                              <span> - {event.end_date}</span>
                            )}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <Clock className="w-4 h-4 text-rose-500" />
                          <span className="text-sm">
                            {event.start_time} - {event.end_time}
                          </span>
                        </span>
                      </div>

                      {/* Location on separate line */}
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <MapPin className="w-4 h-4 text-rose-500" />
                          <span className="text-sm">
                            {event.event_type === "virtual" ? "Virtual Event" : event.location}
                          </span>
                        </span>
                      </div>

                      <div className="pt-1">
                        <span className={`text-lg font-semibold ${
                          event.is_paid 
                            ? "text-green-600" 
                            : "text-blue-600"
                        }`}>
                          {event.is_paid ? `₹${event.price}` : 'Free Entry'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-end">
                    {/* Add Facepile in bottom left */}
                    <div className="flex-1">
                      <Facepile
                        participants={event.participants || []}
                        maxVisible={4}
                        size="sm"
                        showCount={true}
                      />
                    </div>
                    <Link
                      href={`/User/events/${event.id}`}
                      className="inline-flex items-center gap-2 bg-rose-600 text-white py-2.5 px-6 rounded-lg hover:bg-rose-700 transition-colors text-base font-medium shadow-lg shadow-rose-100 hover:shadow-rose-200"
                    >
                      View Details
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
