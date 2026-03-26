import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TeamDetailView } from "@/components/teams/team-detail-view";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { getTeamDetailData } from "@/lib/team-details";

export const metadata: Metadata = {
  title: "Detalhe do Time | Office 8 Ball",
  description: "Detalhes do time, estatísticas, membros e confrontos diretos.",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!hasDatabaseUrl()) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm text-muted-foreground">
          Detalhes do time indisponíveis sem banco configurado.
        </p>
      </main>
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    notFound();
  }

  const { id } = await params;
  const detail = await getTeamDetailData(id, user.id);

  if (!detail) {
    notFound();
  }

  return <TeamDetailView {...detail} />;
}
