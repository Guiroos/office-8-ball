import type { Metadata } from "next";
import { Trophy } from "lucide-react";

import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listUserTeams } from "@/lib/teams";
import { listMatches } from "@/lib/data";
import { computeProfilePageData } from "@/lib/profile-stats";
import { ProfilePage } from "@/components/profile/profile-page";
import { IconCallout } from "@/components/primitives/icon-callout";

export const metadata: Metadata = {
  title: "Perfil | Office 8 Ball",
  description: "Página de perfil do usuário autenticado.",
};

export default async function ProfileRoute() {
  if (!hasDatabaseUrl()) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível sem conexão ao banco de dados."
        description="Tente novamente mais tarde."
      />
    );
  }

  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível."
        description="Você precisa estar autenticado para ver o perfil."
      />
    );
  }

  // Fetch user identity fields from DB
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      username: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!dbUser) {
    return (
      <IconCallout
        icon={<Trophy className="size-5" />}
        title="Perfil indisponível."
        description="Usuário não encontrado."
      />
    );
  }

  // D-07: include archived teams so historical matches still count
  const [teams, matches] = await Promise.all([
    listUserTeams(user.id, true),
    listMatches(user.id),
  ]);

  // Compute aggregated profile stats (pure domain function)
  const computed = computeProfilePageData(user.id, teams, matches);

  // D-01: Override placeholder identity fields with real DB values
  const profileData = {
    ...computed,
    userId: dbUser.id,
    username: dbUser.username,
    displayName: dbUser.displayName,
    avatarUrl: dbUser.avatarUrl,
    bio: dbUser.bio,
    createdAt: dbUser.createdAt.toISOString(),
    email: dbUser.email,
  };

  return <ProfilePage data={profileData} />;
}
