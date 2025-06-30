"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useEffect } from "react";
import type { EventRegistration } from "@/types/event";

interface ExportButtonProps {
  registrations: EventRegistration[];
  eventTitle?: string;
  disabled?: boolean;
  onExport?: () => void;
  exportData?: EventRegistration[];
}

export function ExportButton({ 
  registrations, 
  eventTitle = "Event", 
  disabled = false,
  onExport,
  exportData
}: ExportButtonProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatTime = (seconds: number) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-trigger export when exportData is available
  useEffect(() => {
    if (exportData && exportData.length > 0) {
      performExport(exportData);
    }
  }, [exportData]);

  const performExport = (dataToExport: EventRegistration[]) => {
    // Define headers
    const headers = [
      'Name',
      'Email',
      'LinkedIn',
      'Registration Date',
      'Attended',
      'Screening Status',
      'Test Score',
      'Test Percentage',
      'Test Passed',
      'Time Taken',
      'Tab Switches',
      'Presentation Status',
      'GitHub Link',
      'Deployment Link',
      'Presentation Link',
      'Qualification Status',
      'Award Type',
      'Admin Score',
      'Admin Notes',
      'Payment Amount'
    ];

    // Convert data to CSV format
    const csvData = dataToExport.map(reg => [
      reg.user.name || '',
      reg.user.email || '',
      reg.user.linkedin || '',
      formatDate(reg.registered_at),
      reg.attended ? 'Yes' : 'No',
      reg.screening_status || 'N/A',
      reg.test_attempt?.score || '',
      reg.test_attempt?.score_percentage ? `${reg.test_attempt.score_percentage}%` : '',
      reg.test_attempt?.passed ? 'Yes' : reg.test_attempt ? 'No' : '',
      reg.test_attempt?.time_taken_seconds ? formatTime(reg.test_attempt.time_taken_seconds) : '',
      reg.test_attempt?.tab_switches || '',
      reg.presentation_status || 'N/A',
      reg.github_link || '',
      reg.deployment_link || '',
      reg.presentation_link || '',
      reg.qualification_status || 'N/A',
      reg.award_type || '',
      reg.admin_score || '',
      reg.admin_notes || '',
      reg.amount_paid || ''
    ]);

    // Combine headers and data
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_registrations_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportToCSV = async () => {
    const dataToExport = exportData && exportData.length > 0 ? exportData : registrations;
    
    if (dataToExport.length === 0) {
      // Call optional callback to fetch export data if needed
      if (onExport) {
        onExport();
        return;
      }
      return;
    }

    performExport(dataToExport);
  };

  return (
    <Button
      variant="outline"
      onClick={exportToCSV}
      disabled={disabled || (registrations.length === 0 && (!exportData || exportData.length === 0))}
      className="flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
