"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch"; // Add this import
import { toast } from "sonner";

type Event = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: "virtual" | "offline";
  meeting_link?: string | null;
  location?: string | null;
  image_url: string | null;
  is_public: boolean;
  is_paid: boolean;
  price: number;
  razorpay_key_id?: string;
};

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    event_type: "offline",
    meeting_link: "",
    location: "",
    location_link: "", // Add this new field
    venue_name: "", // Add this new field
    address_line1: "", // Add this new field
    city: "", // Add this new field
    postal_code: "", // Add this new field
    image_url: "",
    is_public: true,
    is_paid: false,
    price: 0,
    razorpay_key_id: "",
  });
  const [creating, setCreating] = useState(false);
  const [startDateObj, setStartDateObj] = useState<Date | undefined>(undefined);
  const [endDateObj, setEndDateObj] = useState<Date | undefined>(undefined);
  const [showCreate, setShowCreate] = useState(false);

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
    
    // Include payment fields in the API call
    const eventData = {
      ...form,
      start_date: startDateObj ? startDateObj.toISOString().slice(0, 10) : "",
      end_date: endDateObj ? endDateObj.toISOString().slice(0, 10) : "",
      price: form.is_paid ? form.price : 0,
      razorpay_key_id: form.is_paid ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "" : null, // Use env var, not user input
    };

    await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventData),
    });
    setForm({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      start_time: "",
      end_time: "",
      event_type: "offline",
      meeting_link: "",
      location: "",
      location_link: "", // Reset this new field
      venue_name: "", // Reset this new field
      address_line1: "", // Reset this new field
      city: "", // Reset this new field
      postal_code: "", // Reset this new field
      image_url: "",
      is_public: true,
      is_paid: false,
      price: 0,
      razorpay_key_id: "",
    });
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setCreating(false);
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your events and community</p>
        </div>
        <Button
          className="bg-rose-600 hover:bg-rose-700 text-white"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Hide Create Event" : "Create New Event"}
        </Button>
      </header>

      {showCreate && (
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-800">Create New Event</CardTitle>
            <CardDescription className="text-gray-600">
              Fill out the form to create a new event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateEvent} className="space-y-6">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="title" className="text-gray-700">
                    Event Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="Enter event title"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="grid gap-2">
                    <Label className="text-gray-700">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-gray-200 text-gray-800",
                            !startDateObj && "text-gray-500"
                          )}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {startDateObj
                            ? format(startDateObj, "PPP")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={startDateObj}
                          onSelect={(d) => {
                            setStartDateObj(d);
                            setForm((f) => ({
                              ...f,
                              start_date: d ? d.toISOString().slice(0, 10) : "",
                            }));
                          }}
                          initialFocus
                          className="bg-white text-gray-900"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {/* End Date */}
                  <div className="grid gap-2">
                    <Label className="text-gray-700">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white border-gray-200 text-gray-800",
                            !endDateObj && "text-gray-500"
                          )}
                          type="button"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500" />
                          {endDateObj
                            ? format(endDateObj, "PPP")
                            : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-white" align="start">
                        <Calendar
                          mode="single"
                          selected={endDateObj}
                          onSelect={(d) => {
                            setEndDateObj(d);
                            setForm((f) => ({
                              ...f,
                              end_date: d ? d.toISOString().slice(0, 10) : "",
                            }));
                          }}
                          initialFocus
                          className="bg-white text-gray-900"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Start Time */}
                  <div className="grid gap-2">
                    <Label htmlFor="start_time" className="text-gray-700">
                      Start Time
                    </Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      <Input
                        id="start_time"
                        type="time"
                        value={form.start_time}
                        onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                        required
                        className="border-gray-200 text-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  {/* End Time */}
                  <div className="grid gap-2">
                    <Label htmlFor="end_time" className="text-gray-700">
                      End Time
                    </Label>
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4 text-gray-500" />
                      <Input
                        id="end_time"
                        type="time"
                        value={form.end_time}
                        onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                        required
                        className="border-gray-200 text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Event Type */}
                <div className="grid gap-2">
                  <Label htmlFor="event_type" className="text-gray-700">
                    Event Type
                  </Label>
                  <Select
                    value={form.event_type}
                    onValueChange={(value) => setForm(f => ({ ...f, event_type: value as "virtual" | "offline" }))}
                  >
                    <SelectTrigger className="bg-white border-gray-200 text-gray-900">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-gray-900">
                      <SelectItem value="offline">Offline</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional fields */}
                {form.event_type === "virtual" ? (
                  <div className="grid gap-2">
                    <Label htmlFor="meeting_link" className="text-gray-700">
                      Meeting Link
                    </Label>
                    <Input
                      id="meeting_link"
                      placeholder="Enter meeting URL"
                      value={form.meeting_link}
                      onChange={(e) => setForm(f => ({ ...f, meeting_link: e.target.value }))}
                      required
                      className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="venue_name" className="text-gray-700">
                        Venue Name
                      </Label>
                      <Input
                        id="venue_name"
                        placeholder="Enter venue name"
                        value={form.venue_name}
                        onChange={(e) => setForm(f => ({ ...f, venue_name: e.target.value }))}
                        required
                        className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="address_line1" className="text-gray-700">
                        Address
                      </Label>
                      <Input
                        id="address_line1"
                        placeholder="Enter street address"
                        value={form.address_line1}
                        onChange={(e) => setForm(f => ({ ...f, address_line1: e.target.value }))}
                        required
                        className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="city" className="text-gray-700">
                          City
                        </Label>
                        <Input
                          id="city"
                          placeholder="Enter city"
                          value={form.city}
                          onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                          required
                          className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="postal_code" className="text-gray-700">
                          Postal Code
                        </Label>
                        <Input
                          id="postal_code"
                          placeholder="Enter postal code"
                          value={form.postal_code}
                          onChange={(e) => setForm(f => ({ ...f, postal_code: e.target.value }))}
                          className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                        />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="location" className="text-gray-700">
                        Location Display Text
                      </Label>
                      <Input
                        id="location"
                        placeholder="How location should display to users"
                        value={form.location}
                        onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                        required
                        className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="location_link" className="text-gray-700">
                        Location Link (Google Maps URL)
                      </Label>
                      <Input
                        id="location_link"
                        placeholder="Enter Google Maps or location URL"
                        value={form.location_link}
                        onChange={(e) => setForm(f => ({ ...f, location_link: e.target.value }))}
                        className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Description Field */}
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-gray-700">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Enter event description"
                    value={form.description || ""}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={4}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>

                {/* Image URL */}
                <div className="grid gap-2">
                  <Label htmlFor="image_url" className="text-gray-700">
                    Image URL
                  </Label>
                  <Input
                    id="image_url"
                    placeholder="Enter image URL"
                    value={form.image_url}
                    onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))}
                    className="border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                  />
                </div>

                {/* Add Public/Private Toggle */}
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="is-public" className="text-gray-700">
                    Event Visibility
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is-public"
                      checked={form.is_public}
                      onCheckedChange={(checked) => 
                        setForm(f => ({ ...f, is_public: checked }))
                      }
                    />
                    <span className="text-sm text-gray-600">
                      {form.is_public ? "Public" : "Private"}
                    </span>
                  </div>
                </div>

                {/* Payment Settings Section */}
                <div className="space-y-4 border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Payment Settings
                  </h3>
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="is-paid" className="text-gray-700">
                      Event Type
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-paid"
                        checked={form.is_paid}
                        onCheckedChange={(checked) => 
                          setForm(f => ({ ...f, is_paid: checked }))
                        }
                      />
                      <span className="text-sm text-gray-600">
                        {form.is_paid ? "Paid Event" : "Free Event"}
                      </span>
                    </div>
                  </div>
                  {form.is_paid && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="price" className="text-gray-700">
                          Registration Fee (₹)
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                          <Input
                            id="price"
                            type="number"
                            min="1"
                            value={form.price}
                            onChange={(e) => setForm(f => ({ 
                              ...f, 
                              price: parseInt(e.target.value) || 0 
                            }))}
                            className="pl-8 border-gray-200 text-gray-900 placeholder:text-gray-500 bg-white"
                            placeholder="Enter amount"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {form.is_paid 
                      ? "Users will need to pay the registration fee to attend this event"
                      : "This event is free for all users to attend"}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={creating}
                className="bg-rose-600 hover:bg-rose-700 text-white w-full"
              >
                {creating ? "Creating..." : "Create Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

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
                <p className="text-gray-600 mb-2">
                  {event.start_date}
                  {event.end_date && event.end_date !== event.start_date
                    ? ` - ${event.end_date}`
                    : ""}
                </p>
                <p className="text-gray-600 mb-2">
                  {event.start_time} - {event.end_time}
                </p>
                <p className="text-gray-600 mb-4 text-sm">
                  {event.event_type === "virtual"
                    ? event.meeting_link
                    : event.location}
                </p>
                <div className="text-xs text-gray-500 mb-2">
                  {event.is_public ? (
                    "Public Event"
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="inline-block px-2 py-1 rounded bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                        Private Event
                      </span>
                      <button
                        type="button"
                        title="Copy event link"
                        onClick={() => {
                          if (typeof window !== "undefined") {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/User/events/${event.id}`
                            );
                            toast.success("Event link copied!");
                          }
                        }}
                        className="ml-2 px-2 py-1 rounded bg-gray-100 border border-gray-300 text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                      >
                        Copy Link
                      </button>
                    </div>
                  )}
                </div>

                {/* Add visibility toggle */}
                <div className="flex items-center justify-between mt-3 mb-2">
                  <span className="text-sm text-gray-600">Visibility:</span>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={event.is_public}
                      onCheckedChange={async (checked) => {
                        const res = await fetch(`/api/events/${event.id}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ is_public: checked })
                        });
                        if (res.ok) {
                          // Refresh events list
                          window.location.reload();
                        }
                      }}
                    />
                    <span className="text-sm text-gray-600">
                      {event.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                </div>

                {/* Add price display */}
                <div className="mb-2">
                  {event.is_paid ? (
                    <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 font-semibold border border-green-200 text-sm">
                      ₹{event.price}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200 text-sm">
                      Free
                    </span>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Link
                    href={`/User/events/${event.id}`}
                    className="bg-rose-600 text-white py-2 px-4 rounded-lg hover:bg-rose-700 transition-colors inline-block"
                  >
                    View Details
                  </Link>
                  
                  <Link
                    href={`/admin/event-registrations/${event.id}`}
                    className="bg-gray-100 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors inline-block"
                  >
                    View Registrations
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
