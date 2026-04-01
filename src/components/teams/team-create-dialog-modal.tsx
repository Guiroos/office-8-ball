"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TeamCreateForm } from "@/components/teams/team-create-form";

type TeamCreateDialogModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TeamCreateDialogModal({
  open,
  onOpenChange,
}: TeamCreateDialogModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Time</DialogTitle>
          <DialogDescription>
            Configure um time solo ou em dupla para registrar partidas e acompanhar a evolução no ranking.
          </DialogDescription>
        </DialogHeader>
        <TeamCreateForm onCancel={() => onOpenChange(false)} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
