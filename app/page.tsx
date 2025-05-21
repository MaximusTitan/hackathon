"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  image_url: string | null;
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

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to EventHub
        </h1>
        <p className="text-gray-600 text-lg">
          Discover and join amazing events.
        </p>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">All Events</h2>
        </div>
        {loading ? (
          <div className="text-center text-gray-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-gray-500">No events found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                  <p className="text-gray-600 mb-2">{event.date}</p>
                  <p className="text-gray-600 mb-4 text-sm">
                    {event.location}
                  </p>
                  <Link
                    href={`/User/events/${event.id}`}
                    className="bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors inline-block"
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
