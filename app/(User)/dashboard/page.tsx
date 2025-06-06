"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Registration = {
  id: string;
  registered_at: string;
  events: {
    id: string;
    title: string;
    start_date: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    event_type: "virtual" | "offline";
    location?: string;
    venue_name?: string;
    image_url?: string;
  };
};

export default function UserDashboard() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const res = await fetch('/api/user/registrations');
        const data = await res.json();
        if (res.ok) {
          setRegistrations(data.registrations);
        }
      } catch (error) {
        console.error('Error fetching registrations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, []);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      {/* <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Dashboard</h1>
        <p className="text-gray-600">View your registered events</p>
      </header> */}

      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Registered Events</h2>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Loading your registrations...</p>
          </div>
        ) : registrations.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">You haven't registered for any events yet.</p>
            <Link 
              href="/" 
              className="mt-3 inline-block text-rose-600 hover:underline"
            >
              Browse upcoming events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map(reg => (
              <div key={reg.id} className="bg-white rounded-lg shadow overflow-hidden">
                {reg.events.image_url && (
                  <Image
                    src={reg.events.image_url}
                    alt={reg.events.title}
                    width={400}
                    height={192}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2">{reg.events.title}</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <p>Event Date: {formatDate(reg.events.start_date)}</p>
                    {reg.events.start_time && (
                      <p>Time: {reg.events.start_time} - {reg.events.end_time}</p>
                    )}
                    <p>Location: {reg.events.venue_name || reg.events.location}</p>
                    <p className="text-xs">Registered on: {formatDate(reg.registered_at)}</p>
                  </div>
                  <div className="mt-4">
                    <Link
                      href={`/User/events/${reg.events.id}`}
                      className="bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors inline-block text-sm"
                    >
                      View Event Details
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
