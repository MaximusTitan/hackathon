"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventHeaderProps {
  eventTitle?: string;
}

export function EventHeader({ eventTitle }: EventHeaderProps) {
  const router = useRouter();

  return (
    <>
      <Button
        variant="ghost" 
        className="mb-6 text-rose-600 hover:text-rose-700"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {eventTitle ? `Event Management: ${eventTitle}` : "Event Management"}
        </h1>
        <p className="text-gray-600">
          Manage registrations, attendance, screening tests, and presentations
        </p>
      </div>
    </>
  );
}
