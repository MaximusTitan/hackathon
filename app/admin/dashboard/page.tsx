"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarIcon, Clock, MapPin, Clipboard } from "lucide-react";
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
import { v4 as uuidv4 } from "uuid";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Pencil, Trash2 } from "lucide-react"; // Add this import
import { TiptapEditor } from "@/components/ui/tiptap-editor";

type Event = {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  event_type: "virtual" | "offline";
  meeting_link?: string | null;
  location?: string | null;
  location_link?: string | null;
  venue_name?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  image_url: string | null;
  is_public: boolean;
  is_paid: boolean;
  price: number;
  razorpay_key_id?: string;
  created_at: string;
};

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);
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
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [participantData, setParticipantData] = useState<Record<string, { count: number; loading: boolean }>>({});
  const supabase = createClientComponentClient();

  useEffect(() => {
    async function fetchEventsOptimized() {
      try {
        setLoading(true);
        
        // Fetch events first and show them immediately
        const res = await fetch("/api/events");
        const data = await res.json();
        
        const currentDate = new Date();
        const allEvents = data.events || [];
        
        // Split events into upcoming and past
        const { upcoming, past } = allEvents.reduce((acc: { upcoming: Event[], past: Event[] }, event: Event) => {
          const eventDate = new Date(event.start_date || "");
          if (eventDate >= currentDate) {
            acc.upcoming.push(event);
          } else {
            acc.past.push(event);
          }
          return acc;
        }, { upcoming: [], past: [] });

        // Sort both arrays by created_at
        const sortByDate = (a: Event, b: Event) => {
          const dateA = new Date(a.created_at || "");
          const dateB = new Date(b.created_at || "");
          return dateB.getTime() - dateA.getTime();
        };

        const filteredEvents = showPastEvents ? past.sort(sortByDate) : upcoming.sort(sortByDate);
        
        // Show events immediately
        setEvents(filteredEvents);
        setLoading(false);

        // If no events, stop here
        if (filteredEvents.length === 0) {
          return;
        }

        // Initialize participant data with loading states
        const initialData: Record<string, { count: number; loading: boolean }> = {};
        filteredEvents.forEach((event: Event) => {
          initialData[event.id] = {
            count: 0,
            loading: true
          };
        });
        setParticipantData(initialData);

        // Load participant counts progressively (prioritize first 3 events)
        const priorityEvents = filteredEvents.slice(0, 3);
        const remainingEvents = filteredEvents.slice(3);

        // Load priority events first (no delay)
        priorityEvents.forEach(async (event: Event, index: number) => {
          try {
            // Small stagger for priority events
            if (index > 0) {
              await new Promise(resolve => setTimeout(resolve, index * 50));
            }
            
            const res = await fetch(`/api/events/${event.id}/participants/preview`);
            if (res.ok) {
              const data = await res.json();
              setParticipantData(prev => ({
                ...prev,
                [event.id]: {
                  count: data.count || 0,
                  loading: false
                }
              }));
            } else {
              setParticipantData(prev => ({
                ...prev,
                [event.id]: {
                  count: 0,
                  loading: false
                }
              }));
            }
          } catch (error) {
            console.error(`Error fetching participant count for priority event ${event.id}:`, error);
            setParticipantData(prev => ({
              ...prev,
              [event.id]: {
                count: 0,
                loading: false
              }
            }));
          }
        });

        // Load remaining events with slight delay
        remainingEvents.forEach(async (event: Event, index: number) => {
          try {
            // Delay for remaining events to not interfere with priority loading
            await new Promise(resolve => setTimeout(resolve, 300 + (index * 100)));
            
            const res = await fetch(`/api/events/${event.id}/participants/preview`);
            if (res.ok) {
              const data = await res.json();
              setParticipantData(prev => ({
                ...prev,
                [event.id]: {
                  count: data.count || 0,
                  loading: false
                }
              }));
            } else {
              setParticipantData(prev => ({
                ...prev,
                [event.id]: {
                  count: 0,
                  loading: false
                }
              }));
            }
          } catch (error) {
            console.error(`Error fetching participant count for event ${event.id}:`, error);
            setParticipantData(prev => ({
              ...prev,
              [event.id]: {
                count: 0,
                loading: false
              }
            }));
          }
        });

      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
        setLoading(false);
      }
    }
    
    fetchEventsOptimized();
  }, [showPastEvents]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // Clear the image URL when file is selected
      setForm(f => ({ ...f, image_url: "" }));
    }
  }, []);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setForm(f => ({ ...f, image_url: url }));
    // Clear the file upload when URL is entered
    if (url) {
      setImageFile(null);
      setImagePreview(null);
      // Clear the file input
      const fileInput = document.getElementById('image') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    
    try {
      let imageUrl = form.image_url;
      
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      const eventData = {
        ...form,
        image_url: imageUrl,
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
      
      // Reset form and state
      resetForm();
      setShowCreate(false);
      await fetchEvents(); // Refresh events list
      toast.success("Event created successfully");

    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    } finally {
      setCreating(false);
      setUploading(false);
    }
  }

  const fetchEvents = async () => {
    const res = await fetch("/api/events");
    const data = await res.json();
    
    const currentDate = new Date();
    const allEvents = data.events || [];
    
    // Split events into upcoming and past
    const { upcoming, past } = allEvents.reduce((acc: { upcoming: Event[], past: Event[] }, event: Event) => {
      const eventDate = new Date(event.start_date || "");
      if (eventDate >= currentDate) {
        acc.upcoming.push(event);
      } else {
        acc.past.push(event);
      }
      return acc;
    }, { upcoming: [], past: [] });

    // Sort both arrays by created_at
    const sortByDate = (a: Event, b: Event) => {
      const dateA = new Date(a.created_at || "");
      const dateB = new Date(b.created_at || "");
      return dateB.getTime() - dateA.getTime();
    };

    const filteredEvents = showPastEvents ? past.sort(sortByDate) : upcoming.sort(sortByDate);
    setEvents(filteredEvents);
    setLoading(false);

    // Load participant counts for new events
    if (filteredEvents.length > 0) {
      const initialData: Record<string, { count: number; loading: boolean }> = {};
      filteredEvents.forEach((event: Event) => {
        initialData[event.id] = {
          count: 0,
          loading: true
        };
      });
      setParticipantData(initialData);

      // Load all participant counts
      filteredEvents.forEach(async (event: Event, index: number) => {
        try {
          await new Promise<void>(resolve => setTimeout(resolve, index * 50));
          
          const res = await fetch(`/api/events/${event.id}/participants/preview`);
          if (res.ok) {
            const data = await res.json();
            setParticipantData(prev => ({
              ...prev,
              [event.id]: {
                count: data.count || 0,
                loading: false
              }
            }));
          } else {
            setParticipantData(prev => ({
              ...prev,
              [event.id]: {
                count: 0,
                loading: false
              }
            }));
          }
        } catch (error) {
          setParticipantData(prev => ({
            ...prev,
            [event.id]: {
              count: 0,
              loading: false
            }
          }));
        }
      });
    }
  };

  async function handleEditEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!editingEvent) return;

    try {
      let imageUrl = form.image_url;
      
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      const eventData = {
        ...form,
        image_url: imageUrl,
        start_date: startDateObj ? startDateObj.toISOString().slice(0, 10) : "",
        end_date: endDateObj ? endDateObj.toISOString().slice(0, 10) : "",
        price: form.is_paid ? form.price : 0,
      };

      const res = await fetch(`/api/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });

      if (res.ok) {
        toast.success("Event updated successfully");
        resetForm();
        setIsEditing(false);
        setEditingEvent(null);
        setShowCreate(false);
        await fetchEvents(); // Refresh events list
      } else {
        toast.error("Failed to update event");
      }
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  }

  // Function to populate form with event data for editing
  const startEditing = (event: Event) => {
    // Scroll to top of the page
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setForm({
      title: event.title,
      description: event.description || "",
      start_date: event.start_date || "",
      end_date: event.end_date || "",
      start_time: event.start_time || "",
      end_time: event.end_time || "",
      event_type: event.event_type || "offline",
      meeting_link: event.meeting_link || "",
      location: event.location || "",
      // Add these missing location fields
      location_link: event.location_link || "",
      venue_name: event.venue_name || "",
      address_line1: event.address_line1 || "",
      city: event.city || "",
      postal_code: event.postal_code || "",
      image_url: event.image_url || "",
      is_public: event.is_public,
      is_paid: event.is_paid,
      price: event.price,
      razorpay_key_id: event.razorpay_key_id || "",
    });
    setStartDateObj(event.start_date ? new Date(event.start_date) : undefined);
    setEndDateObj(event.end_date ? new Date(event.end_date) : undefined);
    setEditingEvent(event);
    setIsEditing(true);
    setShowCreate(true); // Make sure the form is visible
  };

  // Add this new function to reset the form
  const resetForm = () => {
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
      location_link: "",
      venue_name: "",
      address_line1: "",
      city: "",
      postal_code: "",
      image_url: "",
      is_public: true,
      is_paid: false,
      price: 0,
      razorpay_key_id: "",
    });
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setImageFile(null);
    setImagePreview(null);
  };

  // Admin Event Card Skeleton component
  const AdminEventCardSkeleton = () => (
    <div className="w-full bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row overflow-hidden h-96 md:h-80 animate-pulse">
      {/* Action buttons skeleton */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <div className="w-9 h-9 bg-gray-200 rounded"></div>
        <div className="w-9 h-9 bg-gray-200 rounded"></div>
      </div>

      <div className="md:w-2/5 w-full h-80 md:h-full relative flex-shrink-0 bg-gray-200">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>
      
      <div className="flex-1 p-8 flex flex-col justify-between bg-white min-h-0">
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3">
            {/* Title and badges skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-8 bg-gray-200 rounded-lg w-2/3"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
            
            {/* Price skeleton */}
            <div className="h-6 bg-gray-200 rounded w-20"></div>
            
            {/* Date and time badges skeleton */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-32"></div>
              <div className="h-8 bg-gray-200 rounded-full w-28"></div>
            </div>

            {/* Location skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-40"></div>
            </div>

            {/* Toggle skeleton */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          {/* Button skeletons */}
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
          <div className="h-12 bg-gray-200 rounded-lg w-28"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your events and community</p>
        </div>
      </header>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {showPastEvents ? "Past Events" : "Upcoming Events"}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowPastEvents(!showPastEvents)}
            className={`${
              showPastEvents 
                ? "bg-gray-600 hover:bg-gray-700" 
                : "bg-rose-600 hover:bg-rose-700"
            } text-white`}
          >
            Show {showPastEvents ? "Upcoming" : "Past"} Events
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => setShowCreate((v) => !v)}
          >
            {showCreate ? "Hide Create Event" : "Create New Event"}
          </Button>
        </div>
      </div>

      {(showCreate || isEditing) && (
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-800">
              {isEditing ? "Edit Event" : "Create New Event"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {isEditing ? "Update event details" : "Fill out the form to create a new event"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isEditing ? handleEditEvent : handleCreateEvent} className="space-y-6">
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
                  <TiptapEditor
                    content={form.description || ""}
                    onChange={(content) => setForm(f => ({ ...f, description: content }))}
                    placeholder="Enter event description..."
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image" className="text-gray-700">
                      Event Image
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="border-gray-200"
                        disabled={!!form.image_url}
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-w-md rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="image_url" className="text-gray-700">
                      Or Image URL
                    </Label>
                    <Input
                      id="image_url"
                      placeholder="Enter image URL"
                      value={form.image_url}
                      onChange={handleImageUrlChange}
                      className="border-gray-200"
                      disabled={!!imageFile}
                    />
                  </div>
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

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={creating || uploading}
                  className="bg-rose-600 hover:bg-rose-700 text-white flex-1"
                >
                  {creating ? "Saving..." : isEditing ? "Update Event" : "Create Event"}
                </Button>
                {isEditing && (
                  <Button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setEditingEvent(null);
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
                        location_link: "",
                        venue_name: "",
                        address_line1: "",
                        city: "",
                        postal_code: "",
                        image_url: "",
                        is_public: true,
                        is_paid: false,
                        price: 0,
                        razorpay_key_id: "",
                      });
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading events...</span>
            </div>
            <p className="text-gray-400 mt-2">Fetching event data from dashboard</p>
          </div>
          
          <div className="w-full grid grid-cols-1 gap-8">
            {/* Show 3 skeleton cards */}
            {[1, 2, 3].map((i) => (
              <AdminEventCardSkeleton key={i} />
            ))}
          </div>
          
          {/* Additional loading indicators */}
          <div className="flex justify-center items-center gap-2 py-4">
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <CalendarIcon className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No {showPastEvents ? "past" : "upcoming"} events found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {showPastEvents 
              ? "No past events to display. Create some events to see them here later."
              : "Start by creating your first event to manage and organize community gatherings."
            }
          </p>
          {!showPastEvents && (
            <Button
              className="mt-4 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={() => setShowCreate(true)}
            >
              Create Your First Event
            </Button>
          )}
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 gap-8">
          {events.map((event, index) => {
            const eventParticipantData = participantData[event.id];
            const isParticipantLoading = eventParticipantData?.loading !== false;
            
            return (
              <div 
                key={event.id} 
                className={`w-full bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row overflow-hidden relative hover:scale-[1.02] h-96 md:h-80 ${
                  // Add staggered animation for visual appeal
                  index < 3 ? 'animate-in slide-in-from-bottom-4' : ''
                }`}
                style={{
                  // Stagger animation delay for first 3 cards
                  animationDelay: index < 3 ? `${index * 100}ms` : '0ms'
                }}
              >
                {/* Admin Actions */}
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <Button
                    onClick={() => startEditing(event)}
                    className="w-9 h-9 p-0 text-gray-500 hover:text-blue-600"
                    title="Edit event"
                    variant="ghost"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete the event '${event.title}'? This action cannot be undone.`)) {
                        const res = await fetch(`/api/events/${event.id}`, {
                          method: 'DELETE',
                        });
                        if (res.ok) {
                          toast.success('Event deleted successfully');
                          setEvents(events.filter(e => e.id !== event.id));
                        } else {
                          toast.error('Failed to delete event');
                        }
                      }
                    }}
                    className="w-9 h-9 p-0 text-gray-500 hover:text-red-600"
                    title="Delete event"
                    variant="ghost"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="md:w-2/5 w-full h-80 md:h-full relative flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
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
                      // Lazy loading for images after the first 3
                      loading={index < 3 ? "eager" : "lazy"}
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
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="font-bold text-2xl text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
                        {event.title}
                      </h3>
                      {event.is_public ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                          Public
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Private
                        </span>
                      )}
                    </div>
                    
                    {/* Price Display */}
                    <div className="mb-3">
                      <span className={`text-lg font-semibold ${
                        event.is_paid 
                          ? "text-green-600" 
                          : "text-blue-600"
                      }`}>
                        {event.is_paid ? `₹${event.price}` : 'Free Entry'}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-3">
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
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span className="text-sm">
                        {event.event_type === "virtual" ? "Virtual Event" : event.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mb-2">
                      <Switch
                        checked={event.is_public}
                        onCheckedChange={async (checked) => {
                          const res = await fetch(`/api/events/${event.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ is_public: checked })
                          });
                          if (res.ok) {
                            window.location.reload();
                          }
                        }}
                      />
                      <span className="text-sm text-gray-600">
                        {event.is_public ? 'Public' : 'Private'}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                    <Link
                      href={`/User/events/${event.id}`}
                      className="inline-flex items-center gap-2 bg-rose-600 text-white py-2.5 px-6 rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-lg shadow-rose-100 hover:shadow-rose-200"
                    >
                      View Details
                    </Link>
                    <Link
                      href={`/admin/event-registrations/${event.id}`}
                      className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-6 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200"
                    >
                      Registrations
                      {!isParticipantLoading && eventParticipantData?.count ? (
                        <span className="bg-rose-600 text-white text-xs px-2 py-1 rounded-full">
                          {eventParticipantData.count}
                        </span>
                      ) : null}
                    </Link>
                    {/* Copy Link button for private events */}
                    {!event.is_public && (
                      <Button
                        type="button"
                        variant="outline"
                        className="inline-flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                        onClick={async () => {
                          const url = `${window.location.origin}/User/events/${event.id}`;
                          await navigator.clipboard.writeText(url);
                          toast.success("Event link copied to clipboard!");
                        }}
                        title="Copy private event link"
                      >
                        <Clipboard className="w-4 h-4 mr-1" /> Copy Link
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Event Form - Hidden by default */}
      {isEditing && editingEvent && (
        <Card className="mb-8 bg-white">
          <CardHeader>
            <CardTitle className="text-gray-800">Edit Event</CardTitle>
            <CardDescription className="text-gray-600">
              Update the event details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEditEvent} className="space-y-6">
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
                  <TiptapEditor
                    content={form.description || ""}
                    onChange={(content) => setForm(f => ({ ...f, description: content }))}
                    placeholder="Enter event description..."
                  />
                </div>

                {/* Image Upload Section */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="image" className="text-gray-700">
                      Event Image
                    </Label>
                    <div className="space-y-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="border-gray-200"
                        disabled={!!form.image_url}
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-w-md rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="image_url" className="text-gray-700">
                      Or Image URL
                    </Label>
                    <Input
                      id="image_url"
                      placeholder="Enter image URL"
                      value={form.image_url}
                      onChange={handleImageUrlChange}
                      className="border-gray-200"
                      disabled={!!imageFile}
                    />
                  </div>
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
                {creating ? "Updating..." : "Update Event"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
