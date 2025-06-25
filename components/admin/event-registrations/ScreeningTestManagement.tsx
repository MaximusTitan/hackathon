"use client";

import { Button } from "@/components/ui/button";
import { Send, FileText, Clock } from "lucide-react";

interface ScreeningTest {
  id: string;
  title?: string;
  questions?: any[];
  total_questions?: number;
}

interface ScreeningTestManagementProps {
  screeningTest: ScreeningTest | null;
  selectedAttendeesCount: number;
  eligibleCount: number;
  onCreateTest: () => void;
  onSendTest: () => void;
  onSendExternalTest: () => void;
  onSkipScreening: () => void;
  submitting: boolean;
}

export function ScreeningTestManagement({
  screeningTest,
  selectedAttendeesCount,
  eligibleCount,
  onCreateTest,
  onSendTest,
  onSendExternalTest,
  onSkipScreening,
  submitting
}: ScreeningTestManagementProps) {
  if (eligibleCount === 0) return null;

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold text-blue-900 mb-3">Screening Test Management</h3>
      <div className="flex flex-wrap gap-3">
        <Button 
          onClick={onCreateTest}
          className="bg-green-600 hover:bg-green-700 text-white"
          disabled={eligibleCount === 0}
        >
          <FileText className="mr-2 h-4 w-4" />
          {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0)
            ? 'Edit MCQ Test' 
            : 'Create MCQ Test'
          }
        </Button>

        {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0) && (
          <Button 
            onClick={onSendTest}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            disabled={eligibleCount === 0 || selectedAttendeesCount === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Send MCQ Test ({screeningTest.total_questions || screeningTest.questions?.length || 0} questions)
          </Button>
        )}
        
        <Button 
          onClick={onSendExternalTest}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          disabled={eligibleCount === 0}
        >
          <Send className="mr-2 h-4 w-4" />
          Send External Test Link
        </Button>

        <Button 
          onClick={onSkipScreening}
          variant="outline"
          disabled={selectedAttendeesCount === 0}
          className="border-orange-600 text-orange-600 hover:bg-orange-50"
        >
          <Clock className="mr-2 h-4 w-4" />
          Skip Screening for Selected
        </Button>
      </div>
      <p className="text-blue-700 text-sm mt-2">
        {screeningTest && ((screeningTest.questions?.length || 0) > 0 || (screeningTest.total_questions || 0) > 0)
          ? 'First select participants, then click "Send MCQ Test" to distribute the saved test. You can also edit the existing test or create external test links.'
          : 'Select attendees from the table below to create an integrated MCQ test or send external test links.'
        }
      </p>
    </div>
  );
}
