"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import { Facepile } from "@/components/ui/facepile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  
  // Store participant data separately with loading states
  const [participantData, setParticipantData] = useState<Record<string, ParticipantData>>({});

  // First useEffect: Fetch events quickly without participant data
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch("/api/events");
        let data: any = {};
        try {
          data = await res.json();
        } catch (err) {
          data = {};
        }

        // Filter out past events and sort by created_at
        const currentDate = new Date();
        const upcomingEvents = (data.events || [])
          .filter((event: Event) => {
            const eventDate = new Date(event.start_date || "");
            return eventDate >= currentDate;
          })
          .sort((a: Event, b: Event) => {
            const dateA = new Date(a.created_at || "");
            const dateB = new Date(b.created_at || "");
            return dateB.getTime() - dateA.getTime();
          });

        setEvents(upcomingEvents);
        setLoading(false);
      } catch (error) {
        setEvents([]);
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

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
    });
  }, [events]);

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
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No events found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              There are currently no upcoming events available. Check back soon for exciting new events!
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 gap-8">
            {events.map((event) => {
              const eventParticipantData = participantData[event.id];
              const isParticipantLoading = eventParticipantData?.loading !== false;
              
              return (
                <div
                  key={event.id}
                  className="w-full bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row overflow-hidden relative hover:scale-[1.02] h-80 md:h-72"
                >
                  <div className="md:w-2/5 w-full h-72 md:h-full relative flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
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
                      <div className="space-y-3">
                        <h3 className="font-bold text-2xl text-gray-900 group-hover:text-rose-600 transition-colors duration-300 line-clamp-2">
                          {event.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-gray-600">
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

                        {/* Location on separate line */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                            <MapPin className="w-4 h-4 text-rose-500" />
                            <span className="text-sm">
                              {event.event_type === "virtual" ? "Virtual Event" : event.location}
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
                      {/* Clickable Facepile */}
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
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    <span className="text-sm text-gray-500 ml-1">Loading</span>
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
                                Registered Participants
                                <span className="text-base text-gray-500 font-normal">
                                  ({selectedEventParticipants.length})
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <ScrollArea className="max-h-96">
                              <div className="space-y-3">
                                {selectedEventParticipants.length === 0 ? (
                                  <p className="text-gray-500 text-center py-4">
                                    No participants registered yet.
                                  </p>
                                ) : (
                                  selectedEventParticipants.map((participant) => (
                                    <Link
                                      key={participant.id}
                                      href={`/User/profile/${participant.user_id}`}
                                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                                      onClick={() => setDialogOpen(false)}
                                    >
                                      <div className="h-12 w-12 rounded-full overflow-hidden flex-shrink-0">
                                        {participant.photo_url ? (
                                          <img
                                            src={participant.photo_url}
                                            alt={participant.user_name || "Profile"}
                                            className="h-12 w-12 object-cover"
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
                        </Dialog>
                      </div>
                      <Link
                        href={`/User/events/${event.id}`}
                        className="inline-flex items-center gap-2 bg-rose-600 text-white py-2.5 px-6 rounded-lg hover:bg-rose-700 transition-colors text-base font-medium shadow-lg shadow-rose-100 hover:shadow-rose-200"
                      >
                        View Details
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
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
