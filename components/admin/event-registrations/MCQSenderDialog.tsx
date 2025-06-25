"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ScreeningTest {
  id: string;
  title?: string;
  instructions: string;
  timer_minutes?: number;
  passing_score?: number;
  total_questions?: number;
  questions?: any[];
}

interface EventRegistration {
  id: string;
  user: {
    name: string;
  };
}

interface MCQSenderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  screeningTest: ScreeningTest | null;
  selectedAttendees: string[];
  registrations: EventRegistration[];
  onSend: (testId: string) => void;
  submitting: boolean;
}

export function MCQSenderDialog({
  open,
  onOpenChange,
  screeningTest,
  selectedAttendees,
  registrations,
  onSend,
  submitting
}: MCQSenderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => screeningTest && onSend(screeningTest.id)}
            disabled={submitting || selectedAttendees.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Sending...' : 'Send MCQ Test'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
