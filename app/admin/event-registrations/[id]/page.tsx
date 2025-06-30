"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  EventHeader,
  EventControlsPanel,
  SearchAndFilters,
  SummaryCards,
  AttendanceManagement,
  ScreeningTestManagement,
  RegistrationsTable,
  MemberDetailDialog,
  NotesEditDialog,
  ScoreEditDialog,
  NotesViewDialog,
  MCQCreatorDialog,
  MCQSenderDialog,
  Pagination,
  ExportButton
} from "@/components/admin/event-registrations";
import type {
  Event,
  EventRegistration,
  ScreeningTest
} from "@/types/event";

// Helper functions
const formatTime = (seconds: number) => {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// Add debounce hook
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function EventRegistrationsPage() {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const router = useRouter();

  // State
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Add total count for server-side pagination
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [screeningTest, setScreeningTest] = useState<ScreeningTest | null>(null);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);

  // Dialog states
  const [showScreeningDialog, setShowScreeningDialog] = useState(false);
  const [showMCQCreator, setShowMCQCreator] = useState(false);
  const [showMCQSender, setShowMCQSender] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [showMemberDetailDialog, setShowMemberDetailDialog] = useState(false);
  const [showNotesEditDialog, setShowNotesEditDialog] = useState(false);
  const [showScoreEditDialog, setShowScoreEditDialog] = useState(false);

  // Form states
  const [screeningForm, setScreeningForm] = useState({
    mcq_link: '',
    instructions: 'Please complete this screening test within the given deadline.',
    deadline: ''
  });

  // Editing states
  const [selectedMember, setSelectedMember] = useState<EventRegistration | null>(null);
  const [editingRegistrationId, setEditingRegistrationId] = useState<string>('');
  const [editingNotes, setEditingNotes] = useState<string>('');
  const [editingScore, setEditingScore] = useState<number>(0);
  const [selectedNotes, setSelectedNotes] = useState<string>('');

  // Loading states
  const [updatingStartButton, setUpdatingStartButton] = useState(false);
  const [submittingScreening, setSubmittingScreening] = useState(false);
  const [submittingNotes, setSubmittingNotes] = useState(false);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [updatingBulkAttendance, setUpdatingBulkAttendance] = useState(false);
  const [exportData, setExportData] = useState<EventRegistration[]>([]);

  // Table sorting/filtering state
  const [sortBy, setSortBy] = useState<string>('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Data fetching with server-side pagination
  useEffect(() => {
    async function fetchData() {
      try {
        const eventRes = await fetch(`/api/events/${eventId}`);
        if (!eventRes.ok) throw new Error(`Failed to fetch event: ${eventRes.status}`);
        const eventData = await eventRes.json();
        setEvent(eventData.event);

        // Server-side pagination - only fetch current page
        const res = await fetch(
          `/api/admin/event-registrations?event_id=${eventId}&page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchTerm)}&filter=${filterStatus}&sort=${sortBy}&order=${sortOrder}`
        );
        if (res.ok) {
          const data = await res.json();
          const registrationsWithDefaults = data.registrations.map((reg: any) => ({
            ...reg,
            admin_notes: reg.admin_notes || null,
            admin_score: reg.admin_score || null
          }));
          setRegistrations(registrationsWithDefaults);
          // Update total count from server response
          setTotalCount(data.totalCount);
        } else {
          const data = await res.json();
          console.error("Failed to fetch registrations:", res.status, data.error);
          toast.error("Failed to fetch registrations");
        }

        const screeningRes = await fetch(`/api/admin/screening-test?event_id=${eventId}`);
        if (screeningRes.ok) {
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
        toast.error(error instanceof Error ? error.message : "Error loading data");
      } finally {
        setLoading(false);
      }
    }

    if (eventId) {
      fetchData();
    }
  }, [eventId, currentPage, itemsPerPage, debouncedSearchTerm, filterStatus, sortBy, sortOrder]);

  // Handler functions
  const updateAttendance = async (registrationId: string, attended: boolean) => {
    try {
      const res = await fetch(`/api/admin/event-registrations/${registrationId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attended })
      });

      if (res.ok) {
        setRegistrations(prev => prev.map(reg => reg.id === registrationId ? { ...reg, attended } : reg));
        toast.success(`Attendance ${attended ? 'marked' : 'unmarked'} successfully`);
      } else {
        toast.error('Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Error updating attendance');
    }
  };

  const markAllAsAttended = async () => {
    const unattendedRegistrations = registrations.filter(reg => !reg.attended);
    if (unattendedRegistrations.length === 0) {
      toast.info('All participants are already marked as attended');
      return;
    }

    setUpdatingBulkAttendance(true);
    try {
      const updatePromises = unattendedRegistrations.map(reg =>
        fetch(`/api/admin/event-registrations/${reg.id}/attendance`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attended: true })
        })
      );

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      if (successful > 0) {
        setRegistrations(prev => prev.map(reg => ({ ...reg, attended: true })));
        toast.success(`Successfully marked ${successful} participants as attended`);
      }
      if (failed > 0) {
        toast.error(`Failed to update ${failed} attendance records`);
      }
    } catch (error) {
      console.error('Error updating bulk attendance:', error);
      toast.error('Error updating attendance');
    } finally {
      setUpdatingBulkAttendance(false);
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
        await refreshRegistrations();
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
        body: JSON.stringify({ registration_ids: selectedAttendees })
      });

      if (res.ok) {
        toast.success('Screening skipped for selected attendees');
        setSelectedAttendees([]);
        await refreshRegistrations();
      } else {
        toast.error('Failed to skip screening');
      }
    } catch (error) {
      console.error('Error skipping screening:', error);
      toast.error('Error skipping screening');
    }
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
        await refreshRegistrations();
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
        await refreshRegistrations();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update score');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Error updating score');
    } finally {
      setSubmittingScore(false);
    }
  };

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
        await refreshRegistrations();
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
        res = await fetch('/api/admin/assign-award', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registration_id: registrationId })
        });
      } else {
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
        toast.success(newAwardType ? 'Award assigned successfully' : 'Award removed successfully');
        await refreshRegistrations();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to update award');
      }
    } catch (error) {
      console.error('Error updating award:', error);
      toast.error('Error updating award');
    }
  };

  const handleToggleStartButton = async () => {
    if (!event) return;
    
    setUpdatingStartButton(true);
    try {
      const res = await fetch(`/api/events/${eventId}/toggle-start-button`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show_start_button: !event.show_start_button })
      });

      if (res.ok) {
        setEvent(prev => prev ? { ...prev, show_start_button: !prev.show_start_button } : null);
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
  };

  const handleSaveMCQTest = async (testData: any) => {
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
        toast.success('MCQ test sent successfully');
        setShowMCQSender(false);
        setSelectedAttendees([]);
        await refreshRegistrations();
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

  // Utility functions
  const refreshRegistrations = async () => {
    const res = await fetch(
      `/api/admin/event-registrations?event_id=${eventId}&page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(debouncedSearchTerm)}&filter=${filterStatus}&sort=${sortBy}&order=${sortOrder}`
    );
    if (res.ok) {
      const data = await res.json();
      setRegistrations(data.registrations);
      setTotalCount(data.totalCount);
    }
  };

  const handleExport = async () => {
    if (!eventId) return;
    
    try {
      // Fetch all registrations for export using dedicated export endpoint
      const res = await fetch(
        `/api/admin/event-registrations/export?event_id=${eventId}&search=${encodeURIComponent(debouncedSearchTerm)}&filter=${filterStatus}&sort=${sortBy}&order=${sortOrder}`
      );
      
      if (res.ok) {
        const data = await res.json();
        setExportData(data.registrations);
        toast.success(`Fetched ${data.registrations.length} registrations for export`);
      } else {
        toast.error('Failed to fetch export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Error exporting data');
    }
  };

  // Clear export data after export is complete
  useEffect(() => {
    if (exportData.length > 0) {
      const timer = setTimeout(() => {
        setExportData([]);
      }, 3000); // Clear after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [exportData]);

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
      case 'sent':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Sent</span>;
      case 'skipped':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Skipped</span>;
      case 'submitted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Submitted</span>;
      case 'reviewed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Reviewed</span>;
      case 'qualified':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Qualified</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  // Pagination computation for server-side pagination
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, filterStatus, sortBy, sortOrder]);

  return (
    <div className="w-full min-h-screen px-4 py-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <EventHeader
          eventTitle={event?.title}
        />

        {loading ? (
          <div className="text-center py-12">Loading registrations...</div>
        ) : (
          <>
            {/* Event Controls */}
            {event && (
              <EventControlsPanel
                event={event}
                updatingStartButton={updatingStartButton}
                onToggleStartButton={handleToggleStartButton}
              />
            )}

            {/* Search and Filters */}
            <SearchAndFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterStatus={filterStatus}
              onFilterChange={setFilterStatus}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(!showFilters)}
              onClearFilters={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setSortBy('registered_at');
                setSortOrder('desc');
              }}
              filteredCount={totalCount}
              totalCount={totalCount}
              registrations={registrations}
              eventTitle={event?.title}
              onExport={handleExport}
              exportData={exportData}
            />

            {/* Summary Cards */}
            <SummaryCards
              registrations={registrations}
            />

            {/* Attendance Management */}
            {totalCount > 0 && (
              <AttendanceManagement
                unattendedCount={registrations.filter(reg => !reg.attended).length}
                updatingBulkAttendance={updatingBulkAttendance}
                onMarkAllAsAttended={markAllAsAttended}
              />
            )}

            {/* Screening Test Management */}
            {registrations.filter(reg => reg.attended).length > 0 && (
              <ScreeningTestManagement
                screeningTest={screeningTest}
                selectedAttendeesCount={selectedAttendees.length}
                eligibleCount={registrations.filter(reg => 
                  reg.attended && (reg.screening_status === 'pending' || !reg.screening_status)
                ).length}
                onCreateTest={() => setShowMCQCreator(true)}
                onSendTest={() => setShowMCQSender(true)}
                onSendExternalTest={() => setShowScreeningDialog(true)}
                onSkipScreening={handleSkipScreening}
                submitting={submittingScreening}
              />
            )}

            {/* Registrations Table */}
            {registrations.length > 0 && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <RegistrationsTable
                  registrations={registrations}
                  selectedRegistrationIds={selectedAttendees}
                  sortBy={sortBy}
                  sortOrder={sortOrder}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onSort={(column: string) => {
                    if (sortBy === column) {
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    } else {
                      setSortBy(column);
                      setSortOrder('asc');
                    }
                  }}
                  onUpdateAttendance={updateAttendance}
                  onUpdateQualification={handleQualificationChange}
                  onUpdateAward={handleAwardChange}
                  onUpdateNotes={(regId: string, notes: string) => {
                    setEditingRegistrationId(regId);
                    setEditingNotes(notes);
                    setShowNotesEditDialog(true);
                  }}
                  onUpdateScore={(regId: string, score: number) => {
                    setEditingRegistrationId(regId);
                    setEditingScore(score);
                    setShowScoreEditDialog(true);
                  }}
                  onSelect={(regId: string, selected: boolean) => {
                    if (selected) {
                      setSelectedAttendees(prev => [...prev, regId]);
                    } else {
                      setSelectedAttendees(prev => prev.filter(id => id !== regId));
                    }
                  }}
                  onViewDetails={(member: EventRegistration) => {
                    setSelectedMember(member);
                    setShowMemberDetailDialog(true);
                  }}
                  onViewNotes={(notes: string) => {
                    setSelectedNotes(notes);
                    setShowNotesDialog(true);
                  }}
                  formatDate={formatDate}
                  formatTime={formatTime}
                />
                
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalCount}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}

            {/* Dialogs */}
            {selectedMember && (
              <MemberDetailDialog
                open={showMemberDetailDialog}
                onOpenChange={(open) => {
                  if (!open) {
                    setSelectedMember(null);
                  }
                  setShowMemberDetailDialog(open);
                }}
                member={selectedMember}
                onEditNotes={(regId: string, notes: string) => {
                  setEditingRegistrationId(regId);
                  setEditingNotes(notes);
                  setShowNotesEditDialog(true);
                }}
                onEditScore={(regId: string, score: number) => {
                  setEditingRegistrationId(regId);
                  setEditingScore(score);
                  setShowScoreEditDialog(true);
                }}
                formatDate={formatDate}
                formatTime={formatTime}
                getStatusBadge={getStatusBadge}
              />
            )}

            <NotesEditDialog
              open={showNotesEditDialog}
              onOpenChange={setShowNotesEditDialog}
              notes={editingNotes}
              submitting={submittingNotes}
              onSave={handleUpdateNotes}
              onNotesChange={setEditingNotes}
            />

            <ScoreEditDialog
              open={showScoreEditDialog}
              onOpenChange={setShowScoreEditDialog}
              score={editingScore}
              submitting={submittingScore}
              onSave={handleUpdateScore}
              onScoreChange={setEditingScore}
            />

            <NotesViewDialog
              open={showNotesDialog}
              onOpenChange={setShowNotesDialog}
              notes={selectedNotes}
            />

            {/* MCQ-related dialogs */}
            <MCQCreatorDialog
              open={showMCQCreator}
              onOpenChange={setShowMCQCreator}
              eventId={eventId || ''}
              existingTest={screeningTest}
              submitting={submittingScreening}
              onSave={handleSaveMCQTest}
              selectedAttendeesCount={selectedAttendees.length}
            />

            <MCQSenderDialog
              open={showMCQSender}
              onOpenChange={setShowMCQSender}
              screeningTest={screeningTest}
              selectedAttendees={selectedAttendees}
              registrations={registrations}
              submitting={submittingScreening}
              onSend={handleSendMCQTest}
            />
          </>
        )}
      </div>
    </div>
  );
}
