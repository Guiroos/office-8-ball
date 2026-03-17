import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Placar | Office 8 Ball",
  description: "Rota legada que redireciona para o dashboard principal do Office 8 Ball.",
};

export default async function ScoreboardPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  redirect("/dashboard");
}
