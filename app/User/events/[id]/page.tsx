"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  image_url: string | null;
  description?: string;
  time?: string;
  created_at?: string;
};

export default function EventDetailsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvent() {
      if (!eventId) return;
      const res = await fetch(`/api/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
      }
      setLoading(false);
    }
    fetchEvent();
  }, [eventId]);

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
        <Link href="/" className="text-rose-600 hover:underline text-sm">
          &larr; Back to Events
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {event.image_url && (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-64 object-cover"
          />
        )}
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{event.title}</h1>
          <div className="flex flex-wrap gap-6 mb-4 text-gray-600">
            <div>
              <span className="font-semibold">Date:</span> {event.date}
            </div>
            {event.time && (
              <div>
                <span className="font-semibold">Time:</span> {event.time}
              </div>
            )}
            <div>
              <span className="font-semibold">Location:</span> {event.location}
            </div>
          </div>
          {event.description && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-1">Description</h2>
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          )}
          {event.created_at && (
            <div className="text-xs text-gray-400 mt-6">
              Created at: {new Date(event.created_at).toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
