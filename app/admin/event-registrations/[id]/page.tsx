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
};

type ScreeningTest = {
  id: string;
  event_id: string;
  mcq_link: string;
  instructions: string;
  deadline: string | null;
  is_active: boolean;
};

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<{ title: string } | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [screeningTest, setScreeningTest] = useState<ScreeningTest | null>(null);
  const [showScreeningDialog, setShowScreeningDialog] = useState(false);
  const [screeningForm, setScreeningForm] = useState({
    mcq_link: '',
    instructions: 'Please complete this screening test within the given deadline.',
    deadline: ''
  });
  const [submittingScreening, setSubmittingScreening] = useState(false);
  const [showAwardDialog, setShowAwardDialog] = useState(false);
  const [selectedForAward, setSelectedForAward] = useState<string>('');
  const [awardType, setAwardType] = useState<'winner' | 'runner_up'>('winner');
  const [assigningAward, setAssigningAward] = useState(false);
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
        const screeningRes = await fetch(`/api/admin/screening-test?event_id=${eventId}`);
        if (screeningRes.ok) {
          const screeningData = await screeningRes.json();
          if (screeningData.screeningTest) {
            setScreeningTest(screeningData.screeningTest);
            setScreeningForm({
              mcq_link: screeningData.screeningTest.mcq_link,
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
              <h3 className="font-semibold text-blue-900 mb-3">Screening Test Management</h3>
              <div className="flex flex-wrap gap-3">
                <Dialog open={showScreeningDialog} onOpenChange={setShowScreeningDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={canSelectForScreening.length === 0}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Screening Test
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
              </div>
              <p className="text-blue-700 text-sm mt-2">
                Select attendees from the table below to send screening tests or skip the screening step.
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
                    </TableHead>
                    <TableHead>So. No.</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>LinkedIn</TableHead>
                    <TableHead>Registered On</TableHead>
                    <TableHead>Attended</TableHead>
                    <TableHead>Screening Status</TableHead>
                    <TableHead>Presentation Status</TableHead>
                    <TableHead>Award Status</TableHead>
                    <TableHead>Project Links</TableHead>
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
                      <TableCell>
                        <Checkbox
                          checked={reg.attended || false}
                          onCheckedChange={(checked) => updateAttendance(reg.id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(reg.screening_status || 'pending')}
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
                            )}
                            {reg.presentation_notes && (
                              <div className="text-xs text-gray-600" title={reg.presentation_notes}>
                                Notes: {reg.presentation_notes.substring(0, 30)}...
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
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
