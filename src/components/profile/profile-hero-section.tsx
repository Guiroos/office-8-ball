import { ProfileHeroClient } from "@/components/profile/profile-hero-client";
import { getUserProfile } from "@/lib/profile";

export async function ProfileHeroSection({ userId }: { userId: string }) {
  const dbUser = await getUserProfile(userId);

  if (!dbUser) return null;

  return (
    <ProfileHeroClient
      userId={dbUser.id}
      username={dbUser.username}
      email={dbUser.email}
      displayName={dbUser.displayName}
      avatarUrl={dbUser.avatarUrl}
      bio={dbUser.bio}
      createdAt={dbUser.createdAt.toISOString()}
    />
  );
}
