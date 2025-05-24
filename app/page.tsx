"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, MapPin, Clock } from "lucide-react";

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
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      // Sort events by created_at in descending order
      const sortedEvents = (data.events || []).sort((a: Event, b: Event) => {
        const dateA = new Date(a.created_at || "");
        const dateB = new Date(b.created_at || "");
        return dateB.getTime() - dateA.getTime();
      });
      setEvents(sortedEvents);
      setLoading(false);
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Events</h2>
        </div>
        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500 py-12">No events found.</div>
        ) : (
          <div className="w-full grid grid-cols-1 gap-8">
            {events.map((event) => (
              <div
                key={event.id}
                className="w-full bg-white rounded-3xl shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow duration-300 group flex flex-col md:flex-row overflow-hidden relative"
              >
                <div className="md:w-1/3 w-full h-64 md:h-auto relative flex-shrink-0 bg-gray-50 flex items-center justify-center">
                  {event.image_url ? (
                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = "/placeholder-event.png"; // Create this placeholder image
                        img.className = "w-4/5 h-4/5 object-contain opacity-50";
                      }}
                    />
                  ) : (
                    <span className="text-6xl font-bold text-gray-200">
                      {event.title.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-bold text-2xl text-gray-900 truncate flex items-center gap-2">
                        {event.title}
                      </h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 text-gray-500 text-base mb-3">
                      <span className="flex items-center gap-1"><CalendarIcon className="w-5 h-5" /> {event.start_date}{event.end_date && event.end_date !== event.start_date && (<span>- {event.end_date}</span>)}</span>
                      <span className="flex items-center gap-1"><Clock className="w-5 h-5" /> {event.start_time} - {event.end_time}</span>
                    </div>
                    <div className="text-gray-500 text-sm mb-4 truncate">
                      {event.event_type === "virtual" 
                        ? "Virtual Event" 
                        : event.location}
                    </div>
                    <div className="flex flex-wrap items-center gap-6 mt-2 mb-6">
                      <span className="text-2xl font-bold text-rose-600">
                        {event.is_paid ? `₹${event.price}` : 'Free'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <Link
                      href={`/User/events/${event.id}`}
                      className="bg-rose-600 text-white py-2 px-6 rounded-lg hover:bg-rose-700 transition-colors text-base font-medium shadow"
                    >
                      View Details
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
