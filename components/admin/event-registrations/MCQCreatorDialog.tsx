"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import MCQTestCreator from "@/components/admin/MCQTestCreator";

interface ScreeningTest {
  id: string;
  title?: string;
  instructions: string;
  timer_minutes?: number;
  passing_score?: number;
  questions?: any[];
}

interface MCQCreatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  existingTest: ScreeningTest | null;
  selectedAttendeesCount: number;
  onSave: (testData: any) => Promise<void>;
  submitting: boolean;
}

export function MCQCreatorDialog({
  open,
  onOpenChange,
  eventId,
  existingTest,
  selectedAttendeesCount,
  onSave,
  submitting
}: MCQCreatorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create MCQ Screening Test</DialogTitle>
          <DialogDescription>
            Create an integrated MCQ test for selected attendees ({selectedAttendeesCount} selected)
          </DialogDescription>
        </DialogHeader>
        <MCQTestCreator
          eventId={eventId}
          existingTest={existingTest ? {
            id: existingTest.id,
            title: existingTest.title,
            instructions: existingTest.instructions,
            timer_minutes: existingTest.timer_minutes || 30,
            passing_score: existingTest.passing_score || 70,
            questions: Array.isArray(existingTest.questions) ? existingTest.questions : []
          } : null}
          onSave={onSave}
          isSubmitting={submitting}
          mode={existingTest ? 'edit' : 'create'}
        />
      </DialogContent>
    </Dialog>
  );
}
