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
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
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
          Welcome to EventHub
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400">No image available</span>
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-semibold text-lg mb-2 text-gray-800">
                    {event.title}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {/* Date information */}
                    <div className="flex items-center text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>
                        {formatDateRange(event.start_date ?? null, event.end_date ?? null)}
                      </span>
                    </div>

                    {/* Time information if available */}
                    {(event.start_time || event.end_time) && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>
                          {formatTimeRange(event.start_time ?? null, event.end_time ?? null)}
                        </span>
                      </div>
                    )}

                    {/* Location information */}
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{getLocationDisplay(event)}</span>
                    </div>
                  </div>

                  {/* Description preview if available */}
                  {event.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}

                  <Link
                    href={`/User/events/${event.id}`}
                    className="bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors inline-block text-sm font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
