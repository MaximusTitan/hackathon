"use client";

import React from "react";
import type { EventRegistration } from "@/types/event";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  ExternalLink, 
  Clock, 
  CheckCircle, 
  Trophy, 
  Medal 
} from "lucide-react";

interface RegistrationsTableProps {
  registrations: EventRegistration[];
  selectedRegistrationIds: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  currentPage?: number;
  itemsPerPage?: number;
  eventCategory?: "hackathon" | "sales";
  onSort: (column: string) => void;
  onUpdateAttendance: (registrationId: string, attended: boolean) => void;
  onUpdateQualification: (registrationId: string, status: 'qualified' | 'rejected' | 'pending') => void;
  onUpdateAward: (registrationId: string, awardType: 'winner' | 'runner_up' | null) => void;
  onUpdateNotes: (registrationId: string, currentNotes: string) => void;
  onUpdateScore: (registrationId: string, currentScore: number) => void;
  onSelect: (registrationId: string, selected: boolean) => void;
  onViewDetails: (member: EventRegistration) => void;
  onViewNotes: (notes: string) => void;
  formatDate: (dateString: string) => string;
  formatTime: (seconds: number) => string;
}

export function RegistrationsTable({
  registrations,
  selectedRegistrationIds,
  sortBy,
  sortOrder,
  currentPage = 1,
  itemsPerPage = 25,
  eventCategory = "hackathon",
  onSort,
  onUpdateAttendance,
  onUpdateQualification,
  onUpdateAward,
  onUpdateNotes,
  onUpdateScore,
  onSelect,
  onViewDetails,
  onViewNotes,
  formatDate,
  formatTime
}: RegistrationsTableProps) {
  const getSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="h-3 w-3" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

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

  return (
    <div className="overflow-x-auto">
      <Table className="w-full min-w-[1700px]">
        <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none w-[280px] sticky left-0 z-20 bg-white border-r shadow-sm p-0"
                onClick={() => onSort('name')}
              >
                <div className="px-2 py-3 flex items-center gap-3">
                  <Checkbox
                    checked={registrations.length > 0 && registrations.every(reg => selectedRegistrationIds.includes(reg.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        registrations.forEach(reg => onSelect(reg.id, true));
                      } else {
                        registrations.forEach(reg => onSelect(reg.id, false));
                      }
                    }}
                  />
                  <span className="text-sm font-medium">No.</span>
                  <span className="flex items-center gap-1">
                    Name {getSortIcon('name')}
                  </span>
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none min-w-[200px] pl-4"
                onClick={() => onSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email {getSortIcon('email')}
                </div>
              </TableHead>
              <TableHead className="min-w-[100px]">LinkedIn</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none min-w-[140px]"
                onClick={() => onSort('registered_at')}
              >
                <div className="flex items-center gap-1">
                  Registered On {getSortIcon('registered_at')}
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none min-w-[80px]"
                onClick={() => onSort('attended')}
              >
                <div className="flex items-center gap-1">
                  Attended {getSortIcon('attended')}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">Screening Status</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none min-w-[100px]"
                onClick={() => onSort('test_score')}
              >
                <div className="flex items-center gap-1">
                  Test Score {getSortIcon('test_score')}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">
                {eventCategory === "sales" ? "Sales Presentation Status" : "Project Status"}
              </TableHead>
              <TableHead className="min-w-[120px]">Qualification Status</TableHead>
              <TableHead className="min-w-[100px]">Award Status</TableHead>
              <TableHead className="min-w-[150px]">Admin Notes</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50 select-none min-w-[100px]"
                onClick={() => onSort('admin_score')}
              >
                <div className="flex items-center gap-1">
                  Admin Score {getSortIcon('admin_score')}
                </div>
              </TableHead>
              <TableHead className="min-w-[120px]">
                {eventCategory === "sales" ? "Sales Links" : "Project Links"}
              </TableHead>
              <TableHead className="min-w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registrations.map((reg, idx) => (
              <TableRow key={reg.id}>
                <TableCell className="font-medium w-[280px] sticky left-0 z-10 bg-white border-r shadow-sm p-0">
                  <div className="px-2 py-2 flex items-center gap-3">
                    <Checkbox
                      checked={selectedRegistrationIds.includes(reg.id)}
                      onCheckedChange={(checked) => onSelect(reg.id, checked as boolean)}
                      disabled={!reg.attended || (reg.screening_status && reg.screening_status !== 'pending')}
                    />
                    <span className="text-sm text-gray-700 min-w-[30px] flex-shrink-0">
                      {(currentPage - 1) * itemsPerPage + idx + 1}
                    </span>
                    <span className="text-sm break-words leading-tight">
                      {reg.user?.name || "N/A"}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="pl-4">{reg.user?.email || "N/A"}</TableCell>
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
                    onCheckedChange={(checked) => onUpdateAttendance(reg.id, checked as boolean)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(reg.screening_status || 'pending')}
                    {reg.screening_test && (
                      <div className="text-xs text-gray-500">
                        {reg.screening_test.title}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
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
                  <div className="min-w-[140px]">
                    {(reg.presentation_status === 'submitted' || reg.presentation_status === 'reviewed') ? (
                      <Select
                        value={reg.qualification_status || 'pending'}
                        onValueChange={(value: 'qualified' | 'rejected' | 'pending') => 
                          onUpdateQualification(reg.id, value)
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
                </TableCell>
                <TableCell>
                  <div className="min-w-[120px]">
                    {reg.qualification_status === 'qualified' ? (
                      <Select
                        value={reg.award_type || 'none'}
                        onValueChange={(value: 'winner' | 'runner_up' | 'none') => 
                          onUpdateAward(reg.id, value === 'none' ? null : value)
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
                          onClick={() => onUpdateNotes(reg.id, reg.admin_notes || '')}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-blue-600 hover:text-blue-700 p-0"
                        >
                          Edit
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => onUpdateNotes(reg.id, '')}
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
                          onClick={() => onUpdateScore(reg.id, reg.admin_score || 0)}
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
                        onClick={() => onUpdateScore(reg.id, 0)}
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
                  {(eventCategory === "sales" && (reg.video_link || reg.sales_presentation_link)) || 
                   (eventCategory === "hackathon" && (reg.github_link || reg.deployment_link || reg.presentation_link)) ? (
                    <div className="space-y-1">
                      {eventCategory === "sales" ? (
                        // Sales event links
                        <>
                          {reg.video_link && (
                            <div>
                              <a
                                href={reg.video_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-red-600 hover:underline text-sm flex items-center gap-1"
                              >
                                Sales Video <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                          {reg.sales_presentation_link && (
                            <div>
                              <a
                                href={reg.sales_presentation_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-purple-600 hover:underline text-sm flex items-center gap-1"
                              >
                                Sales Materials <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}
                        </>
                      ) : (
                        // Hackathon event links
                        <>
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
                        </>
                      )}
                      {reg.presentation_notes && (
                        <div className="text-xs text-gray-600">
                          <button
                            onClick={() => onViewNotes(reg.presentation_notes!)}
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                            title="Click to view full notes"
                          >
                            Notes: {reg.presentation_notes.substring(0, 30)}...
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    onClick={() => onViewDetails(reg)}
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
        </Table>
      </div>
  );
}
