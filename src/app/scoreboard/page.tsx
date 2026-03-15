import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Dashboard } from "@/components/dashboard";
import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Placar | Office 8 Ball",
  description: "Placar principal com historico recente das partidas do Office 8 Ball.",
};

export default async function ScoreboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return <Dashboard user={user} />;
}
