"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface AttendanceManagementProps {
  unattendedCount: number;
  updatingBulkAttendance: boolean;
  onMarkAllAsAttended: () => void;
}

export function AttendanceManagement({ 
  unattendedCount, 
  updatingBulkAttendance, 
  onMarkAllAsAttended 
}: AttendanceManagementProps) {
  if (unattendedCount === 0) return null;

  return (
    <div className="mb-6 p-4 bg-green-50 rounded-lg">
      <h3 className="font-semibold text-green-900 mb-3">Attendance Management</h3>
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onMarkAllAsAttended}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={updatingBulkAttendance || unattendedCount === 0}
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {updatingBulkAttendance ? 'Updating...' : 'Mark All as Attended'}
        </Button>
        <div className="text-sm text-green-700 flex items-center">
          {unattendedCount} participants not yet marked as attended
        </div>
      </div>
    </div>
  );
}
