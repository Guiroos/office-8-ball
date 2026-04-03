import { notFound } from "next/navigation";

import { TeamDetailView } from "@/components/teams/team-detail-view";
import { getTeamMainData } from "@/lib/team-details";

export async function TeamMainSection({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  const result = await getTeamMainData(teamId, userId);
  if (result.kind === "not-found") notFound();
  return <TeamDetailView viewerId={userId} {...result.data} />;
}
