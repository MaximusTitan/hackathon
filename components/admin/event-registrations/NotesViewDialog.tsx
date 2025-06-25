"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NotesViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
}

export function NotesViewDialog({ open, onOpenChange, notes }: NotesViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Presentation Notes</DialogTitle>
          <DialogDescription>
            Full notes content for the presentation
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          <div className="whitespace-pre-wrap text-sm text-gray-700 p-4 bg-gray-50 rounded-lg">
            {notes || "No notes available."}
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            variant="outline"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
