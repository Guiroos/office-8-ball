import type { Metadata } from "next";

import { HeadToHeadView } from "@/components/head-to-head/head-to-head-view";

export const revalidate = 0;
import { IconCallout } from "@/components/primitives/icon-callout";
import { getAuthenticatedUser, hasDatabaseUrl } from "@/lib/auth";
import { resolveHeadToHeadData } from "@/lib/head-to-head";
import { listMatches } from "@/lib/data";
import { listUserTeams } from "@/lib/teams";

export const metadata: Metadata = {
  title: "Confronto Direto | Office 8 Ball",
  description: "Compare o histórico de partidas entre dois times.",
};

type HeadToHeadPageProps = {
  searchParams?: Promise<{ teamA?: string; teamB?: string }>;
};

export default async function HeadToHeadPage({ searchParams }: HeadToHeadPageProps) {
  // Dual-mode guard: page is available only with DATABASE_URL
  if (!hasDatabaseUrl()) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <IconCallout
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          title="Confronto Direto indisponível"
          description="Configure DATABASE_URL para acessar o histórico de confrontos diretos."
        />
      </main>
    );
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <IconCallout
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
          title="Autenticação necessária"
          description="Faça login para acessar o confronto direto."
        />
      </main>
    );
  }

  const resolved = (await searchParams) ?? {};
  const teamAParam = resolved.teamA?.trim() || undefined;
  const teamBParam = resolved.teamB?.trim() || undefined;

  const [userTeams, allMatches] = await Promise.all([
    listUserTeams(user.id),
    listMatches(user.id),
  ]);

  const data = resolveHeadToHeadData(teamAParam, teamBParam, userTeams, allMatches);

  return <HeadToHeadView data={data} />;
}
