"use client";

import { useEffect, useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { CalendarIcon, MapPin, Clock, Users, Share2 } from "lucide-react";
import { Facepile } from "@/components/ui/facepile";
import { Button } from "@/components/ui/button";

import { toast } from "sonner";

// Lazy load heavy components
const Dialog = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.Dialog })), {
  ssr: false
});
const DialogContent = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogContent })), {
  ssr: false
});
const DialogHeader = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogHeader })), {
  ssr: false
});
const DialogTitle = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogTitle })), {
  ssr: false
});
const DialogTrigger = dynamic(() => import("@/components/ui/dialog").then(mod => ({ default: mod.DialogTrigger })), {
  ssr: false
});
const ScrollArea = dynamic(() => import("@/components/ui/scroll-area").then(mod => ({ default: mod.ScrollArea })), {
  ssr: false
});

type Participant = {
  id: string;
  user_id: string;
  user_name: string | null;
  photo_url?: string | null;
};

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
  participant_count?: number;
  participants?: Participant[];
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
};

type ParticipantData = {
  count: number;
  participants: Participant[];
  loading?: boolean;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventParticipants, setSelectedEventParticipants] = useState<Participant[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPastEvents, setShowPastEvents] = useState(false);
  
  // Store participant data separately with loading states
  const [participantData, setParticipantData] = useState<Record<string, ParticipantData>>({});
  
  // State for managing image loading - images load after event details are shown
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [showImages, setShowImages] = useState(false);

  // Optimized useEffect: Show events immediately, load participants after
  useEffect(() => {
    async function fetchEventsOptimized() {
      try {
        setLoading(true);
        
        // Fetch events first and show them immediately
        const res = await fetch("/api/events");
        let data: any = {};
        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }        // Filter and sort events
        const currentDate = new Date();
        const filteredEvents = (data.events || [])
          .filter((event: Event) => {
            // If any TBA field is true, treat as upcoming event
            if (event.date_tba || event.time_tba || event.venue_tba) {
              return !showPastEvents; // Show in upcoming, not in past
            }
            
            const eventDate = new Date(event.start_date || "");
            if (showPastEvents) {
              return eventDate < currentDate;
            } else {
              return eventDate >= currentDate;
            }
          })
          .sort((a: Event, b: Event) => {
            const dateA = new Date(a.created_at || "");
            const dateB = new Date(b.created_at || "");
            return dateB.getTime() - dateA.getTime();
          });        // Show events immediately
        setEvents(filteredEvents);
        setLoading(false);

        // Start loading images after a brief delay to prioritize event details
        setTimeout(() => {
          setShowImages(true);
        }, 300);

        // If no events, stop here
        if (filteredEvents.length === 0) {
          return;
        }

        // Initialize participant data with loading states
        const initialData: Record<string, ParticipantData> = {};
        interface InitialDataEntry {
          count: number;
          participants: Participant[];
          loading: boolean;
        }

        filteredEvents.forEach((event: Event): void => {
          initialData[event.id] = {
            count: 0,
            participants: [],
            loading: true
          } satisfies InitialDataEntry;
        });
        setParticipantData(initialData);

        // Load participant data progressively (prioritize first 3 events)
        const priorityEvents = filteredEvents.slice(0, 3);
        const remainingEvents = filteredEvents.slice(3);

        // Load priority events first (no delay)
        interface ParticipantPreviewResponse {
          count: number;
          participants: Participant[];
        }

        interface ParticipantDataUpdate {
          count: number;
          participants: Participant[];
          loading: boolean;
        }

        priorityEvents.forEach(async (event: Event, index: number): Promise<void> => {
          try {
            // Small stagger for priority events
            if (index > 0) {
              await new Promise<void>(resolve => setTimeout(resolve, index * 50));
            }
            
            const res: Response = await fetch(`/api/events/${event.id}/participants/preview`);
            if (res.ok) {
              const data: ParticipantPreviewResponse = await res.json();
              setParticipantData((prev: Record<string, ParticipantData>) => ({
          ...prev,
          [event.id]: {
            count: data.count || 0,
            participants: data.participants || [],
            loading: false
          }
              }));
            } else {
              setParticipantData((prev: Record<string, ParticipantData>) => ({
          ...prev,
          [event.id]: {
            count: 0,
            participants: [],
            loading: false
          }
              }));
            }
          } catch (error: unknown) {
            console.error(`Error fetching participant preview for priority event ${event.id}:`, error);
            setParticipantData((prev: Record<string, ParticipantData>) => ({
              ...prev,
              [event.id]: {
          count: 0,
          participants: [],
          loading: false
              }
            }));
          }
        });

        // Load remaining events with slight delay
        interface ParticipantPreviewResponse {
          count: number;
          participants: Participant[];
        }

        interface ParticipantDataUpdate {
          count: number;
          participants: Participant[];
          loading: boolean;
        }

                remainingEvents.forEach(async (event: Event, index: number): Promise<void> => {
                  try {
                    // Delay for remaining events to not interfere with priority loading
                    await new Promise<void>(resolve => setTimeout(resolve, 300 + (index * 100)));
                    
                    const res: Response = await fetch(`/api/events/${event.id}/participants/preview`);
                    if (res.ok) {
                      const data: ParticipantPreviewResponse = await res.json();
                      setParticipantData((prev: Record<string, ParticipantData>) => ({
                        ...prev,
                        [event.id]: {
                          count: data.count || 0,
                          participants: data.participants || [],
                          loading: false
                        }
                      }));
                    } else {
                      setParticipantData((prev: Record<string, ParticipantData>) => ({
                        ...prev,
                        [event.id]: {
                          count: 0,
                          participants: [],
                          loading: false
                        }
                      }));
                    }
                  } catch (error: unknown) {
                    console.error(`Error fetching participant preview for event ${event.id}:`, error);
                    setParticipantData((prev: Record<string, ParticipantData>) => ({
                      ...prev,
                      [event.id]: {
                        count: 0,
                        participants: [],
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

  // Reset image loading states when showPastEvents changes
  useEffect(() => {
    setImagesLoaded({});
    setShowImages(false);
  }, [showPastEvents]);

  // Second useEffect: Fetch participant data after events are loaded
  useEffect(() => {
    if (events.length === 0) return;
    
    // Initialize loading state for all events
    const initialData: Record<string, ParticipantData> = {};
    events.forEach(event => {
      initialData[event.id] = {
        count: 0,
        participants: [],
        loading: true
      };
    });
    setParticipantData(initialData);
    
    // Fetch participant data for each event progressively
    events.forEach(async (event, index) => {
      try {
        // Add a small delay to stagger requests and avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, index * 100));
        
        const res = await fetch(`/api/events/${event.id}/participants/preview`);
        if (res.ok) {
          const data = await res.json();
          setParticipantData(prev => ({
            ...prev,
            [event.id]: {
              count: data.count || 0,
              participants: data.participants || [],
              loading: false
            }
          }));
        } else {
          // Set empty data if fetch fails
          setParticipantData(prev => ({
            ...prev,
            [event.id]: {
              count: 0,
              participants: [],
              loading: false
            }
          }));
        }
      } catch (error) {
        console.error(`Error fetching participant preview for event ${event.id}:`, error);
        setParticipantData(prev => ({
          ...prev,
          [event.id]: {
            count: 0,
            participants: [],
            loading: false
          }
        }));
      }
    });  }, [events]);

  // Handle image loading completion
  const handleImageLoad = useCallback((eventId: string) => {
    setImagesLoaded(prev => ({
      ...prev,
      [eventId]: true
    }));
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
  // Fetch full participant list only when dialog is opened
  const handleFacepileClick = async (event: Event) => {
    setDialogOpen(true);
    setSelectedEventParticipants([]); // Clear previous
    try {
      const res = await fetch(`/api/events/${event.id}/participants`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEventParticipants(data.participants || []);
      } else {
        setSelectedEventParticipants([]);
      }
    } catch {
      setSelectedEventParticipants([]);
    }  };

  // Handle event sharing by copying link to clipboard
  const handleShareEvent = async (event: Event) => {
    try {
      const eventSlug = encodeURIComponent(event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      const eventUrl = `${window.location.origin}/events/${eventSlug}`;
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  // Loading skeleton component
  const EventCardSkeleton = () => (
    <div className="w-full bg-white rounded-3xl shadow-lg border border-gray-100 flex flex-col md:flex-row overflow-hidden h-80 md:h-72 animate-pulse">
      <div className="md:w-2/5 w-full h-72 md:h-full relative flex-shrink-0 bg-gray-200">
        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300"></div>
      </div>
      <div className="flex-1 p-8 flex flex-col justify-between bg-white min-h-0">
        <div className="flex-1 overflow-hidden">
          <div className="space-y-3">
            {/* Title skeleton */}
            <div className="h-8 bg-gray-200 rounded-lg w-3/4"></div>
            
            {/* Date and time badges skeleton */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-32"></div>
              <div className="h-8 bg-gray-200 rounded-full w-28"></div>
            </div>

            {/* Location skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-8 bg-gray-200 rounded-full w-40"></div>
            </div>

            {/* Price skeleton */}
            <div className="pt-1">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        
        <div className="mt-3 flex justify-between items-end">
          {/* Facepile skeleton */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"
                  />
                ))}
              </div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          
          {/* Button skeleton */}
          <div className="h-12 bg-gray-200 rounded-lg w-32"></div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome to Hackon
        </h1>
        <p className="text-gray-600 text-lg">Discover and join amazing events.</p>
      </header>

      {/* Add toggle section */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          {showPastEvents ? "Past Events" : "Upcoming Events"}
        </h2>
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
      </div>

      <section>
        {loading ? (
          <div className="space-y-8">
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-3 text-gray-500">
                <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg font-medium">Loading amazing events...</span>
              </div>
              <p className="text-gray-400 mt-2">Discovering the best events for you</p>
            </div>
            
            <div className="w-full grid grid-cols-1 gap-8">
              {/* Show 3 skeleton cards */}
              {[1, 2, 3].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
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
                ? "No past events to display. Check back after attending some events!"
                : "There are currently no upcoming events available. Check back soon for exciting new events!"
              }
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 gap-8">
            {events.map((event, index) => {
              const eventParticipantData = participantData[event.id];
              const isParticipantLoading = eventParticipantData?.loading !== false;
              
              return (
                <div
                  key={event.id}
                  className={`w-full bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row overflow-hidden relative hover:scale-[1.02] h-80 md:h-72 ${
                    // Add staggered animation for visual appeal
                    index < 3 ? 'animate-in slide-in-from-bottom-4' : ''
                  }`}
                  style={{
                    // Stagger animation delay for first 3 cards
                    animationDelay: index < 3 ? `${index * 100}ms` : '0ms'
                  }}
                >
                  {/* Add past event indicator */}
                  {showPastEvents && (
                    <div className="absolute top-4 left-4 z-10">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-300">
                        Past Event
                      </span>
                    </div>
                  )}

                  {/* Share button in top right corner */}
                  <button
                    onClick={() => handleShareEvent(event)}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 text-gray-700 hover:text-blue-600 backdrop-blur-sm"
                    title="Share event"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>

                  <div className="md:w-2/5 w-full h-72 md:h-full relative flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
                    {event.image_url && showImages ? (
                      <div className="relative w-full h-full">
                        {/* Placeholder while image loads */}
                        {!imagesLoaded[event.id] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
                            <span className="text-4xl font-bold text-gray-300 select-none">
                              {event.title.charAt(0)}
                            </span>
                          </div>
                        )}
                        
                        <Image
                          src={event.image_url}
                          alt={event.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 40vw"
                          className={`object-cover group-hover:scale-110 transition-all duration-500 ease-out ${
                            showPastEvents ? "opacity-75" : ""
                          } ${
                            imagesLoaded[event.id] ? "opacity-100" : "opacity-0"
                          }`}
                          onLoad={() => handleImageLoad(event.id)}
                          onError={(e) => {
                            // Show fallback on error
                            setImagesLoaded(prev => ({ ...prev, [event.id]: true }));
                          }}
                          // Lazy loading for images after the first 3
                          priority={index < 3}
                          placeholder="empty"
                        />
                      </div>
                    ) : (
                      <span className={`text-8xl font-bold text-gray-200/60 select-none transform -rotate-12 scale-150 ${
                        showPastEvents ? "opacity-60" : ""
                      }`}>
                        {event.title.charAt(0)}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                  </div>
                  <div className="flex-1 p-8 flex flex-col justify-between bg-gradient-to-br from-white to-gray-50/50 min-h-0">
                    <div className="flex-1 overflow-hidden">
                      <div className="space-y-3">
                        <h3 className={`font-bold text-2xl text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2 ${
                          showPastEvents ? "text-gray-700" : ""
                        }`}>
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-gray-600">                          <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <CalendarIcon className="w-4 h-4 text-rose-500" />
                            <span className="text-sm">
                              {event.date_tba ? "Date TBA" : (
                                <>
                                  {event.start_date}
                                  {event.end_date && event.end_date !== event.start_date && (
                                    <span> - {event.end_date}</span>
                                  )}
                                </>
                              )}
                            </span>
                          </span><span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <Clock className="w-4 h-4 text-rose-500" />
                            <span className="text-sm">
                              {event.time_tba ? "Time TBA" : `${event.start_time} - ${event.end_time}`}
                            </span>
                          </span>
                        </div>

                        {/* Location on separate line */}
                        <div className="flex items-center gap-2 text-gray-600">                          <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <span className="text-sm">
                              {event.event_type === "virtual" 
                                ? "Virtual Event" 
                                : event.venue_tba 
                                  ? "Venue TBA" 
                                  : event.location
                              }
                            </span>
                          </span>
                        </div>

                        <div className="pt-1">
                          <span className={`text-lg font-semibold ${
                            event.is_paid 
                              ? "text-green-600" 
                              : "text-blue-600"
                          }`}>
                            {event.is_paid ? `₹${event.price}` : 'Free Entry'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex justify-between items-end">
                      {/* Clickable Facepile - optimized loading indicator */}
                      <div className="flex-1">
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                          <DialogTrigger asChild>
                            <div 
                              className="cursor-pointer"
                              onClick={() => handleFacepileClick(event)}
                            >
                              {isParticipantLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex -space-x-1">
                                    {[1, 2, 3].map((i) => (
                                      <div
                                        key={i}
                                        className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white animate-pulse"
                                        style={{ animationDelay: `${i * 0.1}s` }}
                                      />
                                    ))}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {/* More subtle loading animation */}
                                    <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse"></div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                                  </div>
                                </div>
                              ) : (
                                <Facepile
                                  participants={eventParticipantData?.participants || []}
                                  maxVisible={4}
                                  size="sm"
                                  showCount={true}
                                />
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-rose-500" />
                                {showPastEvents ? "Event Participants" : "Registered Participants"}
                                <span className="text-base text-gray-500 font-normal">
                                  ({selectedEventParticipants.length})
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-96">
                              <div className="space-y-3">
                                {selectedEventParticipants.length === 0 ? (
                                  <p className="text-gray-500 text-center py-4">
                                    {showPastEvents ? "No participants found." : "No participants registered yet."}
                                  </p>
                                ) : (
                                  selectedEventParticipants.map((participant) => (
                                    <Link
                                      key={participant.id}
                                      href={`/profile/${participant.user_id}`}
                                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                                      onClick={() => setDialogOpen(false)}
                                    >                                      <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0 relative">
                                        {participant.photo_url ? (
                                          <Image
                                            src={participant.photo_url}
                                            alt={participant.user_name || "Profile"}
                                            fill
                                            sizes="48px"
                                            className="object-cover"
                                            placeholder="empty"
                                          />
                                        ) : (
                                          <div className="h-12 w-12 bg-rose-100 flex items-center justify-center text-rose-600 font-semibold">
                                            {participant.user_name?.charAt(0)?.toUpperCase() || "U"}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                          {participant.user_name || "Unknown User"}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          View Profile
                                        </p>
                                      </div>
                                    </Link>
                                  ))
                                )}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>                      </div>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/events/${encodeURIComponent(event.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}`}
                          className={`inline-flex items-center gap-2 py-2.5 px-6 rounded-lg transition-colors text-base font-medium shadow-lg ${
                            showPastEvents 
                              ? "bg-gray-600 hover:bg-gray-700 text-white shadow-gray-100 hover:shadow-gray-200"
                              : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-100 hover:shadow-rose-200"
                          }`}
                        >
                          View Details
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
