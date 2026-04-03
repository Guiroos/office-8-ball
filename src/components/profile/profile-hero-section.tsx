import { ProfileHeroClient } from "@/components/profile/profile-hero-client";
import { prisma } from "@/lib/prisma";

export async function ProfileHeroSection({ userId }: { userId: string }) {
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
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
