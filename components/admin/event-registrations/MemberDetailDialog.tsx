"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Trophy, Medal } from "lucide-react";

interface EventRegistration {
  id: string;
  registered_at: string;
  user_id: string;
  payment_id?: string | null;
  order_id?: string | null;
  amount_paid?: number | null;
  attended?: boolean;
  screening_status?: 'pending' | 'sent' | 'completed' | 'skipped';
  presentation_status?: 'pending' | 'submitted' | 'reviewed';
  qualification_status?: 'pending' | 'qualified' | 'rejected' | null;
  github_link?: string | null;
  deployment_link?: string | null;
  presentation_link?: string | null;
  presentation_notes?: string | null;
  award_type?: 'winner' | 'runner_up' | null;
  award_assigned_at?: string | null;
  admin_notes?: string | null;
  admin_score?: number | null;
  user: {
    name: string;
    email: string;
    linkedin: string | null;
  };
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
}

interface MemberDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: EventRegistration | null;
  onEditNotes: (registrationId: string, currentNotes: string) => void;
  onEditScore: (registrationId: string, currentScore: number) => void;
  formatDate: (dateString: string) => string;
  formatTime: (seconds: number) => string;
  getStatusBadge: (status: string) => React.ReactElement;
}

export function MemberDetailDialog({
  open,
  onOpenChange,
  member,
  onEditNotes,
  onEditScore,
  formatDate,
  formatTime,
  getStatusBadge
}: MemberDetailDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Complete Member Information</DialogTitle>
          <DialogDescription>
            Comprehensive details for {member.user?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Name</Label>
                <p className="text-sm text-gray-900">{member.user.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-sm text-gray-900">{member.user.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">LinkedIn</Label>
                {member.user.linkedin ? (
                  <a 
                    href={member.user.linkedin}
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
                <p className="text-sm text-gray-900">{formatDate(member.registered_at)}</p>
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
                  member.payment_id ? 'text-green-600' : 
                  member.amount_paid === 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {member.payment_id ? 'Paid' : 
                   member.amount_paid === 0 ? 'Free Event' : 'Unpaid'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Amount</Label>
                <p className="text-sm text-gray-900">₹{member.amount_paid || 0}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Payment ID</Label>
                <p className="text-sm text-gray-900">{member.payment_id || 'N/A'}</p>
              </div>
              {member.order_id && (
                <div className="col-span-3">
                  <Label className="text-sm font-medium text-gray-700">Order ID</Label>
                  <p className="text-sm text-gray-900 font-mono">{member.order_id}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Screening Test Information */}
          {member.screening_test && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Screening Test Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Test Title</Label>
                    <p className="text-sm text-gray-900">{member.screening_test.title}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(member.screening_status || 'pending')}
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Total Questions</Label>
                    <p className="text-sm text-gray-900">{member.screening_test.total_questions}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Time Limit</Label>
                    <p className="text-sm text-gray-900">{member.screening_test.timer_minutes} minutes</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Passing Score</Label>
                    <p className="text-sm text-gray-900">{member.screening_test.passing_score}%</p>
                  </div>
                  {member.screening_test.deadline && (
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Deadline</Label>
                      <p className="text-sm text-gray-900">{formatDate(member.screening_test.deadline)}</p>
                    </div>
                  )}
                </div>
                {member.screening_test.mcq_link && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">External Test Link</Label>
                    <a 
                      href={member.screening_test.mcq_link}
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
          {member.test_attempt && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Latest Test Attempt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Score</Label>
                    <p className={`text-lg font-bold ${
                      member.test_attempt.passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {member.test_attempt.score_percentage}% 
                      {member.test_attempt.passed ? ' (PASS)' : ' (FAIL)'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {Math.round((member.test_attempt.score_percentage * member.test_attempt.total_questions) / 100)}/{member.test_attempt.total_questions} correct
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Time Taken</Label>
                    <p className="text-sm text-gray-900">{formatTime(member.test_attempt.time_taken_seconds)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Tab Switches</Label>
                    <p className={`text-sm font-medium ${
                      member.test_attempt.tab_switches > 0 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {member.test_attempt.tab_switches}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Started At</Label>
                    <p className="text-sm text-gray-900">{formatDate(member.test_attempt.started_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Submitted At</Label>
                    <p className="text-sm text-gray-900">{formatDate(member.test_attempt.submitted_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Status</Label>
                    <p className="text-sm text-gray-900 capitalize">{member.test_attempt.status.replace('_', ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* All Test Attempts */}
          {member.all_test_attempts && member.all_test_attempts.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Test Attempts ({member.all_test_attempts.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {member.all_test_attempts.map((attempt, index) => (
                    <div key={attempt.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">Attempt {index + 1}</span>
                        <span className={`text-sm font-bold ${
                          attempt.score_percentage >= 70 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.score_percentage}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
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
                  {getStatusBadge(member.presentation_status || 'pending')}
                </div>
              </div>
              
              {(member.github_link || member.deployment_link || member.presentation_link) && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Project Links</Label>
                  <div className="mt-1 space-y-2">
                    {member.github_link && (
                      <div>
                        <Label className="text-xs text-gray-600">GitHub Repository</Label>
                        <a
                          href={member.github_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {member.github_link} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {member.deployment_link && (
                      <div>
                        <Label className="text-xs text-gray-600">Live Demo</Label>
                        <a
                          href={member.deployment_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                          {member.deployment_link} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {member.presentation_link && (
                      <div>
                        <Label className="text-xs text-gray-600">Presentation</Label>
                        <a
                          href={member.presentation_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          {member.presentation_link} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {member.presentation_notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Presentation Notes</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {member.presentation_notes}
                  </div>
                </div>
              )}
            </CardContent>
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
                  {member.admin_score !== null && member.admin_score !== undefined ? (
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-medium ${
                        member.admin_score >= 70 ? 'text-green-600' : 
                        member.admin_score >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {member.admin_score}/100
                      </span>
                      <Button
                        onClick={() => onEditScore(member.id, member.admin_score || 0)}
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
                        onClick={() => onEditScore(member.id, 0)}
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
                    {member.admin_score !== null && member.admin_score !== undefined ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.admin_score >= 80 ? 'bg-green-100 text-green-800' : 
                        member.admin_score >= 60 ? 'bg-yellow-100 text-yellow-800' : 
                        member.admin_score >= 40 ? 'bg-orange-100 text-orange-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {member.admin_score >= 80 ? 'Excellent' : 
                         member.admin_score >= 60 ? 'Good' : 
                         member.admin_score >= 40 ? 'Average' : 'Needs Improvement'}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">Not rated</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Admin Notes</Label>
                {member.admin_notes ? (
                  <div className="mt-1">
                    <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {member.admin_notes}
                    </div>
                    <Button
                      onClick={() => onEditNotes(member.id, member.admin_notes || '')}
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
                      onClick={() => onEditNotes(member.id, '')}
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
          {member.award_type && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Award Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Award Type</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {member.award_type === 'winner' ? (
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
                    <p className="text-sm text-gray-900">{member.award_assigned_at ? formatDate(member.award_assigned_at) : 'N/A'}</p>
                  </div>
                </div>
                {member.award_assigned_by_admin && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Assigned By</Label>
                    <p className="text-sm text-gray-900">
                      {member.award_assigned_by_admin.name} ({member.award_assigned_by_admin.email})
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
                <p className={`text-sm font-medium ${member.attended ? 'text-green-600' : 'text-red-600'}`}>
                  {member.attended ? 'Attended' : 'Not Attended'}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">User ID</Label>
                <p className="text-sm text-gray-900 font-mono">{member.user_id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
