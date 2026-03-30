"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  Mail,
  Pencil,
  Trophy,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import type { ProfilePageData, ProfileResponse } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProfilePageProps = {
  data: ProfilePageData & { email: string | null };
};

const ProfileEditDialog = dynamic(() =>
  import("@/components/profile/profile-edit-dialog").then((module) => ({
    default: module.ProfileEditDialog,
  })),
);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((c) => c.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

function formatJoinDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatWinRate(rate: number): string {
  return `${Math.round(rate)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfilePage({ data }: ProfilePageProps) {
  const { aggregate, teamRows } = data;

  // Editable profile fields — initialized from server-side data
  const [editableProfile, setEditableProfile] = useState<ProfileResponse>({
    id: data.userId,
    username: data.username,
    email: data.email,
    displayName: data.displayName,
    avatarUrl: data.avatarUrl,
    bio: data.bio,
    createdAt: data.createdAt,
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
    <div className="flex flex-col gap-8">
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

      {/* Stats Grid — PROF-01: wins, losses, win rate, total matches */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Vitórias" value={String(aggregate.wins)} />
        <StatTile label="Derrotas" value={String(aggregate.losses)} />
        <StatTile label="Win Rate" value={formatWinRate(aggregate.winRate)} />
        <StatTile label="Partidas" value={String(aggregate.totalMatches)} />
      </section>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Teams with per-team stats — PROF-02/03 */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Meus Times" title="Equipes" hideTitle />
              {teamRows.length === 0 ? (
                <IconCallout
                  icon={<Trophy className="size-5" />}
                  title="Nenhum time ainda"
                  description="Crie ou entre em um time para ver suas stats aqui."
                />
              ) : (
                <ul className="space-y-3">
                  {teamRows.map((row) => (
                    <li
                      key={row.teamId}
                      className="rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <p className="text-sm font-semibold">{row.teamName}</p>
                      <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                        <span>{row.wins}V</span>
                        <span>{row.losses}D</span>
                        <span>{formatWinRate(row.winRate)}</span>
                        <span>{row.totalMatches} partidas</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Account info */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Conta" title="Informações da Conta" hideTitle />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Usuário</span>
                  <span className="ml-auto font-medium">
                    {editableProfile.username}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="ml-auto font-medium">
                    {editableProfile.email ?? "—"}
                  </span>
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
        </div>

        {/* Right Column — placeholder for future match history */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader
                eyebrow="Histórico"
                title="Partidas Recentes"
                hideTitle
              />
              <p className="text-sm text-muted-foreground">
                Histórico de partidas disponível em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen ? (
        <ProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={editableProfile}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
