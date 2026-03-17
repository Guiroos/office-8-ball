import type { Metadata } from "next";

import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Office 8 Ball",
  description: "Placar principal com historico recente das partidas do Office 8 Ball.",
};

export default function DashboardPage() {
  return <Dashboard />;
}
