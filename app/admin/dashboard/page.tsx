"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Event = {
  id: string;
  title: string;
  date: string;
  location: string;
  image_url: string | null;
};

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    date: "",
    location: "",
    image_url: "",
  });
  const [creating, setCreating] = useState(false);
  const [dateObj, setDateObj] = useState<Date | undefined>(
    form.date ? new Date(form.date) : undefined
  );

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
      setLoading(false);
    }
    fetchEvents();
  }, [creating]);

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        date: dateObj ? dateObj.toISOString().slice(0, 10) : "",
      }),
    });
    setForm({ title: "", date: "", location: "", image_url: "" });
    setDateObj(undefined);
    setCreating(false);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your events and community</p>
        </div>
      </header>

      <form onSubmit={handleCreateEvent} className="bg-white rounded-lg shadow p-6 mb-8 flex flex-col gap-4 max-w-xl">
        <h2 className="text-lg font-semibold mb-2">Create New Event</h2>
        <input
          className="border-2 border-gray-200 rounded-lg p-3 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all bg-white text-gray-900 placeholder:text-gray-500"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          required
        />
        {/* Shadcn DatePicker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal border-2 border-gray-200 rounded-lg p-3 bg-white text-gray-900 placeholder:text-gray-500 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all",
                !dateObj && "text-muted-foreground"
              )}
              type="button"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateObj ? format(dateObj, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateObj}
              onSelect={d => {
                setDateObj(d);
                setForm(f => ({
                  ...f,
                  date: d ? d.toISOString().slice(0, 10) : "",
                }));
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <input
          className="border-2 border-gray-200 rounded-lg p-3 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all bg-white text-gray-900 placeholder:text-gray-500"
          placeholder="Location"
          value={form.location}
          onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
        />
        <input
          className="border-2 border-gray-200 rounded-lg p-3 focus:border-rose-500 focus:ring focus:ring-rose-200 transition-all bg-white text-gray-900 placeholder:text-gray-500"
          placeholder="Image URL"
          value={form.image_url}
          onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
        />
        <button
          type="submit"
          className="bg-rose-600 text-white py-2 px-4 rounded hover:bg-rose-700"
          disabled={creating}
        >
          {creating ? "Creating..." : "Create Event"}
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">All Events</h2>
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
    </div>
  );
}
