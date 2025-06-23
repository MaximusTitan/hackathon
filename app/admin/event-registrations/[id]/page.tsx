"use client";

import { useEffect, useState, useMemo } from "react";
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
import { ArrowLeft, Send, Clock, CheckCircle, FileText, Users, ExternalLink, Trophy, Medal, Filter, Search, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
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
  qualification_status?: 'pending' | 'qualified' | 'rejected' | null;
  qualification_remarks?: string | null;
  qualified_at?: string | null;
  qualified_by?: string | null;
  github_link?: string | null;
  deployment_link?: string | null;
  presentation_link?: string | null;
  presentation_notes?: string | null;  award_type?: 'winner' | 'runner_up' | null;
  award_assigned_at?: string | null;
  admin_notes?: string | null;
  admin_score?: number | null;
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
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string>('');  const [showMemberDetailDialog, setShowMemberDetailDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<EventRegistration | null>(null);
  const [updatingStartButton, setUpdatingStartButton] = useState(false);
  
  // Admin notes and scoring states
  const [showNotesEditDialog, setShowNotesEditDialog] = useState(false);
  const [showScoreEditDialog, setShowScoreEditDialog] = useState(false);
  const [editingRegistrationId, setEditingRegistrationId] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [editingScore, setEditingScore] = useState<number>(0);
  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  
  // Sorting and filtering states
  const [sortBy, setSortBy] = useState<string>('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {        // Fetch event details
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) {
          console.error("Failed to fetch event:", eventRes.status, eventRes.statusText);
          throw new Error(`Failed to fetch event: ${eventRes.status}`);
        }
        const eventData = await eventRes.json();
        setEvent(eventData.event);

        // Fetch registrations for this event
        const res = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        
        if (res.ok) {
          const data = await res.json();
          console.log("Registrations data:", data); // Debug log
          // Add default values for admin fields until database is updated
          const registrationsWithDefaults = data.registrations.map((reg: any) => ({
            ...reg,
            admin_notes: reg.admin_notes || null,
            admin_score: reg.admin_score || null
          }));
          setRegistrations(registrationsWithDefaults);
        } else {
          const data = await res.json();
          console.error("Failed to fetch registrations:", res.status, data.error);
          toast.error("Failed to fetch registrations");
        }        // Fetch existing screening test
        const screeningRes = await fetch(`/api/admin/screening-test?event_id=${eventId}`);        if (screeningRes.ok) {
          const screeningData = await screeningRes.json();
          console.log('Screening test data received:', screeningData);
          if (screeningData.screeningTest) {
            console.log('Questions in screening test:', screeningData.screeningTest.questions);
            setScreeningTest(screeningData.screeningTest);
            setScreeningForm({
              mcq_link: screeningData.screeningTest.mcq_link || '',
              instructions: screeningData.screeningTest.instructions,
              deadline: screeningData.screeningTest.deadline ? 
                new Date(screeningData.screeningTest.deadline).toISOString().slice(0, 16) : ''
            });
          }
        } else {
          console.error('Failed to fetch screening test:', await screeningRes.text());
        }} catch (error) {
        console.error("Error fetching data:", error);
        if (error instanceof Error) {
          toast.error(`Error loading data: ${error.message}`);
        } else {
          toast.error("Error loading data");
        }
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
    }  };

  const handleShowNotes = (notes: string) => {
    setSelectedNotes(notes);
    setShowNotesDialog(true);
  };
  const handleShowMemberDetail = (member: EventRegistration) => {
    setSelectedMember(member);
    setShowMemberDetailDialog(true);
  };

  const handleEditNotes = (registrationId: string, currentNotes: string) => {
    setEditingRegistrationId(registrationId);
    setEditingNotes(currentNotes);
    setShowNotesEditDialog(true);
  };

  const handleEditScore = (registrationId: string, currentScore: number) => {
    setEditingRegistrationId(registrationId);
    setEditingScore(currentScore);
    setShowScoreEditDialog(true);
  };

  const handleUpdateNotes = async () => {
    if (!editingRegistrationId) return;

    setSubmittingNotes(true);

    try {
      const res = await fetch('/api/admin/update-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: editingRegistrationId,
          admin_notes: editingNotes.trim() || null
        })
      });

      if (res.ok) {
        toast.success('Notes updated successfully');
        setShowNotesEditDialog(false);
        setEditingRegistrationId('');
        setEditingNotes('');
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update notes');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('Error updating notes');
    } finally {
      setSubmittingNotes(false);
    }
  };

  const handleUpdateScore = async () => {
    if (!editingRegistrationId) return;

    if (editingScore < 0 || editingScore > 100) {
      toast.error('Score must be between 0 and 100');
      return;
    }

    setSubmittingScore(true);

    try {
      const res = await fetch('/api/admin/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: editingRegistrationId,
          admin_score: editingScore
        })
      });

      if (res.ok) {
        toast.success('Score updated successfully');
        setShowScoreEditDialog(false);
        setEditingRegistrationId('');
        setEditingScore(0);
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Error updating score');
    } finally {
      setSubmittingScore(false);
    }  };

  const handleQualificationChange = async (registrationId: string, newStatus: 'qualified' | 'rejected' | 'pending') => {
    try {
      const res = await fetch('/api/admin/qualification-decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: registrationId,
          qualification_status: newStatus,
          qualification_remarks: null
        })
      });

      if (res.ok) {
        toast.success(`Participant marked as ${newStatus} successfully`);
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update qualification status');
      }
    } catch (error) {
      console.error('Error updating qualification status:', error);
      toast.error('Error updating qualification status');
    }
  };

  const handleAwardChange = async (registrationId: string, newAwardType: 'winner' | 'runner_up' | null) => {
    try {
      let res;
      
      if (newAwardType === null) {
        // Remove award
        res = await fetch('/api/admin/assign-award', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: registrationId })
        });
      } else {
        // Assign award
        res = await fetch('/api/admin/assign-award', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registration_id: registrationId,
            award_type: newAwardType
          })
        });
      }

      if (res.ok) {
        toast.success(newAwardType ? `Award assigned successfully` : 'Award removed successfully');
        // Refresh registrations
        const refreshRes = await fetch(`/api/admin/event-registrations?event_id=${eventId}`);
        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          setRegistrations(refreshData.registrations);
        }
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update award');
      }
    } catch (error) {
      console.error('Error updating award:', error);
      toast.error('Error updating award');
    }
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Sorting and filtering functions
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };
  // Filter and sort registrations
  const filteredAndSortedRegistrations = useMemo(() => {
    let filtered = registrations.filter(reg => {
      // Search filter
      const searchMatch = searchTerm === '' || 
        reg.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.user.email.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      let statusMatch = true;
      switch (filterStatus) {
        case 'attended':
          statusMatch = reg.attended === true;
          break;
        case 'not_attended':
          statusMatch = reg.attended === false;
          break;
        case 'paid':
          statusMatch = reg.payment_id !== null;
          break;
        case 'unpaid':
          statusMatch = reg.payment_id === null && reg.amount_paid !== 0;
          break;
        case 'free':
          statusMatch = reg.amount_paid === 0;
          break;
        case 'screening_completed':
          statusMatch = reg.screening_status === 'completed';
          break;
        case 'screening_pending':
          statusMatch = reg.screening_status === 'pending' || !reg.screening_status;
          break;        case 'presentation_submitted':
          statusMatch = reg.presentation_status === 'submitted' || reg.presentation_status === 'reviewed';
          break;
        case 'qualified':
          statusMatch = reg.qualification_status === 'qualified';
          break;
        case 'rejected':
          statusMatch = reg.qualification_status === 'rejected';
          break;
        case 'qualification_pending':
          statusMatch = (reg.presentation_status === 'submitted' || reg.presentation_status === 'reviewed') && 
                       (!reg.qualification_status || reg.qualification_status === 'pending');
          break;
        case 'winners':
          statusMatch = reg.award_type === 'winner';
          break;        case 'runners_up':
          statusMatch = reg.award_type === 'runner_up';
          break;
        case 'high_score':
          statusMatch = reg.admin_score !== null && reg.admin_score !== undefined && reg.admin_score >= 80;
          break;
        case 'no_admin_score':
          statusMatch = reg.admin_score === null || reg.admin_score === undefined;
          break;
        default:
          statusMatch = true;
      }

      return searchMatch && statusMatch;
    });

    // Sort filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.user.name.toLowerCase();
          bValue = b.user.name.toLowerCase();
          break;
        case 'email':
          aValue = a.user.email.toLowerCase();
          bValue = b.user.email.toLowerCase();
          break;
        case 'registered_at':
          aValue = new Date(a.registered_at);
          bValue = new Date(b.registered_at);
          break;
        case 'amount_paid':
          aValue = a.amount_paid || 0;
          bValue = b.amount_paid || 0;
          break;        case 'test_score':
          aValue = a.test_attempt?.score_percentage || -1;
          bValue = b.test_attempt?.score_percentage || -1;
          break;
        case 'admin_score':
          aValue = a.admin_score ?? -1;
          bValue = b.admin_score ?? -1;
          break;
        case 'attended':
          aValue = a.attended ? 1 : 0;
          bValue = b.attended ? 1 : 0;
          break;
        default:
          aValue = a.registered_at;
          bValue = b.registered_at;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [registrations, searchTerm, filterStatus, sortBy, sortOrder]);

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
  };  const attendedRegistrations = registrations.filter(reg => reg.attended);
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
  };  return (
    <div className="w-full min-h-screen px-4 py-6">
      <div className="w-full mx-auto">{/* Use full width instead of max-w-7xl */}
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
        </div>      )}
      
      {loading ? (
        <div className="text-center py-12">Loading registrations...</div>
      ) : (
        <>          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filter Dropdown */}
                <div className="flex gap-2">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Participants</SelectItem>
                      <SelectItem value="attended">Attended</SelectItem>
                      <SelectItem value="not_attended">Not Attended</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="unpaid">Unpaid</SelectItem>
                      <SelectItem value="free">Free Event</SelectItem>
                      <SelectItem value="screening_completed">Screening Completed</SelectItem>                      <SelectItem value="screening_pending">Screening Pending</SelectItem>
                      <SelectItem value="presentation_submitted">Presentation Submitted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>                      <SelectItem value="qualification_pending">Qualification Pending</SelectItem>
                      <SelectItem value="winners">Winners</SelectItem>
                      <SelectItem value="runners_up">Runners-up</SelectItem>
                      <SelectItem value="high_score">High Admin Score (80+)</SelectItem>
                      <SelectItem value="no_admin_score">No Admin Score</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                      setSortBy('registered_at');
                      setSortOrder('desc');
                    }}
                    className="whitespace-nowrap"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Results Count */}
              <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                Showing <span className="font-semibold">{filteredAndSortedRegistrations.length}</span> of <span className="font-semibold">{registrations.length}</span> participants
                {(searchTerm || filterStatus !== 'all') && (
                  <span className="text-blue-600 ml-2">(filtered)</span>
                )}
              </div>
            </div>
          </div>          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>              <CardContent>
                <div className="text-2xl font-bold">{filteredAndSortedRegistrations.length}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {registrations.length !== filteredAndSortedRegistrations.length && `(${registrations.length} total)`}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Attended</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {filteredAndSortedRegistrations.filter(r => r.attended).length}
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
                  {filteredAndSortedRegistrations.filter(r => r.screening_status === 'completed' || r.screening_status === 'skipped').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Projects Submitted</CardTitle>
                <Send className="h-4 w-4 text-purple-600" />
              </CardHeader>              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {filteredAndSortedRegistrations.filter(r => r.presentation_status === 'submitted' || r.presentation_status === 'reviewed').length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Qualified</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {filteredAndSortedRegistrations.filter(r => r.qualification_status === 'qualified').length}
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
                  {filteredAndSortedRegistrations.filter(r => r.award_type === 'winner').length}
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
                  {filteredAndSortedRegistrations.filter(r => r.award_type === 'runner_up').length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          {attendedRegistrations.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-3">Screening Test Management</h3>              <div className="flex flex-wrap gap-3">                <Button 
                  onClick={() => setShowMCQCreator(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={canSelectForScreening.length === 0}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0)
                    ? 'Edit MCQ Test' 
                    : 'Create MCQ Test'
                  }
                </Button>

                {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0) && (
                  <Button 
                    onClick={() => setShowMCQSender(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={canSelectForScreening.length === 0 || selectedAttendees.length === 0}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Send MCQ Test ({screeningTest.total_questions || screeningTest.questions?.length || 0} questions)
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
                {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0)
                  ? 'First select participants, then click "Send MCQ Test" to distribute the saved test. You can also edit the existing test or create external test links.'
                  : 'Select attendees from the table below to create an integrated MCQ test or send external test links.'
                }
              </p>            </div>
          )}

          {filteredAndSortedRegistrations.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              {searchTerm || filterStatus !== 'all' ? (
                <>
                  <p className="text-gray-500 mb-4">No participants match your current filters.</p>
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    variant="outline"
                  >
                    Clear Filters
                  </Button>
                </>
              ) : (
                <p className="text-gray-500">No registrations found for this event.</p>
              )}
            </div>          ) : (
            <>
              {/* Info Section */}
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm">
                  <strong>Qualification & Awards:</strong> Use the dropdown menus in the table to manage project qualifications and assign awards. 
                  Awards can only be assigned to qualified participants.
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <Table className="w-full min-w-[1700px]">{/* Ensure minimum table width for all columns */}
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
                      <TableHead className="w-16">So. No.</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[120px]"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Name {getSortIcon('name')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[200px]"
                        onClick={() => handleSort('email')}
                      >
                        <div className="flex items-center gap-1">
                          Email {getSortIcon('email')}
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[100px]">LinkedIn</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[100px]"
                        onClick={() => handleSort('amount_paid')}
                      >
                        <div className="flex items-center gap-1">
                          Payment {getSortIcon('amount_paid')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[140px]"
                        onClick={() => handleSort('registered_at')}
                      >
                        <div className="flex items-center gap-1">
                          Registered On {getSortIcon('registered_at')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[80px]"
                        onClick={() => handleSort('attended')}
                      >
                        <div className="flex items-center gap-1">
                          Attended {getSortIcon('attended')}
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[120px]">Screening Status</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[100px]"
                        onClick={() => handleSort('test_score')}
                      >
                        <div className="flex items-center gap-1">
                          Test Score {getSortIcon('test_score')}
                        </div>
                      </TableHead>                      <TableHead className="min-w-[120px]">Project Status</TableHead>
                      <TableHead className="min-w-[120px]">Qualification Status</TableHead>                      <TableHead className="min-w-[100px]">Award Status</TableHead>
                      <TableHead className="min-w-[150px]">Admin Notes</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50 select-none min-w-[100px]"
                        onClick={() => handleSort('admin_score')}
                      >
                        <div className="flex items-center gap-1">
                          Admin Score {getSortIcon('admin_score')}
                        </div>
                      </TableHead>
                      <TableHead className="min-w-[120px]">Project Links</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedRegistrations.map((reg, idx) => (
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
                      </TableCell>                      <TableCell>
                        {getStatusBadge(reg.presentation_status || 'pending')}
                      </TableCell>                      <TableCell>
                        <div className="min-w-[140px]">
                          {(reg.presentation_status === 'submitted' || reg.presentation_status === 'reviewed') ? (
                            <Select
                              value={reg.qualification_status || 'pending'}
                              onValueChange={(value: 'qualified' | 'rejected' | 'pending') => 
                                handleQualificationChange(reg.id, value)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-yellow-600" />
                                    <span className="text-yellow-600">Pending</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="qualified">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                                    <span className="text-emerald-600">Qualified</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="rejected">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-red-600" />
                                    <span className="text-red-600">Rejected</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-400 text-sm">No Project</span>
                            </div>
                          )}
                        </div>
                      </TableCell>                      <TableCell>
                        <div className="min-w-[120px]">
                          {reg.qualification_status === 'qualified' ? (
                            <Select
                              value={reg.award_type || 'none'}
                              onValueChange={(value: 'winner' | 'runner_up' | 'none') => 
                                handleAwardChange(reg.id, value === 'none' ? null : value)
                              }
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-gray-400">No Award</span>
                                </SelectItem>
                                <SelectItem value="winner">
                                  <div className="flex items-center gap-2">
                                    <Trophy className="w-3 h-3 text-yellow-600" />
                                    <span className="text-yellow-600">Winner</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="runner_up">
                                  <div className="flex items-center gap-2">
                                    <Medal className="w-3 h-3 text-gray-600" />
                                    <span className="text-gray-600">Runner-up</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              {reg.qualification_status === 'rejected' ? 'Not Qualified' : 'Pending Qualification'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[140px]">
                          {reg.admin_notes ? (
                            <div className="text-sm">
                              <p className="text-gray-700 truncate" title={reg.admin_notes}>
                                {reg.admin_notes.length > 30 ? `${reg.admin_notes.substring(0, 30)}...` : reg.admin_notes}
                              </p>
                              <Button
                                onClick={() => handleEditNotes(reg.id, reg.admin_notes || '')}
                                variant="ghost"
                                size="sm"
                                className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                              >
                                Edit
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEditNotes(reg.id, '')}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Add Notes
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-[80px]">
                          {reg.admin_score !== null && reg.admin_score !== undefined ? (
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${
                                reg.admin_score >= 70 ? 'text-green-600' : 
                                reg.admin_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {reg.admin_score}/100
                              </span>
                              <Button
                                onClick={() => handleEditScore(reg.id, reg.admin_score || 0)}
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                                title="Edit score"
                              >
                                ✏️
                              </Button>
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleEditScore(reg.id, 0)}
                              variant="ghost"
                              size="sm"
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Add Score
                            </Button>
                          )}
                        </div>
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
                    </TableRow>                  ))}                </TableBody>
              </Table>
              </div>
            </div>
            </>
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
                    <Label className="text-sm font-medium text-gray-700">Project Status</Label>
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
                  )}                </CardContent>
              </Card>

              {/* Admin Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Admin Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Admin Score</Label>
                      {selectedMember.admin_score !== null && selectedMember.admin_score !== undefined ? (
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-medium ${
                            selectedMember.admin_score >= 70 ? 'text-green-600' : 
                            selectedMember.admin_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedMember.admin_score}/100
                          </span>
                          <Button
                            onClick={() => handleEditScore(selectedMember.id, selectedMember.admin_score || 0)}
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                          >
                            Edit
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-1">
                          <Button
                            onClick={() => handleEditScore(selectedMember.id, 0)}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Add Score
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Overall Rating</Label>
                      <div className="mt-1">
                        {selectedMember.admin_score !== null && selectedMember.admin_score !== undefined ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedMember.admin_score >= 80 ? 'bg-green-100 text-green-800' : 
                            selectedMember.admin_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                            selectedMember.admin_score >= 40 ? 'bg-orange-100 text-orange-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {selectedMember.admin_score >= 80 ? 'Excellent' : 
                             selectedMember.admin_score >= 60 ? 'Good' : 
                             selectedMember.admin_score >= 40 ? 'Average' : 'Needs Improvement'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">Not rated</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Admin Notes</Label>
                    {selectedMember.admin_notes ? (
                      <div className="mt-1">
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {selectedMember.admin_notes}
                        </div>
                        <Button
                          onClick={() => handleEditNotes(selectedMember.id, selectedMember.admin_notes || '')}
                          variant="outline"
                          size="sm"
                          className="mt-2 text-xs"
                        >
                          Edit Notes
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-1">
                        <p className="text-sm text-gray-500 mb-2">No admin notes available</p>
                        <Button
                          onClick={() => handleEditNotes(selectedMember.id, '')}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          Add Notes
                        </Button>
                      </div>
                    )}
                  </div>
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
        </DialogContent>
      </Dialog>

      {/* Admin Notes Edit Dialog */}
      <Dialog open={showNotesEditDialog} onOpenChange={setShowNotesEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Admin Notes</DialogTitle>
            <DialogDescription>
              Add or update admin notes for this participant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin_notes">Admin Notes</Label>
              <Textarea
                id="admin_notes"
                value={editingNotes}
                onChange={(e) => setEditingNotes(e.target.value)}
                placeholder="Add notes about this participant's performance, behavior, or any other relevant information..."
                rows={6}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowNotesEditDialog(false);
                setEditingRegistrationId('');
                setEditingNotes('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNotes}
              disabled={submittingNotes}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingNotes ? 'Saving...' : 'Save Notes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Score Edit Dialog */}
      <Dialog open={showScoreEditDialog} onOpenChange={setShowScoreEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Admin Score</DialogTitle>
            <DialogDescription>
              Set a score for this participant (0-100)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin_score">Score (0-100)</Label>
              <Input
                id="admin_score"
                type="number"
                min="0"
                max="100"
                value={editingScore}
                onChange={(e) => setEditingScore(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-sm text-gray-600 mt-1">
                This score is separate from the screening test score and can be used for overall evaluation.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowScoreEditDialog(false);
                setEditingRegistrationId('');
                setEditingScore(0);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateScore}
              disabled={submittingScore}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {submittingScore ? 'Saving...' : 'Save Score'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              questions: Array.isArray(screeningTest.questions) ? screeningTest.questions : []
            } : null}
            onSave={handleSaveMCQTest}
            isSubmitting={submittingScreening}
            mode={screeningTest ? 'edit' : 'create'}
          /></DialogContent>
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
                  </div>                  <div>
                    <span className="font-medium">Questions:</span> {screeningTest.total_questions || screeningTest.questions?.length || 0}
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
        </DialogContent>      </Dialog>
      </div>
    </div>
  );
}
