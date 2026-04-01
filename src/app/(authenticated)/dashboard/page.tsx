import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Dashboard (legado) | Office 8 Ball",
  description: "Rota legada redirecionando para a area atual de times.",
};

export default function DashboardPage() {
  redirect("/times");
}
