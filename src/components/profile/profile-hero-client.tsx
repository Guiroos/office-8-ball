"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { Calendar, Check, Copy, Mail, Pencil, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SectionHeader } from "@/components/primitives/section-header";
import { getInitials } from "@/lib/format";
import type { ProfileResponse } from "@/lib/types";

export type ProfileIdentity = {
  userId: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
};

const ProfileEditDialog = dynamic(() =>
  import("@/components/profile/profile-edit-dialog").then((module) => ({
    default: module.ProfileEditDialog,
  })),
);

function formatJoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

export function ProfileHeroClient(props: ProfileIdentity) {
  const [editableProfile, setEditableProfile] = useState<ProfileResponse>({
    id: props.userId,
    username: props.username,
    email: props.email,
    displayName: props.displayName,
    avatarUrl: props.avatarUrl,
    bio: props.bio,
    createdAt: props.createdAt,
  });
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSave = useCallback((updated: ProfileResponse) => {
    setEditableProfile(updated);
  }, []);

  const initials = getInitials(editableProfile.username);
  const avatarSrc = editableProfile.avatarUrl ?? null;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Player Profile</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            aria-label="Compartilhar perfil"
          >
            {copied ? (
              <Check className="mr-1 size-4" />
            ) : (
              <Copy className="mr-1 size-4" />
            )}
            {copied ? "Copiado!" : "Compartilhar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditOpen(true)}
            aria-label="Editar perfil"
          >
            <Pencil className="mr-1 size-4" />
            Editar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/10 p-6 lg:p-10">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <Avatar className="size-24 border-border bg-muted text-2xl">
            {avatarSrc && !avatarLoadError ? (
              <Image
                src={avatarSrc}
                alt={editableProfile.username}
                width={360}
                height={360}
                className="size-full object-cover"
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              <AvatarFallback className="bg-muted text-2xl font-bold">
                {initials || "OB"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold">
              {editableProfile.displayName ?? editableProfile.username}
            </h2>
            <p className="text-muted-foreground">@{editableProfile.username}</p>
            <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground md:justify-start">
              <Calendar className="size-4" />
              entrou em {formatJoinDate(editableProfile.createdAt)}
            </p>
          </div>
        </div>
      </section>

      {/* Account info */}
      <Card>
        <CardContent className="space-y-4 p-6">
          <SectionHeader eyebrow="Conta" title="Informações da Conta" hideTitle />
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Usuário</span>
              <span className="ml-auto font-medium">{editableProfile.username}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Email</span>
              <span className="ml-auto font-medium">{editableProfile.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-muted-foreground">Membro desde</span>
              <span className="ml-auto font-medium">
                {formatJoinDate(editableProfile.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {editOpen ? (
        <ProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={editableProfile}
          onSave={handleSave}
        />
      ) : null}
    </>
  );
}
