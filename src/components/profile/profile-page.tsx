"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { IconCallout } from "@/components/primitives/icon-callout";
import { SectionHeader } from "@/components/primitives/section-header";
import { StatTile } from "@/components/primitives/stat-tile";
import { TEAMS } from "@/lib/constants";
import type { MatchRecord, MatchesResponse, ProfileResponse } from "@/lib/types";

import { ProfileEditDialog } from "./profile-edit-dialog";

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

function formatMatchDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileError, setProfileError] = useState(false);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [matchesError, setMatchesError] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gravatarUrl, setGravatarUrl] = useState<string | null>(null);
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: ProfileResponse) => setProfile(data))
      .catch(() => setProfileError(true));
  }, []);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: MatchesResponse) => setMatches(data.matches.slice(0, 5)))
      .catch(() => setMatchesError(true));
  }, []);

  useEffect(() => {
    if (!profile?.username) return;
    setAvatarLoadError(false);
    const encoder = new TextEncoder();
    crypto.subtle
      .digest("SHA-256", encoder.encode(profile.username.toLowerCase().trim()))
      .then((buffer) => {
        const hash = Array.from(new Uint8Array(buffer))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        setGravatarUrl(`https://www.gravatar.com/avatar/${hash}?d=identicon&s=96`);
      });
  }, [profile?.username]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleSave = useCallback((updated: ProfileResponse) => {
    setProfile(updated);
  }, []);

  if (profileError) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível sem conexão ao banco de dados."
        description="Tente novamente mais tarde."
      />
    );
  }

  const initials = profile ? getInitials(profile.username) : "";
  const avatarSrc = profile?.avatarUrl ?? gravatarUrl;

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
          <div className="flex size-24 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-2xl font-bold uppercase text-foreground overflow-hidden">
            {avatarSrc && !avatarLoadError ? (
              <img
                src={avatarSrc}
                alt={profile?.username}
                className="size-full object-cover"
                onError={() => setAvatarLoadError(true)}
              />
            ) : (
              initials || "OB"
            )}
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold">
              {profile?.displayName ?? profile?.username ?? "—"}
            </h2>
            <p className="text-muted-foreground">@{profile?.username ?? "—"}</p>
            {profile?.createdAt ? (
              <p className="mt-2 flex items-center justify-center gap-1 text-sm text-muted-foreground md:justify-start">
                <Calendar className="size-4" />
                entrou em {formatJoinDate(profile.createdAt)}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Vitórias" value="—" />
        <StatTile label="Win Rate" value="—" />
        <StatTile label="Partidas" value="—" />
        <StatTile label="Sequência" value="—" />
      </section>

      {/* Main Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Meus Times" title="Equipes" hideTitle />
              <IconCallout
                icon={<Trophy className="size-5" />}
                title="Nenhum time ainda"
                description="Nenhum time ainda — em breve"
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader eyebrow="Conta" title="Informações da Conta" hideTitle />
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Usuário</span>
                  <span className="ml-auto font-medium">
                    {profile?.username ?? "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="size-4 shrink-0 text-muted-foreground" />
                  <span className="text-muted-foreground">Email</span>
                  <span className="ml-auto font-medium">
                    {profile?.email ?? "—"}
                  </span>
                </div>
                {profile?.createdAt ? (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">Membro desde</span>
                    <span className="ml-auto font-medium">
                      {formatJoinDate(profile.createdAt)}
                    </span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="space-y-4 p-6">
              <SectionHeader
                eyebrow="Histórico"
                title="Partidas Recentes"
                hideTitle
              />
              <p className="text-xs text-muted-foreground">
                Últimas partidas registradas no sistema
              </p>
              {matchesError ? (
                <IconCallout
                  icon={<Trophy className="size-5" />}
                  title="Erro ao carregar partidas"
                  description="Não foi possível carregar as partidas."
                />
              ) : matches.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma partida registrada ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {matches.map((match) => {
                    const loser = TEAMS.find(
                      (t) => t.id !== match.winnerTeamId,
                    );
                    return (
                      <li
                        key={match.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-4"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-semibold">
                            {match.winnerName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            vs {loser?.displayName ?? "—"}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatMatchDate(match.playedAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {profile ? (
        <ProfileEditDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={profile}
          onSave={handleSave}
        />
      ) : null}
    </div>
  );
}
