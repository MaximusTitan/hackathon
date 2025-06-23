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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Send, Clock, CheckCircle, FileText, Users, ExternalLink, Trophy, Medal } from "lucide-react";
import { toast } from "sonner";
import MCQTestCreator from "@/components/admin/MCQTestCreator";
import { MCQQuestion } from "@/types/screening";

type EventRegistration = {
  id: string;
  registered_at: string;
  user_id: string;
  payment_id?: string | null;
  order_id?: string | null;
  amount_paid?: number | null;
  attended?: boolean;
  screening_status?: 'pending' | 'sent' | 'completed' | 'skipped';
  screening_test_id?: string | null;
  presentation_status?: 'pending' | 'submitted' | 'reviewed';
  github_link?: string | null;
  deployment_link?: string | null;
  presentation_link?: string | null;
  presentation_notes?: string | null;
  award_type?: 'winner' | 'runner_up' | null;
  award_assigned_at?: string | null;
  user: {
    name: string;
    email: string;
    linkedin: string | null;
  };
  // Enhanced information
  screening_test?: {
    title: string;
    passing_score: number;
    timer_minutes: number;
    total_questions: number;
    mcq_link?: string;
    deadline?: string;
  } | null;
  test_attempt?: {
    id: string;
    started_at: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    score_percentage: number;
    passed: boolean;
    time_taken_seconds: number;
    status: string;
    tab_switches: number;
  } | null;
  all_test_attempts?: Array<{
    id: string;
    started_at: string;
    submitted_at: string;
    score: number;
    total_questions: number;
    score_percentage: number;
    time_taken_seconds: number;
    status: string;
    tab_switches: number;
  }>;
  award_assigned_by_admin?: {
    name: string;
    email: string;
  } | null;
};

type ScreeningTest = {
  id: string;
  event_id: string;
  title?: string;
  mcq_link?: string;
  instructions: string;
  deadline: string | null;
  is_active: boolean;
  timer_minutes?: number;
  total_questions?: number;
  passing_score?: number;
  questions?: MCQQuestion[];
};

