"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  AdminDashboardHeader,
  AdminEventForm,
  AdminEventsList
} from "@/components/admin";

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
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
};

export default function AdminDashboard() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPastEvents, setShowPastEvents] = useState(false);  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    start_time: "",
    end_time: "",
    event_type: "offline" as "virtual" | "offline",
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
    date_tba: false,
    time_tba: false,
    venue_tba: false,
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

  useEffect(() => {    async function fetchEventsOptimized() {
      try {
        setLoading(true);
        
        // Fetch events first and show them immediately
        const res = await fetch("/api/events");
        const data = await res.json();
        
        const currentDate = new Date();
        const allEvents = data.events || [];
        
        // Split events into upcoming and past
        const { upcoming, past } = allEvents.reduce((acc: { upcoming: Event[], past: Event[] }, event: Event) => {
          // If any date field is TBA, treat as upcoming event
          if (event.date_tba || event.time_tba || event.venue_tba) {
            acc.upcoming.push(event);
          } else {
            const eventDate = new Date(event.start_date || "");
            if (eventDate >= currentDate) {
              acc.upcoming.push(event);
            } else {
              acc.past.push(event);
            }
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
        razorpay_key_id: form.is_paid ? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "" : null,
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
      // If any date field is TBA, treat as upcoming event
      if (event.date_tba || event.time_tba || event.venue_tba) {
        acc.upcoming.push(event);
      } else {
        const eventDate = new Date(event.start_date || "");
        if (eventDate >= currentDate) {
          acc.upcoming.push(event);
        } else {
          acc.past.push(event);
        }
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
      date_tba: event.date_tba || false,
      time_tba: event.time_tba || false,
      venue_tba: event.venue_tba || false,
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
      date_tba: false,
      time_tba: false,
      venue_tba: false,
    });
    setStartDateObj(undefined);
    setEndDateObj(undefined);
    setImageFile(null);
    setImagePreview(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">      <AdminDashboardHeader 
        showPastEvents={showPastEvents}
        onTogglePastEvents={setShowPastEvents}
        onCreateEvent={() => {
          if (showCreate || isEditing) {
            // If form is open (either create or edit), close it
            setIsEditing(false);
            setEditingEvent(null);
            resetForm();
            setShowCreate(false);
          } else {
            // If form is closed, open create form
            setShowCreate(true);
          }
        }}
        showCreate={showCreate || isEditing}
      />{(showCreate || isEditing) && (
        <AdminEventForm
          form={form}
          setForm={setForm}
          startDateObj={startDateObj}
          setStartDateObj={setStartDateObj}
          endDateObj={endDateObj}
          setEndDateObj={setEndDateObj}
          imageFile={imageFile}
          setImageFile={setImageFile}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          uploading={uploading}
          creating={creating}
          isEditing={isEditing}
          editingEvent={editingEvent}
          onSubmit={isEditing ? handleEditEvent : handleCreateEvent}
          onCancel={() => {
            setIsEditing(false);
            setEditingEvent(null);
            resetForm();
            setShowCreate(false);
          }}
          onImageChange={handleImageChange}
          onImageUrlChange={handleImageUrlChange}
        />
      )}      <AdminEventsList
        loading={loading}
        events={events}
        showPastEvents={showPastEvents}
        participantData={participantData}
        onEditEvent={startEditing}
        onDeleteEvent={async (eventId: string) => {
          const event = events.find(e => e.id === eventId);
          if (window.confirm(`Are you sure you want to delete the event '${event?.title}'? This action cannot be undone.`)) {
            const res = await fetch(`/api/events/${eventId}`, {
              method: 'DELETE',
            });
            if (res.ok) {
              toast.success('Event deleted successfully');
              setEvents(events.filter(e => e.id !== eventId));
            } else {
              toast.error('Failed to delete event');
            }
          }
        }}
        onTogglePublic={async (eventId: string, isPublic: boolean) => {
          const res = await fetch(`/api/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_public: isPublic })
          });
          if (res.ok) {
            window.location.reload();
          }
        }}
        onCreateEvent={() => {
          if (showCreate || isEditing) {
            // If form is open (either create or edit), close it
            setIsEditing(false);
            setEditingEvent(null);
            resetForm();
            setShowCreate(false);
          } else {
            // If form is closed, open create form
            setShowCreate(true);
          }
        }}
      />
    </div>
  );
}
