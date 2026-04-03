import { ProfileHeroClient } from "@/components/profile/profile-hero-client";
import { ProfileStatsDisplay } from "@/components/profile/profile-stats-display";
import type { ProfilePageData } from "@/lib/types";

export type ProfilePageProps = {
  data: ProfilePageData & { email: string | null };
};

export function ProfilePage({ data }: ProfilePageProps) {
  return (
    <div className="flex flex-col gap-8">
      <ProfileHeroClient
        userId={data.userId}
        username={data.username}
        email={data.email}
        displayName={data.displayName}
        avatarUrl={data.avatarUrl}
        bio={data.bio}
        createdAt={data.createdAt}
      />
      <ProfileStatsDisplay aggregate={data.aggregate} teamRows={data.teamRows} />
    </div>
  );
}
