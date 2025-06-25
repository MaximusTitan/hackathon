"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScoreEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  score: number;
  onScoreChange: (score: number) => void;
  onSave: () => void;
  submitting: boolean;
}

export function ScoreEditDialog({
  open,
  onOpenChange,
  score,
  onScoreChange,
  onSave,
  submitting
}: ScoreEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={score}
              onChange={(e) => onScoreChange(Number(e.target.value))}
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Saving...' : 'Save Score'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
