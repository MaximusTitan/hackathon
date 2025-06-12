import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Share2, Users } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface AdminDashboardHeaderProps {
  showPastEvents: boolean;
  onTogglePastEvents: (show: boolean) => void;
  onCreateEvent: () => void;
  showCreate: boolean;
}

export function AdminDashboardHeader({ 
  showPastEvents, 
  onTogglePastEvents, 
  onCreateEvent,
  showCreate
}: AdminDashboardHeaderProps) {
  const handleShareClick = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('URL copied to clipboard!');
  };

  return (
    <>      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your events and community</p>
        </div>        <div className="flex items-center gap-3">
          <Button
            onClick={onCreateEvent}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            {showCreate ? "Hide Event Form" : "Create Event"}
          </Button>
        </div>
      </header>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {showPastEvents ? "Past Events" : "Upcoming Events"}
        </h2>
        <div className="flex items-center gap-2">
          <Switch
            id="show-past-events"
            checked={showPastEvents}
            onCheckedChange={onTogglePastEvents}
          />
          <Label htmlFor="show-past-events" className="text-sm">
            Show Past Events
          </Label>
        </div>
      </div>
    </>
  );
}
