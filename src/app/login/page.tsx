import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthUnavailableError,
  isAuthAvailable,
} from "@/lib/auth";
import { LoginScreen } from "@/components/login/login-screen";

export const metadata: Metadata = {
  title: "Login | Office 8 Ball",
  description: "Acesso ao placar interno do Office 8 Ball.",
};

export default async function LoginPage() {
  const user = await getAuthenticatedUser();
  const authAvailable = isAuthAvailable();

  if (user) {
    redirect("/scoreboard");
  }

  return (
    <LoginScreen
      authAvailable={authAvailable}
      authUnavailableReason={authAvailable ? undefined : getAuthUnavailableError() ?? undefined}
    />
  );
}
