import type { Metadata } from "next";

import { ProfilePage } from "@/components/profile/profile-page";

export const metadata: Metadata = {
  title: "Perfil | Office 8 Ball",
  description: "Página de perfil do usuário autenticado.",
};

export default function ProfileRoute() {
  return <ProfilePage />;
}
