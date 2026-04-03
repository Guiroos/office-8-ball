import { ProfileStatsDisplay } from "@/components/profile/profile-stats-display";
import { listMatches } from "@/lib/data";
import { computeProfilePageData } from "@/lib/profile-stats";
import { listUserTeams } from "@/lib/teams";

export async function ProfileStatsSection({ userId }: { userId: string }) {
  // D-07: include archived teams so historical matches still count
  const [teams, matches] = await Promise.all([
    listUserTeams(userId, true),
    listMatches(userId),
  ]);

  const computed = computeProfilePageData(userId, teams, matches);

  return <ProfileStatsDisplay aggregate={computed.aggregate} teamRows={computed.teamRows} />;
}
