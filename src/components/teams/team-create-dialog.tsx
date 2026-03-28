"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { TeamCreateForm } from "./team-create-form";

type TeamCreateDialogProps = {
  children: ReactNode;
};

export function TeamCreateDialog({ children }: TeamCreateDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Time</DialogTitle>
          <DialogDescription>
            Configure um time solo ou em dupla para registrar partidas e acompanhar a evolução no ranking.
          </DialogDescription>
        </DialogHeader>
        <TeamCreateForm onCancel={() => setOpen(false)} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
