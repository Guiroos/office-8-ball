import { prisma } from "@/lib/prisma";

export type UserProfile = {
  id: string;
  username: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date;
};

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return prisma.user.findUnique({
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
}
