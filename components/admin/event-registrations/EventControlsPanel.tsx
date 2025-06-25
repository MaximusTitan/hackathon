"use client";

import { Button } from "@/components/ui/button";

interface Event {
  title: string;
  show_start_button?: boolean;
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
}

interface EventControlsPanelProps {
  event: Event;
  updatingStartButton: boolean;
  onToggleStartButton: () => void;
}

export function EventControlsPanel({ 
  event, 
  updatingStartButton, 
  onToggleStartButton 
}: EventControlsPanelProps) {
  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-3">Event Controls</h3>
      <div className="flex items-center gap-4">
        <Button
          onClick={onToggleStartButton}
          disabled={updatingStartButton}
          variant={event.show_start_button ? "default" : "outline"}
          className={event.show_start_button ? "bg-green-600 hover:bg-green-700 text-white" : "border-gray-600 text-gray-600 hover:bg-gray-100"}
        >
          {updatingStartButton ? 'Updating...' : (
            event.show_start_button ? 'Start Button Enabled' : 'Start Button Disabled'
          )}
        </Button>
        <p className="text-sm text-gray-600">
          {event.show_start_button 
            ? 'Participants can see the "Enter Event" button' 
            : 'The "Enter Event" button is hidden from participants'
          }
        </p>
      </div>
    </div>
  );
}
