"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, ExternalLink, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type WorkflowData = {
  event: {
    id: string;
    title: string;
  };
  registration: {
    id: string;
    attended: boolean;
    screening_status: 'pending' | 'sent' | 'completed' | 'skipped';
    presentation_status: 'pending' | 'submitted' | 'reviewed';
    github_link?: string | null;
    deployment_link?: string | null;
    presentation_link?: string | null;
    presentation_notes?: string | null;
  };
  screening_test?: {
    id: string;
    mcq_link: string;
    instructions: string;
    deadline: string | null;
  } | null;
};

export default function EventWorkflowPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.eventId) ? params.eventId[0] : params?.eventId;
  const [workflowData, setWorkflowData] = useState<WorkflowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [presentationForm, setPresentationForm] = useState({
    github_link: '',
    deployment_link: '',
    presentation_link: '',
    presentation_notes: ''
  });
  const router = useRouter();

  useEffect(() => {
    async function fetchWorkflowData() {
      try {
        const res = await fetch(`/api/user/event-workflow/${eventId}`);
        const data = await res.json();
        
        if (res.ok) {
          setWorkflowData(data);
          if (data.registration) {
            setPresentationForm({
              github_link: data.registration.github_link || '',
              deployment_link: data.registration.deployment_link || '',
              presentation_link: data.registration.presentation_link || '',
              presentation_notes: data.registration.presentation_notes || ''
            });
          }
        } else {
          toast.error(data.error || "Failed to load workflow data");
        }
      } catch (error) {
        console.error("Error fetching workflow data:", error);
        toast.error("Error loading workflow data");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchWorkflowData();
    }
  }, [eventId]);

  const handleScreeningComplete = async () => {
    try {
      const res = await fetch(`/api/user/complete-screening`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: eventId })
      });

      if (res.ok) {
        toast.success('Screening test marked as completed');
        // Refresh workflow data
        const refreshRes = await fetch(`/api/user/event-workflow/${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setWorkflowData(refreshData);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to mark screening as complete');
      }
    } catch (error) {
      console.error('Error completing screening:', error);
      toast.error('Error completing screening');
    }
  };

  const handlePresentationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch(`/api/user/submit-presentation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          ...presentationForm
        })
      });

      if (res.ok) {
        toast.success('Presentation submitted successfully');
        // Refresh workflow data
        const refreshRes = await fetch(`/api/user/event-workflow/${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setWorkflowData(refreshData);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to submit presentation');
      }
    } catch (error) {
      console.error('Error submitting presentation:', error);
      toast.error('Error submitting presentation');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'submitted':
      case 'skipped':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'sent':
        return <Clock className="w-5 h-5 text-blue-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <div className="text-center py-12">Loading workflow...</div>
      </div>
    );
  }

  if (!workflowData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500">Workflow data not found or you haven't registered for this event.</p>
        <Button 
          onClick={() => router.back()}
          className="mt-4 bg-rose-600 hover:bg-rose-700 text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  const { event, registration, screening_test } = workflowData;

  // Check if user attended
  if (!registration.attended) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6">
        <Button
          variant="ghost" 
          className="mb-6 text-rose-600 hover:text-rose-700"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Event Workflow: {event.title}</CardTitle>
            <CardDescription>Complete the post-event requirements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Attendance Required</h3>
              <p className="text-gray-600">
                You need to attend the event before accessing the workflow steps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Button
        variant="ghost" 
        className="mb-6 text-rose-600 hover:text-rose-700"
        onClick={() => router.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Event Workflow: {event.title}</h1>
        <p className="text-gray-600">Complete the following steps as required</p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Screening Test */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon(registration.screening_status)}
              <div>
                <CardTitle>Step 1: Screening Test</CardTitle>
                <CardDescription>
                  Status: {registration.screening_status.charAt(0).toUpperCase() + registration.screening_status.slice(1)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {registration.screening_status === 'sent' && screening_test ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Instructions</h4>
                  <p className="text-blue-800">{screening_test.instructions}</p>
                  {screening_test.deadline && (
                    <p className="text-blue-700 mt-2">
                      <strong>Deadline:</strong> {new Date(screening_test.deadline).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                    <a 
                      href={screening_test.mcq_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      Take Screening Test <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button 
                    onClick={handleScreeningComplete}
                    variant="outline"
                  >
                    Mark as Completed
                  </Button>
                </div>
              </div>
            ) : registration.screening_status === 'completed' ? (
              <div className="text-green-700 bg-green-50 p-4 rounded-lg">
                ✅ Screening test completed successfully!
              </div>
            ) : registration.screening_status === 'skipped' ? (
              <div className="text-orange-700 bg-orange-50 p-4 rounded-lg">
                ⏭️ Screening test was skipped by admin.
              </div>
            ) : (
              <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                Waiting for admin to send the screening test.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Presentation Submission */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {getStatusIcon(registration.presentation_status)}
              <div>
                <CardTitle>Step 2: Project Submission</CardTitle>
                <CardDescription>
                  Status: {registration.presentation_status.charAt(0).toUpperCase() + registration.presentation_status.slice(1)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {(registration.screening_status === 'completed' || registration.screening_status === 'skipped') ? (
              <form onSubmit={handlePresentationSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="github_link">GitHub Repository Link</Label>
                  <Input
                    id="github_link"
                    type="url"
                    value={presentationForm.github_link}
                    onChange={(e) => setPresentationForm(prev => ({ ...prev, github_link: e.target.value }))}
                    placeholder="https://github.com/username/repository"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="deployment_link">Deployed Application Link</Label>
                  <Input
                    id="deployment_link"
                    type="url"
                    value={presentationForm.deployment_link}
                    onChange={(e) => setPresentationForm(prev => ({ ...prev, deployment_link: e.target.value }))}
                    placeholder="https://your-app.vercel.app"
                  />
                </div>
                <div>
                  <Label htmlFor="presentation_link">Presentation Link</Label>
                  <Input
                    id="presentation_link"
                    type="url"
                    value={presentationForm.presentation_link}
                    onChange={(e) => setPresentationForm(prev => ({ ...prev, presentation_link: e.target.value }))}
                    placeholder="https://docs.google.com/presentation/... or https://canva.com/..."
                  />
                </div>
                <div>
                  <Label htmlFor="presentation_notes">Additional Notes</Label>
                  <Textarea
                    id="presentation_notes"
                    value={presentationForm.presentation_notes}
                    onChange={(e) => setPresentationForm(prev => ({ ...prev, presentation_notes: e.target.value }))}
                    placeholder="Any additional information about your project..."
                    rows={4}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {submitting ? 'Submitting...' : registration.presentation_status === 'submitted' ? 'Update Submission' : 'Submit Project'}
                </Button>
              </form>
            ) : (
              <div className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                Complete the screening test first to unlock project submission.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
