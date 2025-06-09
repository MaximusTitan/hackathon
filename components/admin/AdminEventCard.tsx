"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CalendarIcon, Clock, MapPin, Pencil, Trash2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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

interface AdminEventCardProps {
  event: Event;
  index: number;
  participantData?: { count: number; loading: boolean };
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
  onTogglePublic?: (eventId: string, isPublic: boolean) => void;
}

export function AdminEventCard({ 
  event, 
  index, 
  participantData, 
  onEdit, 
  onDelete,
  onTogglePublic 
}: AdminEventCardProps) {
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false);
  const isParticipantLoading = participantData?.loading !== false;

  const handleVisibilityToggle = async (checked: boolean) => {
    setIsTogglingVisibility(true);
    try {
      if (onTogglePublic) {
        // Use the provided callback
        await onTogglePublic(event.id, checked);
      } else {
        // Default behavior
        const res = await fetch(`/api/events/${event.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_public: checked })
        });
        
        if (res.ok) {
          toast.success(`Event visibility updated to ${checked ? 'public' : 'private'}`);
          // Refresh the page to update the UI
          window.location.reload();
        } else {
          toast.error('Failed to update event visibility');
        }
      }
    } catch (error) {
      console.error('Error updating visibility:', error);
      toast.error('Failed to update event visibility');
    } finally {
      setIsTogglingVisibility(false);
    }
  };

  const handleDeleteClick = async () => {
    if (window.confirm(`Are you sure you want to delete the event '${event.title}'? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/events/${event.id}`, {
          method: 'DELETE',
        });
        
        if (res.ok) {
          toast.success('Event deleted successfully');
          onDelete(event.id);
        } else {
          toast.error('Failed to delete event');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('Failed to delete event');
      }
    }
  };

  const handleShareClick = async () => {
    try {
      const eventUrl = `${window.location.origin}/events/${event.id}`;
      await navigator.clipboard.writeText(eventUrl);
      toast.success('Event link copied to clipboard!');
    } catch (error) {
      console.error('Share error:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  return (
    <div 
      className={`w-full bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-2xl transition-all duration-300 group flex flex-col md:flex-row overflow-hidden relative hover:scale-[1.02] h-96 md:h-80 ${
        index < 3 ? 'animate-in slide-in-from-bottom-4' : ''
      }`}
      style={{
        animationDelay: index < 3 ? `${index * 100}ms` : '0ms'
      }}
    >      {/* Admin Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <Button
          onClick={handleShareClick}
          className="w-9 h-9 p-0 text-gray-500 hover:text-green-600"
          title="Share event"
          variant="ghost"
        >
          <Share2 className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => onEdit(event)}
          className="w-9 h-9 p-0 text-gray-500 hover:text-blue-600"
          title="Edit event"
          variant="ghost"
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          onClick={handleDeleteClick}
          className="w-9 h-9 p-0 text-gray-500 hover:text-red-600"
          title="Delete event"
          variant="ghost"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Event Image */}
      <div className="md:w-2/5 w-full h-80 md:h-full relative flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = "/placeholder-event.png";
            }}
            priority={index < 3}
          />
        ) : (
          <span className="text-8xl font-bold text-gray-200/60 select-none transform -rotate-12 scale-150">
            {event.title.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
      </div>

      {/* Event Details */}
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
              event.is_paid ? "text-green-600" : "text-blue-600"
            }`}>
              {event.is_paid ? `₹${event.price}` : 'Free Entry'}
            </span>
          </div>
          
          {/* Date and Time */}          <div className="flex flex-wrap items-center gap-2 text-gray-600 mb-3">
            <span className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
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
          </div>          {/* Location */}
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span className="text-sm">
              {event.event_type === "virtual" 
                ? "Virtual Event" 
                : event.venue_tba 
                  ? "Venue TBA" 
                  : event.location
              }
            </span>
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-3 mb-2">
            <Switch
              checked={event.is_public}
              onCheckedChange={handleVisibilityToggle}
              disabled={isTogglingVisibility}
            />
            <span className="text-sm text-gray-600">
              {event.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <Link
            href={`/events/${event.id}`}
            className="inline-flex items-center gap-2 bg-rose-600 text-white py-2.5 px-4 rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-lg shadow-rose-100 hover:shadow-rose-200"
          >
            View Details
          </Link>
          <Link
            href={`/admin/event-registrations/${event.id}`}
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium border border-gray-200"
          >
            Registrations
            {!isParticipantLoading && participantData?.count ? (
              <span className="bg-rose-600 text-white text-xs px-2 py-1 rounded-full">
                {participantData.count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </div>
  );
}
