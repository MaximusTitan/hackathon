import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminEventCard } from "./AdminEventCard";
import { AdminEventCardSkeleton } from "./AdminEventCardSkeleton";

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

interface AdminEventsListProps {
  loading: boolean;
  events: Event[];
  showPastEvents: boolean;
  participantData: Record<string, { count: number; loading: boolean }>;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (eventId: string) => void;
  onTogglePublic?: (eventId: string, isPublic: boolean) => void;
  onCreateEvent: () => void;
}

export function AdminEventsList({
  loading,
  events,
  showPastEvents,
  participantData,
  onEditEvent,
  onDeleteEvent,
  onTogglePublic,
  onCreateEvent
}: AdminEventsListProps) {
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium">Loading events...</span>
          </div>
          <p className="text-gray-400 mt-2">Fetching event data from dashboard</p>
        </div>
        
        <div className="w-full grid grid-cols-1 gap-8">
          {[1, 2, 3].map((i) => (
            <AdminEventCardSkeleton key={i} />
          ))}
        </div>
        
        <div className="flex justify-center items-center gap-2 py-4">
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
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
            onClick={onCreateEvent}
          >
            Create Your First Event
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 gap-8">
      {events.map((event, index) => (        <AdminEventCard
          key={event.id}
          event={event}
          index={index}
          participantData={participantData[event.id]}
          onEdit={onEditEvent}
          onDelete={onDeleteEvent}
          onTogglePublic={onTogglePublic}
        />
      ))}
    </div>
  );
}
