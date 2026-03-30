"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type InviteMemberDialogProps = {
  teamId: string;
};

const InviteMemberDialogModal = dynamic(() =>
  import("@/components/teams/invite-member-dialog-modal").then((module) => ({
    default: module.InviteMemberDialogModal,
  })),
);

export function InviteMemberDialog({ teamId }: InviteMemberDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        className="w-full sm:w-auto"
        onClick={() => setOpen(true)}
      >
        Convidar Membro
      </Button>
      {open ? (
        <InviteMemberDialogModal open={open} onOpenChange={setOpen} teamId={teamId} />
      ) : null}
    </>
  );
}
