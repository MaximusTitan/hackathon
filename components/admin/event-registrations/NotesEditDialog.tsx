"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface NotesEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  submitting: boolean;
}

export function NotesEditDialog({
  open,
  onOpenChange,
  notes,
  onNotesChange,
  onSave,
  submitting
}: NotesEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
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
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {submitting ? 'Saving...' : 'Save Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
