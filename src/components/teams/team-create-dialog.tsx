"use client";

import dynamic from "next/dynamic";
import {
  cloneElement,
  isValidElement,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { useState } from "react";

type TeamCreateDialogProps = {
  children: ReactNode;
};

const TeamCreateDialogModal = dynamic(() =>
  import("@/components/teams/team-create-dialog-modal").then((module) => ({
    default: module.TeamCreateDialogModal,
  })),
);

export function TeamCreateDialog({ children }: TeamCreateDialogProps) {
  const [open, setOpen] = useState(false);

  if (!isValidElement(children)) {
    return open ? <TeamCreateDialogModal open={open} onOpenChange={setOpen} /> : null;
  }

  const child = children as ReactElement<{ onClick?: (event: MouseEvent<HTMLElement>) => void }>;

  const trigger = cloneElement(
    child,
    {
      onClick: (event: MouseEvent<HTMLElement>) => {
        child.props.onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(true);
        }
      },
    },
  );

  return (
    <>
      {trigger}
      {open ? <TeamCreateDialogModal open={open} onOpenChange={setOpen} /> : null}
    </>
  );
}
