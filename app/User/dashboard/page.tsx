"use client";

import { useState } from "react";
import Link from "next/link";

export default function UserDashboard() {
  // Placeholder data - would fetch from DB in production
  const [upcomingEvents, setUpcomingEvents] = useState([
    {
      id: "1",
      title: "Tech Conference 2023",
      date: "2023-12-15",
      location: "San Francisco, CA",
      imageUrl: "https://placehold.co/600x400/rose/white?text=Tech+Conference"
    },
    {
      id: "2",
      title: "Startup Networking",
      date: "2023-12-20",
      location: "New York, NY",
      imageUrl: "https://placehold.co/600x400/indigo/white?text=Startup+Networking"
    },
  ]);

  const [myTickets, setMyTickets] = useState([
    {
      id: "101",
      eventId: "1",
      eventName: "Tech Conference 2023",
      date: "2023-12-15",
      ticketType: "General Admission",
      ticketNumber: "TC2023-1234"
    }
  ]);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Welcome to EventHub</h1>
        <p className="text-gray-600">Discover and join amazing events</p>
      </header>

      <section className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">My Tickets</h2>
          <Link 
            href="/User/tickets" 
            className="text-rose-600 hover:underline"
          >
            View all tickets
          </Link>
        </div>
        
        {myTickets.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-600">You haven't registered for any events yet.</p>
            <Link 
              href="#upcoming-events" 
              className="mt-3 inline-block text-rose-600 hover:underline"
            >
              Browse upcoming events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myTickets.map(ticket => (
              <div key={ticket.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">{ticket.eventName}</h3>
                  <p className="text-sm text-gray-600">{ticket.date}</p>
                </div>
                <div className="p-4">
                  <div className="mb-3">
                    <span className="text-gray-600 text-sm">Ticket Type:</span>
                    <p>{ticket.ticketType}</p>
                  </div>
                  <div className="mb-3">
                    <span className="text-gray-600 text-sm">Ticket Number:</span>
                    <p className="font-mono">{ticket.ticketNumber}</p>
                  </div>
                  <div className="mt-4">
                    <Link 
                      href={`/User/tickets/${ticket.id}`}
                      className="bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors inline-block text-sm"
                    >
                      View Ticket
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section id="upcoming-events">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Upcoming Events</h2>
          <Link 
            href="/User/events" 
            className="text-rose-600 hover:underline"
          >
            View all events
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingEvents.map(event => (
            <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                <p className="text-gray-600 mb-2">{event.date}</p>
                <p className="text-gray-600 mb-4 text-sm">{event.location}</p>
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
      </section>

      <section className="mt-10">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upcoming Reminders</h2>
          <ul className="space-y-3">
            {myTickets.map(ticket => (
              <li key={ticket.id} className="flex justify-between p-3 bg-gray-50 rounded">
                <span>Don't forget: {ticket.eventName}</span>
                <span className="text-sm text-gray-600">Coming up on {ticket.date}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
