"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";

type EventRegistration = {
  id: string;
  registered_at: string;
  user_id: string;
  payment_id?: string | null;
  order_id?: string | null;
  amount_paid?: number | null;
  user: {
    name: string;
    email: string;
    linkedin: string | null;
  };
};

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<{ title: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`);
        const eventData = await eventRes.json();
        setEvent(eventData.event);

        // Fetch registrations for this event
        const res = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        const data = await res.json();
        
        if (res.ok) {
          setRegistrations(data.registrations);
        } else {
          console.error("Failed to fetch registrations:", data.error);
        }
      } catch (error) {
        console.error("Error fetching registrations:", error);
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchRegistrations();
    }
  }, [eventId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Button
        variant="ghost" 
        className="mb-6 text-rose-600 hover:text-rose-700"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Events
      </Button>

      <h1 className="text-2xl font-bold mb-2">
        {event ? `Registrations: ${event.title}` : "Event Registrations"}
      </h1>
      
      {loading ? (
        <div className="text-center py-12">Loading registrations...</div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-gray-500">
              Total registrations: <span className="font-semibold">{registrations.length}</span>
            </p>
          </div>

          {registrations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No registrations found for this event.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>So. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Payment ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg, idx) => (
                    <TableRow key={reg.id}>
                      <TableCell className="px-4 py-2 text-sm text-gray-700">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{reg.user?.name || "N/A"}</TableCell>
                      <TableCell>{reg.user?.email || "N/A"}</TableCell>
                      <TableCell>
                        {reg.user?.linkedin ? (
                          <a 
                            href={reg.user.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 hover:underline"
                          >
                            View Profile
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(reg.registered_at)}</TableCell>
                      <TableCell>{reg.payment_id || "-"}</TableCell>
                      <TableCell>{reg.order_id || "-"}</TableCell>
                      <TableCell>{reg.amount_paid ? `₹${reg.amount_paid}` : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
