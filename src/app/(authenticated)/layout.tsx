import { redirect } from "next/navigation";

import { AppShell } from "@/components/authenticated/app-shell";
import { getAuthenticatedUser } from "@/lib/auth";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return <AppShell user={user}>{children}</AppShell>;
}