type Event = {
  title: string;
  show_start_button?: boolean;
  date_tba?: boolean;
  time_tba?: boolean;
  venue_tba?: boolean;
};

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [screeningTest, setScreeningTest] = useState<ScreeningTest | null>(null);  const [showScreeningDialog, setShowScreeningDialog] = useState(false);
  const [showMCQCreator, setShowMCQCreator] = useState(false);
  const [showMCQSender, setShowMCQSender] = useState(false);
  const [screeningForm, setScreeningForm] = useState({
    mcq_link: '',
    instructions: 'Please complete this screening test within the given deadline.',
    deadline: ''
  });  const [submittingScreening, setSubmittingScreening] = useState(false);
  const [showAwardDialog, setShowAwardDialog] = useState(false);const [selectedForAward, setSelectedForAward] = useState<string>('');
  const [awardType, setAwardType] = useState<'winner' | 'runner_up'>('winner');
  const [assigningAward, setAssigningAward] = useState(false);  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string>('');
  const [showMemberDetailDialog, setShowMemberDetailDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EventRegistration | null>(null);
  const [updatingStartButton, setUpdatingStartButton] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
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
          toast.error("Failed to fetch registrations");
        }

        // Fetch existing screening test
        const screeningRes = await fetch(`/api/admin/screening-test?event_id=${eventId}`);        if (screeningRes.ok) {
          const screeningData = await screeningRes.json();
          if (screeningData.screeningTest) {
            setScreeningTest(screeningData.screeningTest);
            setScreeningForm({
              mcq_link: screeningData.screeningTest.mcq_link || '',
              instructions: screeningData.screeningTest.instructions,
              deadline: screeningData.screeningTest.deadline ? 
                new Date(screeningData.screeningTest.deadline).toISOString().slice(0, 16) : ''
            });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Error loading data");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchData();
    }
  }, [eventId]);

  const updateAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const res = await fetch(`/api/admin/event-registrations/${registrationId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended })
      });

      if (res.ok) {
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId ? { ...reg, attended } : reg
          )
        );
        toast.success(`Attendance ${attended ? 'marked' : 'unmarked'} successfully`);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    }
  };

  const handleSendScreeningTest = async () => {
    if (selectedAttendees.length === 0) {
      toast.error('Please select attendees to send the screening test');
      return;
    }

    if (!screeningForm.mcq_link.trim()) {
      toast.error('Please provide the MCQ test link');
      return;
    }

    setSubmittingScreening(true);

    try {
      const res = await fetch('/api/admin/send-screening-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          registration_ids: selectedAttendees,
          mcq_link: screeningForm.mcq_link,
          instructions: screeningForm.instructions,
          deadline: screeningForm.deadline ? new Date(screeningForm.deadline).toISOString() : null
        })
      });

      if (res.ok) {
        toast.success('Screening test sent successfully');
        setShowScreeningDialog(false);
        setSelectedAttendees([]);
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send screening test');
      }
    } catch (error) {
      console.error('Error sending screening test:', error);
      toast.error('Error sending screening test');
    } finally {
      setSubmittingScreening(false);
    }
  };

  const handleSkipScreening = async () => {
    if (selectedAttendees.length === 0) {
      toast.error('Please select attendees to skip screening');
      return;
    }

    try {
      const res = await fetch('/api/admin/skip-screening', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: selectedAttendees
        })
      });

      if (res.ok) {
        toast.success('Screening skipped for selected attendees');
        setSelectedAttendees([]);
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        toast.error('Failed to skip screening');
      }
    } catch (error) {
      console.error('Error skipping screening:', error);
      toast.error('Error skipping screening');
    }
  };

  const handleAssignAward = async () => {
    if (!selectedForAward) {
      toast.error('Please select a participant to assign award');
      return;
    }

    setAssigningAward(true);

    try {
      const res = await fetch('/api/admin/assign-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedForAward,
          award_type: awardType
        })
      });

      if (res.ok) {
        toast.success(`${awardType === 'winner' ? 'Winner' : 'Runner-up'} assigned successfully`);
        setShowAwardDialog(false);
        setSelectedForAward('');
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to assign award');
      }
    } catch (error) {
      console.error('Error assigning award:', error);
      toast.error('Error assigning award');
    } finally {
      setAssigningAward(false);
    }
  };
  const handleRemoveAward = async (registrationId: string) => {
    try {
      const res = await fetch('/api/admin/remove-award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId
        })
      });

      if (res.ok) {
        toast.success('Award removed successfully');
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to remove award');
      }
    } catch (error) {
      console.error('Error removing award:', error);
      toast.error('Error removing award');
    }
  };
  const handleShowNotes = (notes: string) => {
    setSelectedNotes(notes);
    setShowNotesDialog(true);
  };

  const handleShowMemberDetail = (member: EventRegistration) => {
    setSelectedMember(member);
    setShowMemberDetailDialog(true);
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', text: 'Pending' },
      sent: { color: 'bg-blue-100 text-blue-800', text: 'Sent' },
      completed: { color: 'bg-green-100 text-green-800', text: 'Completed' },
      skipped: { color: 'bg-orange-100 text-orange-800', text: 'Skipped' },
      submitted: { color: 'bg-purple-100 text-purple-800', text: 'Submitted' },
      reviewed: { color: 'bg-indigo-100 text-indigo-800', text: 'Reviewed' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const attendedRegistrations = registrations.filter(reg => reg.attended);
  const canSelectForScreening = attendedRegistrations.filter(reg => 
    reg.screening_status === 'pending' || !reg.screening_status
  );
  const attendedWithProjects = registrations.filter(reg => 
    reg.attended && reg.presentation_status === 'submitted'
  );
  const winners = registrations.filter(reg => reg.award_type === 'winner');
  const runnersUp = registrations.filter(reg => reg.award_type === 'runner_up');

  const handleToggleStartButton = async () => {
    if (!event) return;
    
    setUpdatingStartButton(true);
    try {
      const res = await fetch(`/api/events/${eventId}/toggle-start-button`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          show_start_button: !event.show_start_button 
        })
      });

      if (res.ok) {
        setEvent(prev => prev ? { 
          ...prev, 
          show_start_button: !prev.show_start_button 
        } : null);
        toast.success(`Start button ${!event.show_start_button ? 'enabled' : 'disabled'} successfully`);
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update start button visibility');
      }
    } catch (error) {
      console.error('Error updating start button visibility:', error);
      toast.error('Error updating start button visibility');
    } finally {
      setUpdatingStartButton(false);
    }
  };  const handleSaveMCQTest = async (testData: any) => {
    setSubmittingScreening(true);

    try {
      const res = await fetch('/api/admin/save-mcq-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          ...testData
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('MCQ test saved successfully');
        setShowMCQCreator(false);
        
        // Refresh screening test data
        const screeningRes = await fetch(`/api/admin/screening-test?event_id=${eventId}`);
        if (screeningRes.ok) {
          const screeningData = await screeningRes.json();
          if (screeningData.screeningTest) {
            setScreeningTest(screeningData.screeningTest);
          }
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to save MCQ test');
      }
    } catch (error) {
      console.error('Error saving MCQ test:', error);
      toast.error('Error saving MCQ test');
    } finally {
      setSubmittingScreening(false);
    }
  };

  const handleSendMCQTest = async (testId: string) => {
    if (selectedAttendees.length === 0) {
      toast.error('Please select attendees to send the MCQ test');
      return;
    }

    setSubmittingScreening(true);

    try {
      const res = await fetch('/api/admin/send-mcq-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: eventId,
          registration_ids: selectedAttendees,
          test_id: testId
        })
      });

      if (res.ok) {
        const result = await res.json();
        toast.success('MCQ test sent successfully');
        setShowMCQSender(false);
        setSelectedAttendees([]);
        
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to send MCQ test');
      }
    } catch (error) {
      console.error('Error sending MCQ test:', error);
      toast.error('Error sending MCQ test');
    } finally {
      setSubmittingScreening(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
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
          {event ? `Event Management: ${event.title}` : "Event Management"}
        </h1>
        <p className="text-gray-600">
          Manage registrations, attendance, screening tests, and presentations
        </p>
      </div>

      {/* Event Controls */}
      {event && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-3">Event Controls</h3>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleToggleStartButton}
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
      )}
      
      {loading ? (
        <div className="text-center py-12">Loading registrations...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registrations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attended</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {registrations.filter(r => r.attended).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Screening Completed</CardTitle>
                <FileText className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {registrations.filter(r => r.screening_status === 'completed' || r.screening_status === 'skipped').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Presentations Submitted</CardTitle>
                <Send className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {registrations.filter(r => r.presentation_status === 'submitted' || r.presentation_status === 'reviewed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Winners</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {winners.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Runners-up</CardTitle>
                <Medal className="h-4 w-4 text-silver-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-silver-600">
                  {runnersUp.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          {attendedRegistrations.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Screening Test Management</h3>              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setShowMCQCreator(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={canSelectForScreening.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {screeningTest && screeningTest.questions && screeningTest.questions.length > 0 
                    ? 'Edit MCQ Test' 
                    : 'Create MCQ Test'
                  }
                </Button>

                {screeningTest && screeningTest.questions && screeningTest.questions.length > 0 && (
                  <Button 
                    onClick={() => setShowMCQSender(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={canSelectForScreening.length === 0 || selectedAttendees.length === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send MCQ Test ({screeningTest.questions.length} questions)
                  </Button>
                )}
                
                <Dialog open={showScreeningDialog} onOpenChange={setShowScreeningDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={canSelectForScreening.length === 0}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send External Test Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Send Screening Test</DialogTitle>
                      <DialogDescription>
                        Configure and send screening test to selected attendees
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="mcq_link">MCQ Test Link *</Label>
                        <Input
                          id="mcq_link"
                          type="url"
                          value={screeningForm.mcq_link}
                          onChange={(e) => setScreeningForm(prev => ({ ...prev, mcq_link: e.target.value }))}
                          placeholder="https://forms.google.com/... or assessment platform link"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="instructions">Instructions</Label>
                        <Textarea
                          id="instructions"
                          value={screeningForm.instructions}
                          onChange={(e) => setScreeningForm(prev => ({ ...prev, instructions: e.target.value }))}
                          placeholder="Instructions for taking the screening test..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline">Deadline (Optional)</Label>
                        <Input
                          id="deadline"
                          type="datetime-local"
                          value={screeningForm.deadline}
                          onChange={(e) => setScreeningForm(prev => ({ ...prev, deadline: e.target.value }))}
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        Selected attendees: {selectedAttendees.length}
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowScreeningDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendScreeningTest}
                        disabled={submittingScreening}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {submittingScreening ? 'Sending...' : 'Send Test'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  onClick={handleSkipScreening}
                  variant="outline"
                  disabled={selectedAttendees.length === 0}
                  className="border-orange-600 text-orange-600 hover:bg-orange-50"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Skip Screening for Selected
                </Button>
              </div>              <p className="text-blue-700 text-sm mt-2">
                {screeningTest && screeningTest.questions && screeningTest.questions.length > 0 
                  ? 'First select participants, then click "Send MCQ Test" to distribute the saved test. You can also edit the existing test or create external test links.'
                  : 'Select attendees from the table below to create an integrated MCQ test or send external test links.'
                }
              </p>
            </div>
          )}

          {/* Awards Management Section */}
          {attendedWithProjects.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-3">Awards Management</h3>
              <div className="flex flex-wrap gap-3">
                <Dialog open={showAwardDialog} onOpenChange={setShowAwardDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <Trophy className="mr-2 h-4 w-4" />
                      Assign Award
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Assign Award</DialogTitle>
                      <DialogDescription>
                        Select a participant and award type to assign
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="participant">Select Participant</Label>
                        <Select
                          value={selectedForAward}
                          onValueChange={setSelectedForAward}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a participant" />
                          </SelectTrigger>
                          <SelectContent>
                            {attendedWithProjects
                              .filter(reg => !reg.award_type) // Only show unawarded participants
                              .map(reg => (
                                <SelectItem key={reg.id} value={reg.id}>
                                  {reg.user.name} - {reg.user.email}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="award_type">Award Type</Label>
                        <Select
                          value={awardType}
                          onValueChange={(value: 'winner' | 'runner_up') => setAwardType(value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="winner">
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-600" />
                                Winner
                              </div>
                            </SelectItem>
                            <SelectItem value="runner_up">
                              <div className="flex items-center gap-2">
                                <Medal className="w-4 h-4 text-silver-600" />
                                Runner-up
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowAwardDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAssignAward}
                        disabled={assigningAward || !selectedForAward}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white"
                      >
                        {assigningAward ? 'Assigning...' : 'Assign Award'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-yellow-700 text-sm mt-2">
                Assign winners and runners-up for participants who have submitted their projects.
              </p>
            </div>
          )}

          {registrations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <p className="text-gray-500">No registrations found for this event.</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedAttendees.length === canSelectForScreening.length && canSelectForScreening.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAttendees(canSelectForScreening.map(r => r.id));
                          } else {
                            setSelectedAttendees([]);
                          }
                        }}
                      />
                    </TableHead>                    <TableHead>So. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Screening Status</TableHead>
                    <TableHead>Test Score</TableHead>
                    <TableHead>Presentation Status</TableHead>
                    <TableHead>Award Status</TableHead>
                    <TableHead>Project Links</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((reg, idx) => (
                    <TableRow key={reg.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedAttendees.includes(reg.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedAttendees(prev => [...prev, reg.id]);
                            } else {
                              setSelectedAttendees(prev => prev.filter(id => id !== reg.id));
                            }
                          }}
                          disabled={!reg.attended || (reg.screening_status && reg.screening_status !== 'pending')}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm text-gray-700">{idx + 1}</TableCell>
                      <TableCell className="font-medium">{reg.user?.name || "N/A"}</TableCell>
                      <TableCell>{reg.user?.email || "N/A"}</TableCell>                      <TableCell>
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
                      <TableCell>
                        <div className="text-sm">
                          {reg.payment_id ? (
                            <div>
                              <div className="text-green-600 font-medium">Paid</div>
                              <div className="text-xs text-gray-500">₹{reg.amount_paid || 0}</div>
                              {reg.order_id && <div className="text-xs text-gray-400">{reg.order_id.slice(0, 8)}...</div>}
                            </div>
                          ) : reg.amount_paid === 0 ? (
                            <span className="text-blue-600 font-medium">Free</span>
                          ) : (
                            <span className="text-red-600 font-medium">Unpaid</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(reg.registered_at)}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={reg.attended || false}
                          onCheckedChange={(checked) => updateAttendance(reg.id, checked as boolean)}
                        />
                      </TableCell>                      <TableCell>
                        <div className="space-y-1">
                          {getStatusBadge(reg.screening_status || 'pending')}
                          {reg.screening_test && (
                            <div className="text-xs text-gray-500">
                              {reg.screening_test.title}
                            </div>
                          )}
                        </div>
                      </TableCell>                      <TableCell>
                        {reg.test_attempt ? (
                          <div className="text-sm">
                            <div className={`font-medium ${reg.test_attempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                              {reg.test_attempt.score_percentage}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round((reg.test_attempt.score_percentage * reg.test_attempt.total_questions) / 100)}/{reg.test_attempt.total_questions} correct
                            </div>
                            <div className="text-xs text-gray-400">
                              {formatTime(reg.test_attempt.time_taken_seconds)}
                            </div>
                            {reg.test_attempt.tab_switches > 0 && (
                              <div className="text-xs text-orange-600">
                                {reg.test_attempt.tab_switches} tab switches
                              </div>
                            )}
                          </div>
                        ) : reg.screening_status === 'completed' ? (
                          <span className="text-gray-500 text-sm">Score N/A</span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reg.presentation_status || 'pending')}
                      </TableCell>
                      <TableCell>
                        {reg.award_type ? (
                          <div className="flex items-center gap-2">
                            {reg.award_type === 'winner' ? (
                              <>
                                <Trophy className="w-4 h-4 text-yellow-600" />
                                <span className="text-yellow-600 font-semibold">Winner</span>
                              </>
                            ) : (
                              <>
                                <Medal className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600 font-semibold">Runner-up</span>
                              </>
                            )}
                            <Button
                              onClick={() => handleRemoveAward(reg.id)}
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              title="Remove award"
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No award</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {reg.github_link || reg.deployment_link || reg.presentation_link ? (
                          <div className="space-y-1">
                            {reg.github_link && (
                              <div>
                                <a
                                  href={reg.github_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {reg.deployment_link && (
                              <div>
                                <a
                                  href={reg.deployment_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  Live Demo <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            {reg.presentation_link && (
                              <div>
                                <a
                                  href={reg.presentation_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  Presentation <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}                            {reg.presentation_notes && (
                              <div className="text-xs text-gray-600">
                                <button
                                  onClick={() => handleShowNotes(reg.presentation_notes!)}
                                  className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                                  title="Click to view full notes"
                                >
                                  Notes: {reg.presentation_notes.substring(0, 30)}...
                                </button>
                              </div>
                            )}
                          </div>                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => handleShowMemberDetail(reg)}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>            </div>
          )}
        </>
      )}

      {/* Member Details Dialog */}
      <Dialog open={showMemberDetailDialog} onOpenChange={setShowMemberDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Complete Member Information</DialogTitle>
            <DialogDescription>
              Comprehensive details for {selectedMember?.user?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="mt-4 max-h-[75vh] overflow-y-auto space-y-6">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Name</Label>
                    <p className="text-sm text-gray-900">{selectedMember.user.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm text-gray-900">{selectedMember.user.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">LinkedIn</Label>
                    {selectedMember.user.linkedin ? (
                      <a 
                        href={selectedMember.user.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        View Profile <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500">Not provided</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Registration Date</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedMember.registered_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Status</Label>
                    <p className={`text-sm font-medium ${
                      selectedMember.payment_id ? 'text-green-600' : 
                      selectedMember.amount_paid === 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      {selectedMember.payment_id ? 'Paid' : 
                       selectedMember.amount_paid === 0 ? 'Free Event' : 'Unpaid'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amount</Label>
                    <p className="text-sm text-gray-900">₹{selectedMember.amount_paid || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment ID</Label>
                    <p className="text-sm text-gray-900">{selectedMember.payment_id || 'N/A'}</p>
                  </div>
                  {selectedMember.order_id && (
                    <div className="col-span-3">
                      <Label className="text-sm font-medium text-gray-700">Order ID</Label>
                      <p className="text-sm text-gray-900 font-mono">{selectedMember.order_id}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Screening Test Information */}
              {selectedMember.screening_test && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Screening Test Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Test Title</Label>
                        <p className="text-sm text-gray-900">{selectedMember.screening_test.title}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(selectedMember.screening_status || 'pending')}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Total Questions</Label>
                        <p className="text-sm text-gray-900">{selectedMember.screening_test.total_questions}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Time Limit</Label>
                        <p className="text-sm text-gray-900">{selectedMember.screening_test.timer_minutes} minutes</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Passing Score</Label>
                        <p className="text-sm text-gray-900">{selectedMember.screening_test.passing_score}%</p>
                      </div>
                      {selectedMember.screening_test.deadline && (
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Deadline</Label>
                          <p className="text-sm text-gray-900">{formatDate(selectedMember.screening_test.deadline)}</p>
                        </div>
                      )}
                    </div>
                    {selectedMember.screening_test.mcq_link && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">External Test Link</Label>
                        <a 
                          href={selectedMember.screening_test.mcq_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Open Test <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Test Attempt Results */}
              {selectedMember.test_attempt && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Latest Test Attempt</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Score</Label>
                        <p className={`text-lg font-bold ${
                          selectedMember.test_attempt.passed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedMember.test_attempt.score_percentage}% 
                          {selectedMember.test_attempt.passed ? ' (PASS)' : ' (FAIL)'}
                        </p>                        <p className="text-sm text-gray-500">
                          {Math.round((selectedMember.test_attempt.score_percentage * selectedMember.test_attempt.total_questions) / 100)}/{selectedMember.test_attempt.total_questions} correct
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Time Taken</Label>
                        <p className="text-sm text-gray-900">{formatTime(selectedMember.test_attempt.time_taken_seconds)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Tab Switches</Label>
                        <p className={`text-sm font-medium ${
                          selectedMember.test_attempt.tab_switches > 0 ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {selectedMember.test_attempt.tab_switches}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Started At</Label>
                        <p className="text-sm text-gray-900">{formatDate(selectedMember.test_attempt.started_at)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Submitted At</Label>
                        <p className="text-sm text-gray-900">{formatDate(selectedMember.test_attempt.submitted_at)}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <p className="text-sm text-gray-900 capitalize">{selectedMember.test_attempt.status.replace('_', ' ')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* All Test Attempts */}
              {selectedMember.all_test_attempts && selectedMember.all_test_attempts.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">All Test Attempts ({selectedMember.all_test_attempts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedMember.all_test_attempts.map((attempt, index) => (
                        <div key={attempt.id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-sm">Attempt #{index + 1}</h4>
                            <span className={`text-sm font-medium ${
                              attempt.score_percentage && attempt.score_percentage >= (selectedMember.screening_test?.passing_score || 70) 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {attempt.score_percentage}%
                            </span>
                          </div>                          <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
                            <div>Score: {Math.round((attempt.score_percentage * attempt.total_questions) / 100)}/{attempt.total_questions}</div>
                            <div>Time: {formatTime(attempt.time_taken_seconds)}</div>
                            <div>Tabs: {attempt.tab_switches}</div>
                            <div>Status: {attempt.status}</div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Started: {formatDate(attempt.started_at)} | 
                            {attempt.submitted_at && ` Submitted: ${formatDate(attempt.submitted_at)}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Project Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Submission</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Presentation Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedMember.presentation_status || 'pending')}
                    </div>
                  </div>
                  
                  {(selectedMember.github_link || selectedMember.deployment_link || selectedMember.presentation_link) && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Project Links</Label>
                      <div className="space-y-2">
                        {selectedMember.github_link && (
                          <div>
                            <Label className="text-xs text-gray-600">GitHub Repository</Label>
                            <a
                              href={selectedMember.github_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-blue-600 hover:underline flex items-center gap-1"
                            >
                              {selectedMember.github_link} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {selectedMember.deployment_link && (
                          <div>
                            <Label className="text-xs text-gray-600">Live Demo</Label>
                            <a
                              href={selectedMember.deployment_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-green-600 hover:underline flex items-center gap-1"
                            >
                              {selectedMember.deployment_link} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        {selectedMember.presentation_link && (
                          <div>
                            <Label className="text-xs text-gray-600">Presentation</Label>
                            <a
                              href={selectedMember.presentation_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-sm text-purple-600 hover:underline flex items-center gap-1"
                            >
                              {selectedMember.presentation_link} <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedMember.presentation_notes && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Presentation Notes</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {selectedMember.presentation_notes}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Award Information */}
              {selectedMember.award_type && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Award Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Award Type</Label>
                        <div className="flex items-center gap-2 mt-1">
                          {selectedMember.award_type === 'winner' ? (
                            <>
                              <Trophy className="w-5 h-5 text-yellow-600" />
                              <span className="text-yellow-600 font-semibold">Winner</span>
                            </>
                          ) : (
                            <>
                              <Medal className="w-5 h-5 text-gray-600" />
                              <span className="text-gray-600 font-semibold">Runner-up</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Assigned At</Label>
                        <p className="text-sm text-gray-900">{selectedMember.award_assigned_at ? formatDate(selectedMember.award_assigned_at) : 'N/A'}</p>
                      </div>
                    </div>
                    {selectedMember.award_assigned_by_admin && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Assigned By</Label>
                        <p className="text-sm text-gray-900">
                          {selectedMember.award_assigned_by_admin.name} ({selectedMember.award_assigned_by_admin.email})
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Event Participation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Event Participation</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Attendance Status</Label>
                    <p className={`text-sm font-medium ${selectedMember.attended ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedMember.attended ? 'Attended' : 'Not Attended'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">User ID</Label>
                    <p className="text-sm text-gray-900 font-mono">{selectedMember.user_id}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowMemberDetailDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notes Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Presentation Notes</DialogTitle>
            <DialogDescription>
              Full notes content for the presentation
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            <div className="whitespace-pre-wrap text-sm text-gray-700 p-4 bg-gray-50 rounded-lg">
              {selectedNotes || "No notes available."}
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowNotesDialog(false)}
              variant="outline"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>      </Dialog>

      {/* MCQ Test Creator Dialog */}
      <Dialog open={showMCQCreator} onOpenChange={setShowMCQCreator}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create MCQ Screening Test</DialogTitle>
            <DialogDescription>
              Create an integrated MCQ test for selected attendees ({selectedAttendees.length} selected)
            </DialogDescription>
          </DialogHeader>          <MCQTestCreator
            eventId={eventId || ''}
            existingTest={screeningTest ? {
              id: screeningTest.id,
              title: screeningTest.title,
              instructions: screeningTest.instructions,
              timer_minutes: screeningTest.timer_minutes || 30,
              passing_score: screeningTest.passing_score || 70,
              questions: screeningTest.questions || []
            } : null}
            onSave={handleSaveMCQTest}
            isSubmitting={submittingScreening}
            mode={screeningTest ? 'edit' : 'create'}
          />        </DialogContent>
      </Dialog>

      {/* MCQ Test Sender Dialog */}
      <Dialog open={showMCQSender} onOpenChange={setShowMCQSender}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send MCQ Test to Participants</DialogTitle>
            <DialogDescription>
              Review and send the saved MCQ test to selected attendees ({selectedAttendees.length} selected)
            </DialogDescription>
          </DialogHeader>
          
          {screeningTest && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Test Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Title:</span> {screeningTest.title || 'Screening Test'}
                  </div>
                  <div>
                    <span className="font-medium">Questions:</span> {screeningTest.questions?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Time Limit:</span> {screeningTest.timer_minutes || 30} minutes
                  </div>
                  <div>
                    <span className="font-medium">Passing Score:</span> {screeningTest.passing_score || 70}%
                  </div>
                </div>
                <div className="mt-3">
                  <span className="font-medium">Instructions:</span>
                  <p className="text-gray-700 mt-1">{screeningTest.instructions}</p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Participants ({selectedAttendees.length})</h4>
                <div className="text-sm text-blue-800">
                  {registrations
                    .filter(reg => selectedAttendees.includes(reg.id))
                    .map(reg => reg.user.name)
                    .join(', ')
                  }
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowMCQSender(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => screeningTest && handleSendMCQTest(screeningTest.id)}
              disabled={submittingScreening || selectedAttendees.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingScreening ? 'Sending...' : 'Send MCQ Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
